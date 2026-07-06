
-- Fix overly permissive INSERT policies
DROP POLICY "Authenticated can insert analyses" ON public.lab_analyses;
CREATE POLICY "Authenticated can insert analyses" ON public.lab_analyses 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = requested_by);

DROP POLICY "Authenticated can insert results" ON public.lab_results;
CREATE POLICY "Authenticated can insert results" ON public.lab_results 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = concluded_by);
