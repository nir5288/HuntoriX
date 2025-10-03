DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can edit their sent messages'
  ) THEN
    CREATE POLICY "Users can edit their sent messages"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = from_user)
    WITH CHECK (auth.uid() = from_user);
  END IF;
END $$;