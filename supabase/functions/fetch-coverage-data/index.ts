import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repositoryIds } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Fetching coverage data for repositories:`, repositoryIds)

    // Get repositories for the user
    const { data: repositories, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', user.id)
      .in('id', repositoryIds)

    if (repoError) {
      console.error('Error fetching repositories:', repoError)
      throw repoError
    }

    console.log(`Found ${repositories?.length || 0} repositories for user`)

    // Get GitHub token for the user
    const { data: providerAccounts, error: providerError } = await supabase
      .from('provider_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .limit(1)

    if (providerError) {
      console.error('Error fetching provider accounts:', providerError)
      throw providerError
    }

    console.log(`Found ${providerAccounts?.length || 0} provider accounts`)

    const githubToken = providerAccounts?.[0]?.access_token
    if (!githubToken) {
      console.log('No GitHub token found - will use estimated coverage only')
      // Don't throw error, just proceed with estimation
    }

    const results = []

    // Fetch coverage data for each repository
    for (const repo of repositories) {
      try {
        console.log(`Fetching coverage for ${repo.full_name}`)
        
        // Try to get coverage from various sources
        let coverageData = null
        
        if (githubToken) {
          coverageData = await fetchCoverageFromGitHub(repo.full_name, githubToken)
        }
        
        if (!coverageData) {
          // If no coverage found, estimate based on test files
          coverageData = githubToken 
            ? await estimateCoverageFromTests(repo.full_name, githubToken)
            : { coverage: 0, testCount: 0, source: 'no_token' }
        }

        console.log(`Coverage data for ${repo.full_name}:`, coverageData)

        // Update repository with coverage data
        const { error: updateError } = await supabase
          .from('repositories')
          .update({
            coverage_percentage: coverageData.coverage,
            test_count: coverageData.testCount,
            last_coverage_update: new Date().toISOString()
          })
          .eq('id', repo.id)

        if (updateError) {
          console.error(`Error updating coverage for ${repo.full_name}:`, updateError)
        } else {
          console.log(`Successfully updated coverage for ${repo.full_name}`)
        }

        results.push({
          repositoryId: repo.id,
          success: !updateError,
          coverage: coverageData.coverage,
          testCount: coverageData.testCount,
          error: updateError?.message
        })
        
      } catch (error) {
        console.error(`Error processing ${repo.full_name}:`, error)
        results.push({
          repositoryId: repo.id,
          success: false,
          error: error.message
        })
      }
    }

    console.log('Final results:', results)

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in fetch-coverage-data function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function fetchCoverageFromGitHub(fullName: string, token: string) {
  // Try to fetch coverage from GitHub Actions artifacts or status checks
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  }

  try {
    // Check for coverage in commit status checks
    const commitsResponse = await fetch(`https://api.github.com/repos/${fullName}/commits`, { headers })
    if (!commitsResponse.ok) return null

    const commits = await commitsResponse.json()
    if (commits.length === 0) return null

    const latestCommit = commits[0]
    const statusResponse = await fetch(`https://api.github.com/repos/${fullName}/commits/${latestCommit.sha}/status`, { headers })
    
    if (statusResponse.ok) {
      const status = await statusResponse.json()
      
      // Look for coverage in status checks
      for (const statusCheck of status.statuses || []) {
        if (statusCheck.description && statusCheck.description.includes('coverage')) {
          const coverageMatch = statusCheck.description.match(/(\d+(?:\.\d+)?)%/)
          if (coverageMatch) {
            return {
              coverage: parseFloat(coverageMatch[1]),
              testCount: 0, // Will be estimated separately
              source: 'github_status'
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`Could not fetch coverage from GitHub status for ${fullName}:`, error.message)
  }

  return null
}

async function estimateCoverageFromTests(fullName: string, token: string) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  }

  try {
    // Get repository contents to analyze test structure
    const contentsResponse = await fetch(`https://api.github.com/repos/${fullName}/contents`, { headers })
    if (!contentsResponse.ok) {
      return { coverage: 0, testCount: 0, source: 'estimated' }
    }

    const contents = await contentsResponse.json()
    let testFileCount = 0
    let totalFileCount = 0

    // Count test files and total files
    const countFiles = async (items: any[], path = '') => {
      for (const item of items) {
        if (item.type === 'file') {
          totalFileCount++
          if (isTestFile(item.name)) {
            testFileCount++
          }
        } else if (item.type === 'dir' && shouldScanDirectory(item.name)) {
          try {
            const dirResponse = await fetch(`https://api.github.com/repos/${fullName}/contents/${item.path}`, { headers })
            if (dirResponse.ok) {
              const dirContents = await dirResponse.json()
              await countFiles(dirContents, item.path)
            }
          } catch (error) {
            console.log(`Could not scan directory ${item.path}:`, error.message)
          }
        }
      }
    }

    await countFiles(contents)

    // Estimate coverage based on test file ratio
    let estimatedCoverage = 0
    if (totalFileCount > 0) {
      const testRatio = testFileCount / totalFileCount
      // Simple heuristic: more test files = higher coverage
      estimatedCoverage = Math.min(testRatio * 200, 95) // Cap at 95%
    }

    return {
      coverage: Math.round(estimatedCoverage * 100) / 100,
      testCount: testFileCount,
      source: 'estimated'
    }

  } catch (error) {
    console.log(`Could not estimate coverage for ${fullName}:`, error.message)
    return { coverage: 0, testCount: 0, source: 'estimated' }
  }
}

function isTestFile(filename: string): boolean {
  const testPatterns = [
    /\.test\./,
    /\.spec\./,
    /_test\./,
    /_spec\./,
    /test_/,
    /spec_/,
    /Test\./,
    /Spec\./
  ]
  
  return testPatterns.some(pattern => pattern.test(filename))
}

function shouldScanDirectory(dirname: string): boolean {
  const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor']
  return !skipDirs.includes(dirname) && !dirname.startsWith('.')
}