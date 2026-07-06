
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  respondida BOOLEAN NOT NULL DEFAULT false,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contact_messages_created ON public.contact_messages (created_at DESC);
