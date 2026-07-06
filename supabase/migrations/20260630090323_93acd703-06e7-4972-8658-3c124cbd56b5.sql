
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (id uuid, user_id uuid, full_name text, phone text, avatar_url text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.full_name, p.phone, p.avatar_url, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE public.is_admin()
  ORDER BY p.full_name;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
