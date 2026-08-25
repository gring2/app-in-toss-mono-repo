alter table public.perception_rooms
  add column if not exists questions varchar[] default ARRAY['새로운 사람과도 금방 친해지는 편이다',
  '계획을 세우고 차근차근 움직이는 편이다',
  '내 감정을 솔직하게 표현하는 편이다',
  '예상하지 못한 변화를 즐기는 편이다',
  '친구의 이야기를 끝까지 잘 들어주는 편이다',
  '중요한 결정을 빠르게 내리는 편이다',
  '함께 있을 때 분위기를 밝게 만드는 편이다',
  '약속과 책임을 잘 지키는 편이다']::varchar[];


create or replace function public.create_perception_room_v3(
  p_display_name text,
  p_questions varchar[],
  p_self_answers smallint[],
  p_owner_key text
)
returns table (
  room_id uuid,
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid := gen_random_uuid();
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires_at timestamptz := now() + interval '30 days';
  v_owner_key_hash text := public.claim_perception_owner_rooms(p_owner_key);
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_display_name is null
     or char_length(btrim(p_display_name)) not between 1 and 20 then
    raise exception 'Display name must contain 1 to 20 characters' using errcode = '22023';
  end if;

  if p_questions is null
     or cardinality(p_questions) <> 8
     then
    raise exception 'Exactly eight questions are required' using errcode = '22023';
  end if;

  if p_self_answers is null
     or cardinality(p_self_answers) <> 8
     or not (p_self_answers <@ array[1, 2, 3, 4, 5]::smallint[]) then
    raise exception 'Exactly eight answers between 1 and 5 are required' using errcode = '22023';
  end if;

  insert into public.perception_rooms (
    id,
    owner_user_id,
    owner_key_hash,
    display_name,
    questions,
    self_answers,
    invite_token_hash,
    expires_at
  )
  values (
    v_room_id,
    v_user_id,
    v_owner_key_hash,
    btrim(p_display_name),
    p_questions,
    p_self_answers,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_expires_at
  );

  return query select v_room_id, v_token, v_expires_at;
end;
$$;

revoke all on function public.create_perception_room_v3(  p_display_name text,
p_questions varchar[],
p_self_answers smallint[],
p_owner_key text) from public, anon, authenticated;
grant execute on function public.create_perception_room_v3(  p_display_name text,
p_questions varchar[],
p_self_answers smallint[],
p_owner_key text) to authenticated;
