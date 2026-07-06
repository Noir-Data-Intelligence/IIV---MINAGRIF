
-- Tighten activity_logs INSERT to require auth.uid()
DROP POLICY "Authenticated can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated can insert own logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
