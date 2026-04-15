-- Phase 6: tighten ownership policies for role-safe writes and profile privacy

-- Meetings policies
DROP POLICY IF EXISTS "Auth users create meetings" ON public.meetings;
CREATE POLICY "Auth users create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth users update meetings" ON public.meetings;
CREATE POLICY "Auth users update meetings"
ON public.meetings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Participants policies
DROP POLICY IF EXISTS "Auth users join" ON public.participants;
CREATE POLICY "Auth users join"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth users update" ON public.participants;
CREATE POLICY "Auth users update"
ON public.participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Profiles select policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
