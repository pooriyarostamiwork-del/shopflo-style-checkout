INSERT INTO storage.buckets (id, name, public) VALUES ('csv-uploads', 'csv-uploads', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Service role can manage csv uploads" ON storage.objects FOR ALL USING (bucket_id = 'csv-uploads') WITH CHECK (bucket_id = 'csv-uploads');