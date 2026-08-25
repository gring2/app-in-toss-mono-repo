alter table public.perception_rooms
  add column if not exists question_images text[];

update public.perception_rooms
   set questions = array[
         '새로운 사람과도 금방 친해지는 편이다',
         '계획을 세우고 차근차근 움직이는 편이다',
         '내 감정을 솔직하게 표현하는 편이다',
         '예상하지 못한 변화를 즐기는 편이다',
         '친구의 이야기를 끝까지 잘 들어주는 편이다',
         '중요한 결정을 빠르게 내리는 편이다',
         '함께 있을 때 분위기를 밝게 만드는 편이다',
         '약속과 책임을 잘 지키는 편이다'
       ]::varchar[]
 where questions is null;

update public.perception_rooms
   set question_images = array_fill(null::text, array[8])
 where question_images is null;

alter table public.perception_rooms
  alter column questions set not null,
  alter column question_images set default array_fill(null::text, array[8]),
  alter column question_images set not null;

create or replace function public.create_perception_room_v4(
  p_display_name text,
  p_questions varchar[],
  p_question_images text[],
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
  v_question_images text[];
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
     or exists (
       select 1
         from unnest(p_questions) as question(prompt)
        where char_length(btrim(question.prompt)) not between 1 and 60
     ) then
    raise exception 'Exactly eight questions between 1 and 60 characters are required' using errcode = '22023';
  end if;

  if p_question_images is null or cardinality(p_question_images) <> 8 then
    raise exception 'Exactly eight image slots are required' using errcode = '22023';
  end if;

  select array_agg(nullif(image.value, '') order by image.position)
    into v_question_images
    from unnest(p_question_images) with ordinality as image(value, position);

  if cardinality(array_remove(v_question_images, null)) > 3
     or exists (
       select 1
         from unnest(v_question_images) as image(value)
        where image.value is not null
          and (
            char_length(image.value) > 400000
            or char_length(image.value) % 4 <> 0
            or image.value !~ '^[A-Za-z0-9+/]+={0,2}$'
          )
     )
     or (
       select coalesce(sum(char_length(image.value)), 0)
         from unnest(v_question_images) as image(value)
     ) > 1200000 then
    raise exception 'Question images are too large or invalid' using errcode = '22023';
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
    question_images,
    self_answers,
    invite_token_hash,
    expires_at
  )
  values (
    v_room_id,
    v_user_id,
    v_owner_key_hash,
    btrim(p_display_name),
    array(select btrim(question.prompt) from unnest(p_questions) with ordinality as question(prompt, position) order by question.position),
    v_question_images,
    p_self_answers,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_expires_at
  );

  return query select v_room_id, v_token, v_expires_at;
end;
$$;

create or replace function public.get_perception_invite(p_invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_owner_key_hash text;
  v_room public.perception_rooms%rowtype;
  v_response_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_invite_token is null or p_invite_token !~ '^[0-9a-f]{48}$' then
    return null;
  end if;

  select owner_device.owner_key_hash
    into v_user_owner_key_hash
    from public.perception_owner_devices as owner_device
   where owner_device.auth_user_id = v_user_id;

  select room.*
    into v_room
    from public.perception_rooms as room
   where room.invite_token_hash = encode(extensions.digest(p_invite_token, 'sha256'), 'hex')
     and room.expires_at > now();

  if not found then
    return null;
  end if;

  select count(*)::integer
    into v_response_count
    from public.perception_responses as response
   where response.room_id = v_room.id;

  return jsonb_build_object(
    'room_id', v_room.id,
    'display_name', v_room.display_name,
    'expires_at', v_room.expires_at,
    'response_count', v_response_count,
    'question_count', cardinality(v_room.questions),
    'questions', to_jsonb(v_room.questions),
    'question_images', to_jsonb(v_room.question_images),
    'already_answered', exists (
      select 1
        from public.perception_responses as response
       where response.room_id = v_room.id
         and response.respondent_user_id = v_user_id
    ),
    'is_owner', (
      v_room.owner_user_id = v_user_id
      or (
        v_user_owner_key_hash is not null
        and v_room.owner_key_hash = v_user_owner_key_hash
      )
    )
  );
end;
$$;

create or replace function public.get_perception_results_v2(
  p_room_id uuid,
  p_owner_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.perception_rooms%rowtype;
  v_response_count integer;
  v_friend_averages jsonb;
  v_owner_key_hash text := public.claim_perception_owner_rooms(p_owner_key);
begin
  select room.*
    into v_room
    from public.perception_rooms as room
   where room.id = p_room_id
     and room.owner_key_hash = v_owner_key_hash
     and room.expires_at > now();

  if not found then
    return null;
  end if;

  select count(*)::integer
    into v_response_count
    from public.perception_responses as response
   where response.room_id = v_room.id;

  if v_response_count < 3 then
    return jsonb_build_object(
      'room_id', v_room.id,
      'display_name', v_room.display_name,
      'expires_at', v_room.expires_at,
      'response_count', v_response_count,
      'required_count', 3,
      'questions', to_jsonb(v_room.questions),
      'question_images', to_jsonb(v_room.question_images),
      'revealed', false
    );
  end if;

  select jsonb_agg(average.answer_average order by average.position)
    into v_friend_averages
    from (
      select
        item.position,
        round(avg(item.answer)::numeric, 2) as answer_average
      from public.perception_responses as response
      cross join lateral unnest(response.answers)
        with ordinality as item(answer, position)
      where response.room_id = v_room.id
      group by item.position
    ) as average;

  return jsonb_build_object(
    'room_id', v_room.id,
    'display_name', v_room.display_name,
    'expires_at', v_room.expires_at,
    'response_count', v_response_count,
    'required_count', 3,
    'questions', to_jsonb(v_room.questions),
    'question_images', to_jsonb(v_room.question_images),
    'revealed', true,
    'self_answers', to_jsonb(v_room.self_answers),
    'friend_averages', v_friend_averages
  );
end;
$$;

revoke all on function public.create_perception_room_v4(text, varchar[], text[], smallint[], text)
  from public, anon, authenticated;
grant execute on function public.create_perception_room_v4(text, varchar[], text[], smallint[], text)
  to authenticated;
