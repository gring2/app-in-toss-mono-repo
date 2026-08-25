drop policy if exists "owners can read their rooms" on public.perception_rooms;
drop policy if exists "direct response access is disabled" on public.perception_responses;

revoke all on table public.perception_rooms from anon, authenticated;
revoke all on table public.perception_responses from anon, authenticated;
