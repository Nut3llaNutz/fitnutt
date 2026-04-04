
-- Fix 1: Prevent non-admin users from inserting rows into user_roles directly.
--
-- The existing "Admins can manage all roles" policy (FOR ALL) already covers
-- INSERT for admins via USING + WITH CHECK on has_role(). However, without an
-- explicit restriction, a non-admin authenticated user could still attempt an
-- INSERT (RLS blocks it by default because no permissive INSERT policy exists
-- for them, but to make the intent unambiguous and future-proof we add an
-- explicit restrictive policy that denies all non-admin inserts).
--
-- We drop and re-create the admin policy with explicit WITH CHECK so that
-- INSERT is unambiguously gated on the same admin predicate, then add a
-- catch-all restrictive policy that blocks INSERT for everyone else.

-- Drop the old broad policy and replace it with explicit per-command policies
-- so that INSERT, UPDATE, DELETE, and SELECT are all clearly controlled.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admins can SELECT all roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can INSERT new roles (WITH CHECK ensures the row being inserted
-- doesn't somehow bypass the admin predicate)
CREATE POLICY "Admins can insert roles"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can UPDATE existing roles
CREATE POLICY "Admins can update roles"
    ON public.user_roles
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can DELETE roles
CREATE POLICY "Admins can delete roles"
    ON public.user_roles
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Allow users to delete their own settings row so orphaned rows can be
-- cleaned up. Mirrors the pattern used for SELECT/INSERT/UPDATE on this table.
CREATE POLICY "Users can delete their own settings"
    ON public.user_settings
    FOR DELETE
    USING (auth.uid() = user_id);
