ALTER TABLE public.production_batches REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.stations REPLICA IDENTITY FULL;
ALTER TABLE public.quality_audits REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.production_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quality_audits;