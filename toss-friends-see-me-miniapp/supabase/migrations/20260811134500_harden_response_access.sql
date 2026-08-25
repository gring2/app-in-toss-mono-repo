create index perception_responses_respondent_idx
  on public.perception_responses (respondent_user_id);

create policy "direct response access is disabled"
  on public.perception_responses
  for all
  to authenticated
  using (false)
  with check (false);
