-- SECURITY FIX: current_subscription leaked every user's subscription data.
--
-- A plain (non-security_invoker) view runs with the VIEW OWNER's privileges and
-- does NOT apply the underlying table's RLS to the caller. subscriptions has
-- owner-scoped RLS, but the view bypassed it — any authenticated user could
-- `select * from current_subscription` via PostgREST and read every user's
-- status / plan / user_id. (PG15+ supports security_invoker on views.)
--
-- With security_invoker = true the view executes as the caller, so the
-- subscriptions RLS (auth.uid() = user_id) applies and each user sees only
-- their own row.

alter view public.current_subscription set (security_invoker = true);
