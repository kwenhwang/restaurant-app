-- Fix: collections + collection_items had only SELECT granted to authenticated;
-- INSERT/UPDATE/DELETE were denied at the GRANT level even though RLS policies
-- would have allowed them.

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;
