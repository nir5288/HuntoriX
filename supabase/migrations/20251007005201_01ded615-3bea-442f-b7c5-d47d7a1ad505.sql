-- Create table for legal documents
CREATE TABLE public.legal_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Everyone can view legal documents
CREATE POLICY "Legal documents are viewable by everyone"
  ON public.legal_documents
  FOR SELECT
  USING (true);

-- Only admins can update legal documents
CREATE POLICY "Admins can update legal documents"
  ON public.legal_documents
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert legal documents
CREATE POLICY "Admins can insert legal documents"
  ON public.legal_documents
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default privacy policy
INSERT INTO public.legal_documents (document_type, title, content) VALUES (
  'privacy_policy',
  'Privacy Policy',
  '# Privacy Policy

Last updated: ' || to_char(now(), 'Month DD, YYYY') || '

## Introduction

Welcome to Huntorix. We respect your privacy and are committed to protecting your personal data.

## Information We Collect

We collect information that you provide directly to us, including:
- Name and contact information
- Professional information
- Account credentials
- Communications with us

## How We Use Your Information

We use the information we collect to:
- Provide and maintain our services
- Process your transactions
- Send you updates and marketing communications
- Improve our services

## Data Security

We implement appropriate security measures to protect your personal information.

## Your Rights

You have the right to access, correct, or delete your personal information.

## Contact Us

If you have questions about this Privacy Policy, please contact us.'
);

-- Insert default terms of service
INSERT INTO public.legal_documents (document_type, title, content) VALUES (
  'terms_of_service',
  'Terms of Service',
  '# Terms of Service

Last updated: ' || to_char(now(), 'Month DD, YYYY') || '

## Acceptance of Terms

By accessing and using Huntorix, you accept and agree to be bound by these Terms of Service.

## Use of Service

You agree to use our service only for lawful purposes and in accordance with these Terms.

## User Accounts

- You are responsible for maintaining the confidentiality of your account
- You must provide accurate information
- You must be at least 18 years old to use this service

## Intellectual Property

All content on Huntorix is owned by us or our licensors and is protected by intellectual property laws.

## Limitation of Liability

We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

## Changes to Terms

We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.

## Contact Us

If you have questions about these Terms, please contact us.'
);