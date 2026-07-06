
-- Helper: técnico ou admin
-- Helper: gestor ou admin
-- (usamos has_role directamente)

-- ============ LAB_ANALYSES ============
DROP POLICY IF EXISTS "Authenticated can insert analyses" ON public.lab_analyses;
DROP POLICY IF EXISTS "Admin or requester can update analyses" ON public.lab_analyses;
DROP POLICY IF EXISTS "Only admin can delete analyses" ON public.lab_analyses;

CREATE POLICY "Admin or tecnico can insert analyses" ON public.lab_analyses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico')));

CREATE POLICY "Admin tecnico or requester can update analyses" ON public.lab_analyses
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico') OR auth.uid() = requested_by);

CREATE POLICY "Admin or tecnico can delete analyses" ON public.lab_analyses
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

-- ============ LAB_RESULTS ============
DROP POLICY IF EXISTS "Authenticated can insert results" ON public.lab_results;
DROP POLICY IF EXISTS "Admin can update results" ON public.lab_results;
DROP POLICY IF EXISTS "Only admin can delete results" ON public.lab_results;

CREATE POLICY "Admin or tecnico can insert results" ON public.lab_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = concluded_by AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico')));

CREATE POLICY "Admin or tecnico can update results" ON public.lab_results
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admin or tecnico can delete results" ON public.lab_results
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

-- ============ LAB_SUPPLIES ============
DROP POLICY IF EXISTS "Only admin can insert supplies" ON public.lab_supplies;
DROP POLICY IF EXISTS "Only admin can update supplies" ON public.lab_supplies;
DROP POLICY IF EXISTS "Only admin can delete supplies" ON public.lab_supplies;

CREATE POLICY "Admin or tecnico can insert supplies" ON public.lab_supplies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admin or tecnico can update supplies" ON public.lab_supplies
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admin or tecnico can delete supplies" ON public.lab_supplies
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tecnico'));

-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "Only admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admin can update products" ON public.products;
DROP POLICY IF EXISTS "Only admin can delete products" ON public.products;

CREATE POLICY "Admin or gestor can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ PRODUCTION_BATCHES ============
DROP POLICY IF EXISTS "Only admin can insert batches" ON public.production_batches;
DROP POLICY IF EXISTS "Only admin can update batches" ON public.production_batches;
DROP POLICY IF EXISTS "Only admin can delete batches" ON public.production_batches;

CREATE POLICY "Admin or gestor can insert batches" ON public.production_batches
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update batches" ON public.production_batches
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete batches" ON public.production_batches
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ PRODUCTION_PLANS ============
DROP POLICY IF EXISTS "Only admin can insert plans" ON public.production_plans;
DROP POLICY IF EXISTS "Only admin can update plans" ON public.production_plans;
DROP POLICY IF EXISTS "Only admin can delete plans" ON public.production_plans;

CREATE POLICY "Admin or gestor can insert plans" ON public.production_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update plans" ON public.production_plans
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete plans" ON public.production_plans
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ BATCH_DISTRIBUTIONS ============
DROP POLICY IF EXISTS "Only admin can insert distributions" ON public.batch_distributions;
DROP POLICY IF EXISTS "Only admin can update distributions" ON public.batch_distributions;
DROP POLICY IF EXISTS "Only admin can delete distributions" ON public.batch_distributions;

CREATE POLICY "Admin or gestor can insert distributions" ON public.batch_distributions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update distributions" ON public.batch_distributions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete distributions" ON public.batch_distributions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ STATIONS ============
DROP POLICY IF EXISTS "Only admin can insert stations" ON public.stations;
DROP POLICY IF EXISTS "Only admin can update stations" ON public.stations;
DROP POLICY IF EXISTS "Only admin can delete stations" ON public.stations;

CREATE POLICY "Admin or gestor can insert stations" ON public.stations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update stations" ON public.stations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete stations" ON public.stations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ QUALITY_AUDITS ============
DROP POLICY IF EXISTS "Only admin can insert audits" ON public.quality_audits;
DROP POLICY IF EXISTS "Only admin can update audits" ON public.quality_audits;
DROP POLICY IF EXISTS "Only admin can delete audits" ON public.quality_audits;

CREATE POLICY "Admin or gestor can insert audits" ON public.quality_audits
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update audits" ON public.quality_audits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete audits" ON public.quality_audits
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ NONCONFORMITIES ============
DROP POLICY IF EXISTS "Only admin can insert nonconformities" ON public.nonconformities;
DROP POLICY IF EXISTS "Only admin can update nonconformities" ON public.nonconformities;
DROP POLICY IF EXISTS "Only admin can delete nonconformities" ON public.nonconformities;

CREATE POLICY "Admin or gestor can insert nonconformities" ON public.nonconformities
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can update nonconformities" ON public.nonconformities
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admin or gestor can delete nonconformities" ON public.nonconformities
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

-- ============ ACTIVITY_LOGS — director também pode ver ============
DROP POLICY IF EXISTS "Only admin can view logs" ON public.activity_logs;

CREATE POLICY "Admin or director can view logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'diretor'));
