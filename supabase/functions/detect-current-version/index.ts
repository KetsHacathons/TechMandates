import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DetectVersionRequest {
  repositoryId: string;
  technology: string;
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
    console.log('Starting version detection...');
    
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
    
    const { repositoryId, technology }: DetectVersionRequest = await req.json();
    
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

    console.log(`Detecting ${technology} version for ${repository.full_name}`);

    // GitHub API base URL
    const githubApiBase = 'https://api.github.com';
    const [owner, repo] = repository.full_name.split('/');

    // Detect current version based on technology
    const currentVersion = await detectCurrentVersion(githubApiBase, owner, repo, githubToken, technology);

    return new Response(JSON.stringify({
      success: true,
      currentVersion,
      technology,
      repositoryName: repository.full_name,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error detecting current version:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to detect current version based on technology
async function detectCurrentVersion(
  githubApiBase: string,
  owner: string,
  repo: string,
  token: string,
  technology: string
): Promise<string | null> {
  try {
    if (technology === 'Java') {
      // Check pom.xml first
      const pomFile = await getFileContent(githubApiBase, owner, repo, token, 'pom.xml');
      if (pomFile) {
        // Look for detailed version first (e.g., 17.0.5)
        const detailedVersionMatch = pomFile.match(/<java\.version>(\d+\.\d+\.\d+)<\/java\.version>/);
        if (detailedVersionMatch) return detailedVersionMatch[1];
        
        // Look for major version (e.g., 17)
        const javaVersionMatch = pomFile.match(/<java\.version>(\d+)<\/java\.version>/);
        if (javaVersionMatch) return javaVersionMatch[1];
        
        // Look for compiler source with detailed version
        const detailedSourceMatch = pomFile.match(/<maven\.compiler\.source>(\d+\.\d+\.\d+)<\/maven\.compiler\.source>/);
        if (detailedSourceMatch) return detailedSourceMatch[1];
        
        const sourceMatch = pomFile.match(/<maven\.compiler\.source>(\d+)<\/maven\.compiler\.source>/);
        if (sourceMatch) return sourceMatch[1];
      }

      // Check build.gradle
      const gradleFile = await getFileContent(githubApiBase, owner, repo, token, 'build.gradle');
      if (gradleFile) {
        // Look for detailed version format
        const detailedSourceMatch = gradleFile.match(/sourceCompatibility\s*=\s*['\"]?(\d+\.\d+\.\d+)['\"]?/);
        if (detailedSourceMatch) return detailedSourceMatch[1];
        
        const sourceMatch = gradleFile.match(/sourceCompatibility\s*=\s*['\"]?(\d+)['\"]?/);
        if (sourceMatch) return sourceMatch[1];
      }
    }
    else if (technology === 'TypeScript') {
      const packageFile = await getFileContent(githubApiBase, owner, repo, token, 'package.json');
      if (packageFile) {
        const packageJson = JSON.parse(packageFile);
        if (packageJson.devDependencies?.typescript) {
          return packageJson.devDependencies.typescript.replace(/[\^~]/, '');
        }
        if (packageJson.dependencies?.typescript) {
          return packageJson.dependencies.typescript.replace(/[\^~]/, '');
        }
      }
    }
    else if (technology === 'Angular') {
      const packageFile = await getFileContent(githubApiBase, owner, repo, token, 'package.json');
      if (packageFile) {
        const packageJson = JSON.parse(packageFile);
        if (packageJson.dependencies?.['@angular/core']) {
          const version = packageJson.dependencies['@angular/core'].replace(/[\^~]/, '');
          return version.split('.')[0]; // Return major version only
        }
      }
    }
    else if (technology === 'Node.js') {
      const packageFile = await getFileContent(githubApiBase, owner, repo, token, 'package.json');
      if (packageFile) {
        const packageJson = JSON.parse(packageFile);
        if (packageJson.engines?.node) {
          return packageJson.engines.node.replace(/[>=<^~]/, '');
        }
      }
    }
    else if (technology === 'Python') {
      // Check pyproject.toml
      const pyprojectFile = await getFileContent(githubApiBase, owner, repo, token, 'pyproject.toml');
      if (pyprojectFile) {
        const pythonMatch = pyprojectFile.match(/python\s*=\s*['\"][\^>=]*(\d+\.\d+)['\"]?/);
        if (pythonMatch) return pythonMatch[1];
      }

      // Check runtime.txt (common in Python deployments)
      const runtimeFile = await getFileContent(githubApiBase, owner, repo, token, 'runtime.txt');
      if (runtimeFile) {
        const pythonMatch = runtimeFile.match(/python-(\d+\.\d+\.\d+)/);
        if (pythonMatch) return pythonMatch[1];
      }
    }
    else if (technology === 'React') {
      const packageFile = await getFileContent(githubApiBase, owner, repo, token, 'package.json');
      if (packageFile) {
        const packageJson = JSON.parse(packageFile);
        if (packageJson.dependencies?.react) {
          return packageJson.dependencies.react.replace(/[\^~]/, '');
        }
      }
    }

    return null;
  } catch (error) {
    console.log(`Error detecting ${technology} version:`, error.message);
    return null;
  }
}

// Helper function to get file content
async function getFileContent(
  githubApiBase: string,
  owner: string,
  repo: string,
  token: string,
  path: string
): Promise<string | null> {
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
    return atob(data.content);
  } catch (error) {
    return null;
  }
}