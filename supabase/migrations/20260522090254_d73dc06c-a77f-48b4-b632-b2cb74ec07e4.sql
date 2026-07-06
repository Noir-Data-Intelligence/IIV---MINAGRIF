ALTER TABLE public.processes REPLICA IDENTITY FULL;
ALTER TABLE public.process_steps REPLICA IDENTITY FULL;
ALTER TABLE public.process_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.processes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.process_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.process_events;