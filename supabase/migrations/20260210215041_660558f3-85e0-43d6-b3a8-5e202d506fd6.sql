
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico', 'gestor', 'diretor', 'colaborador');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles per security requirement)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Departments table with hierarchy support
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-department association
CREATE TABLE public.user_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, department_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is current user admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Profiles RLS policies
CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile or admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admin can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- User roles RLS policies
CREATE POLICY "Authenticated can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admin can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admin can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admin can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin());

-- Departments RLS policies
CREATE POLICY "Authenticated can view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admin can insert departments"
  ON public.departments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admin can update departments"
  ON public.departments FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admin can delete departments"
  ON public.departments FOR DELETE TO authenticated
  USING (public.is_admin());

-- User departments RLS policies
CREATE POLICY "Authenticated can view user_departments"
  ON public.user_departments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admin can insert user_departments"
  ON public.user_departments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admin can update user_departments"
  ON public.user_departments FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admin can delete user_departments"
  ON public.user_departments FOR DELETE TO authenticated
  USING (public.is_admin());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default departments
INSERT INTO public.departments (name, description) VALUES
  ('Diagnóstico', 'Departamento de Diagnóstico Veterinário'),
  ('Produção', 'Departamento de Produção de Vacinas e Reagentes'),
  ('Investigação', 'Departamento de Investigação Científica'),
  ('Administração', 'Departamento Administrativo');
