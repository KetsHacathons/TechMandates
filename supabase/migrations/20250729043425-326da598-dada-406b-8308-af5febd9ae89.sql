-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create repositories table
CREATE TABLE public.repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'bitbucket')),
  external_id TEXT NOT NULL,
  clone_url TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  is_private BOOLEAN DEFAULT false,
  description TEXT,
  language TEXT,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on repositories
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- Create repositories policies
CREATE POLICY "Users can view their own repositories" 
ON public.repositories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own repositories" 
ON public.repositories 
FOR ALL 
USING (auth.uid() = user_id);

-- Create provider_accounts table to store OAuth tokens
CREATE TABLE public.provider_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'bitbucket')),
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on provider_accounts
ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;

-- Create provider_accounts policies
CREATE POLICY "Users can view their own provider accounts" 
ON public.provider_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own provider accounts" 
ON public.provider_accounts 
FOR ALL 
USING (auth.uid() = user_id);

-- Create scan_results table
CREATE TABLE public.scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('vulnerability', 'version_upgrade', 'test_coverage')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  line_number INTEGER,
  rule_id TEXT,
  package_name TEXT,
  current_version TEXT,
  recommended_version TEXT,
  coverage_percentage DECIMAL(5,2),
  metadata JSONB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scan_results
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- Create scan_results policies
CREATE POLICY "Users can view scan results for their repositories" 
ON public.scan_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.repositories 
    WHERE repositories.id = scan_results.repository_id 
    AND repositories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage scan results for their repositories" 
ON public.scan_results 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.repositories 
    WHERE repositories.id = scan_results.repository_id 
    AND repositories.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON public.repositories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_accounts_updated_at
  BEFORE UPDATE ON public.provider_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scan_results_updated_at
  BEFORE UPDATE ON public.scan_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'preferred_username',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();