-- Tipo de notificação
CREATE TYPE public.notification_type AS ENUM ('info', 'sucesso', 'aviso', 'erro');

-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Utilizador vê apenas as próprias notificações
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Utilizador marca como lida / apaga as próprias
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admin pode inserir para qualquer utilizador; outros só para si próprios
CREATE POLICY "Admin or self can insert notifications"
ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;