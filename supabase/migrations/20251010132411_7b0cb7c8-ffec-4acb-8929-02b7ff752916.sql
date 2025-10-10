-- Add admin policy to allow admins to update any job
CREATE POLICY "Admins can update any job"
ON public.jobs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));