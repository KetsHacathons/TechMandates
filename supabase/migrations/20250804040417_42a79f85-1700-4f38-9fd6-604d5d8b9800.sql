-- Add coverage tracking to repositories table
ALTER TABLE public.repositories 
ADD COLUMN IF NOT EXISTS coverage_percentage DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS test_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_coverage_update TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_repositories_coverage ON public.repositories(coverage_percentage);

-- Add comments for clarity
COMMENT ON COLUMN public.repositories.coverage_percentage IS 'Current code coverage percentage (0-100)';
COMMENT ON COLUMN public.repositories.test_count IS 'Number of tests in the repository';
COMMENT ON COLUMN public.repositories.last_coverage_update IS 'Last time coverage data was updated';