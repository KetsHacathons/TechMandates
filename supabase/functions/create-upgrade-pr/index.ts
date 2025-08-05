import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpgradeRequest {
  repositoryId: string;
  technology: string;
  targetVersion: string;
}

// Initialize Supabase client - will be recreated with user context
let supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting upgrade PR creation...');
    
    // Get the authorization header to authenticate as the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create authenticated Supabase client with user's token
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { authorization: authHeader } } }
    );
    
    const { repositoryId, technology, targetVersion }: UpgradeRequest = await req.json();
    
    // Get GitHub token from secrets
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    // Get repository details from database
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repository) {
      throw new Error('Repository not found');
    }

    console.log(`Processing upgrade for ${repository.full_name}: ${technology} -> ${targetVersion}`);

    // Create branch name
    const branchName = `upgrade/${technology.toLowerCase()}-${targetVersion}-${Date.now()}`;
    
    // GitHub API base URL
    const githubApiBase = 'https://api.github.com';
    const [owner, repo] = repository.full_name.split('/');

    // 1. Get the default branch SHA
    console.log('Getting default branch info...');
    const branchResponse = await fetch(
      `${githubApiBase}/repos/${owner}/${repo}/git/refs/heads/${repository.default_branch}`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!branchResponse.ok) {
      throw new Error(`Failed to get branch info: ${branchResponse.statusText}`);
    }

    const branchData = await branchResponse.json();
    const baseSha = branchData.object.sha;

    // 2. Create new branch
    console.log(`Creating branch: ${branchName}`);
    const createBranchResponse = await fetch(
      `${githubApiBase}/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    if (!createBranchResponse.ok) {
      throw new Error(`Failed to create branch: ${createBranchResponse.statusText}`);
    }

    // 3. Get current files that need to be updated
    console.log('Getting files to update...');
    const filesToUpdate = await getFilesToUpdate(githubApiBase, owner, repo, githubToken, technology, targetVersion);

    // 4. Update files in the new branch
    for (const file of filesToUpdate) {
      console.log(`Updating file: ${file.path}`);
      await updateFile(githubApiBase, owner, repo, githubToken, branchName, file);
    }

    // 5. Create pull request
    console.log('Creating pull request...');
    const prResponse = await fetch(
      `${githubApiBase}/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Upgrade ${technology} to version ${targetVersion}`,
          head: branchName,
          base: repository.default_branch,
          body: `## Version Upgrade

This PR upgrades ${technology} from the current version to ${targetVersion}.

### Changes Made:
${filesToUpdate.map(f => `- Updated \`${f.path}\``).join('\n')}

### Next Steps:
1. Review the changes carefully
2. Test the upgrade in a development environment
3. Merge this PR when ready

### Notes:
- This upgrade was automatically generated
- Please verify all dependencies are compatible
- Consider running tests before merging`,
        }),
      }
    );

    if (!prResponse.ok) {
      throw new Error(`Failed to create pull request: ${prResponse.statusText}`);
    }

    const prData = await prResponse.json();

    // 6. Log the upgrade in database
    await supabase.from('scan_results').insert({
      repository_id: repositoryId,
      scan_type: 'version_upgrade',
      title: `${technology} upgrade to ${targetVersion}`,
      description: `Automated upgrade of ${technology} to version ${targetVersion}`,
      status: 'open',
      metadata: {
        technology,
        targetVersion,
        branchName,
        prNumber: prData.number,
        prUrl: prData.html_url,
      },
    });

    console.log(`Successfully created PR: ${prData.html_url}`);

    return new Response(JSON.stringify({
      success: true,
      pullRequestUrl: prData.html_url,
      pullRequestNumber: prData.number,
      branchName,
      message: `Successfully created pull request #${prData.number} for ${technology} upgrade to ${targetVersion}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating upgrade PR:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to determine which files need to be updated based on technology
async function getFilesToUpdate(
  githubApiBase: string,
  owner: string,
  repo: string,
  token: string,
  technology: string,
  targetVersion: string
): Promise<Array<{ path: string; content: string; sha: string }>> {
  const filesToUpdate = [];

  if (technology === 'Java') {
    // Check for pom.xml (Maven)
    const pomFile = await getFileIfExists(githubApiBase, owner, repo, token, 'pom.xml');
    if (pomFile) {
      const updatedContent = updateJavaVersion(pomFile.content, targetVersion);
      filesToUpdate.push({ ...pomFile, content: updatedContent });
    }

    // Check for build.gradle (Gradle)
    const gradleFile = await getFileIfExists(githubApiBase, owner, repo, token, 'build.gradle');
    if (gradleFile) {
      const updatedContent = updateJavaVersionInGradle(gradleFile.content, targetVersion);
      filesToUpdate.push({ ...gradleFile, content: updatedContent });
    }
  } else if (technology === 'Angular') {
    // Check for package.json
    const packageFile = await getFileIfExists(githubApiBase, owner, repo, token, 'package.json');
    if (packageFile) {
      const updatedContent = updateAngularVersion(packageFile.content, targetVersion);
      filesToUpdate.push({ ...packageFile, content: updatedContent });
    }
  } else if (technology === 'Python') {
    // Check for requirements.txt
    const reqFile = await getFileIfExists(githubApiBase, owner, repo, token, 'requirements.txt');
    if (reqFile) {
      const updatedContent = updatePythonVersion(reqFile.content, targetVersion);
      filesToUpdate.push({ ...reqFile, content: updatedContent });
    }

    // Check for pyproject.toml
    const pyprojectFile = await getFileIfExists(githubApiBase, owner, repo, token, 'pyproject.toml');
    if (pyprojectFile) {
      const updatedContent = updatePythonVersionInPyproject(pyprojectFile.content, targetVersion);
      filesToUpdate.push({ ...pyprojectFile, content: updatedContent });
    }
  } else if (technology === 'TypeScript') {
    // Check for package.json to update TypeScript version
    const packageFile = await getFileIfExists(githubApiBase, owner, repo, token, 'package.json');
    if (packageFile) {
      const updatedContent = updateTypeScriptVersion(packageFile.content, targetVersion);
      filesToUpdate.push({ ...packageFile, content: updatedContent });
    }

    // Check for tsconfig.json
    const tsconfigFile = await getFileIfExists(githubApiBase, owner, repo, token, 'tsconfig.json');
    if (tsconfigFile) {
      const updatedContent = updateTsConfigVersion(tsconfigFile.content, targetVersion);
      filesToUpdate.push({ ...tsconfigFile, content: updatedContent });
    }
  } else if (technology === 'Node.js') {
    // Check for package.json to update Node.js engines version
    const packageFile = await getFileIfExists(githubApiBase, owner, repo, token, 'package.json');
    if (packageFile) {
      const updatedContent = updateNodeJsVersion(packageFile.content, targetVersion);
      filesToUpdate.push({ ...packageFile, content: updatedContent });
    }
  }

  return filesToUpdate;
}

// Helper function to get file if it exists
async function getFileIfExists(
  githubApiBase: string,
  owner: string,
  repo: string,
  token: string,
  path: string
): Promise<{ path: string; content: string; sha: string } | null> {
  try {
    const response = await fetch(
      `${githubApiBase}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = atob(data.content);
    
    return {
      path,
      content,
      sha: data.sha,
    };
  } catch (error) {
    console.log(`File ${path} not found or error accessing it:`, error.message);
    return null;
  }
}

// Helper function to update file
async function updateFile(
  githubApiBase: string,
  owner: string,
  repo: string,
  token: string,
  branch: string,
  file: { path: string; content: string; sha: string }
) {
  const response = await fetch(
    `${githubApiBase}/repos/${owner}/${repo}/contents/${file.path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update ${file.path} for version upgrade`,
        content: btoa(file.content),
        sha: file.sha,
        branch,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update ${file.path}: ${response.statusText}`);
  }
}

// Version update functions
function updateJavaVersion(content: string, targetVersion: string): string {
  // Update Java version in pom.xml - handle both major versions (21) and detailed versions (21.0.2)
  return content
    .replace(/<java\.version>[\d.]+<\/java\.version>/g, `<java.version>${targetVersion}</java.version>`)
    .replace(/<maven\.compiler\.source>[\d.]+<\/maven\.compiler\.source>/g, `<maven.compiler.source>${targetVersion}</maven.compiler.source>`)
    .replace(/<maven\.compiler\.target>[\d.]+<\/maven\.compiler\.target>/g, `<maven.compiler.target>${targetVersion}</maven.compiler.target>`);
}

function updateJavaVersionInGradle(content: string, targetVersion: string): string {
  // Update Java version in build.gradle - handle both major versions (21) and detailed versions (21.0.2)
  return content
    .replace(/sourceCompatibility\s*=\s*['\"]?[\d.]+['\"]?/g, `sourceCompatibility = '${targetVersion}'`)
    .replace(/targetCompatibility\s*=\s*['\"]?[\d.]+['\"]?/g, `targetCompatibility = '${targetVersion}'`);
}

function updateAngularVersion(content: string, targetVersion: string): string {
  const packageJson = JSON.parse(content);
  
  // Update Angular dependencies
  const angularPackages = [
    '@angular/core',
    '@angular/common',
    '@angular/platform-browser',
    '@angular/router',
    '@angular/forms',
    '@angular/http',
    '@angular/animations',
    '@angular/cli',
    '@angular/compiler-cli'
  ];

  angularPackages.forEach(pkg => {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      packageJson.dependencies[pkg] = `^${targetVersion}.0.0`;
    }
    if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
      packageJson.devDependencies[pkg] = `^${targetVersion}.0.0`;
    }
  });

  return JSON.stringify(packageJson, null, 2);
}

function updatePythonVersion(content: string, targetVersion: string): string {
  // This is a simple example - in practice, you'd need more sophisticated logic
  // to update Python dependencies and requirements
  return content.replace(/python_requires\s*=\s*['\"]>=\d+\.\d+['\"]/, `python_requires=">=3.${targetVersion.split('.')[1]}"`);
}

function updatePythonVersionInPyproject(content: string, targetVersion: string): string {
  // Update Python version in pyproject.toml
  return content.replace(/python\s*=\s*['\"].*?['\"]/, `python = "^${targetVersion}"`);
}

function updateTypeScriptVersion(content: string, targetVersion: string): string {
  const packageJson = JSON.parse(content);
  
  // Update TypeScript in devDependencies
  if (packageJson.devDependencies && packageJson.devDependencies['typescript']) {
    packageJson.devDependencies['typescript'] = `^${targetVersion}`;
  }
  
  // Update @types/* packages if they exist
  Object.keys(packageJson.devDependencies || {}).forEach(pkg => {
    if (pkg.startsWith('@types/')) {
      // Keep @types packages at latest for the target TypeScript version
      packageJson.devDependencies[pkg] = 'latest';
    }
  });

  return JSON.stringify(packageJson, null, 2);
}

function updateTsConfigVersion(content: string, targetVersion: string): string {
  const tsconfig = JSON.parse(content);
  
  // Update TypeScript compiler options target based on version
  if (tsconfig.compilerOptions) {
    // Map TypeScript versions to target versions
    const versionTargetMap: { [key: string]: string } = {
      '5.3': 'ES2022',
      '5.2': 'ES2022', 
      '5.1': 'ES2022',
      '5.0': 'ES2020',
      '4.9': 'ES2020'
    };
    
    tsconfig.compilerOptions.target = versionTargetMap[targetVersion] || 'ES2020';
  }

  return JSON.stringify(tsconfig, null, 2);
}

function updateNodeJsVersion(content: string, targetVersion: string): string {
  const packageJson = JSON.parse(content);
  
  // Update Node.js engines version
  if (!packageJson.engines) {
    packageJson.engines = {};
  }
  
  packageJson.engines.node = `>=${targetVersion}`;
  
  return JSON.stringify(packageJson, null, 2);
}