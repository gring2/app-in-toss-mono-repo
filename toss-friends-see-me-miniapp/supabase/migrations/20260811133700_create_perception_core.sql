create extension if not exists pgcrypto with schema extensions;

create table public.perception_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 20),
  self_answers smallint[] not null check (
    cardinality(self_answers) = 8
    and self_answers <@ array[1, 2, 3, 4, 5]::smallint[]
  ),
  invite_token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  check (expires_at > created_at)
);

create table public.perception_responses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.perception_rooms (id) on delete cascade,
  respondent_user_id uuid not null references auth.users (id) on delete cascade,
  answers smallint[] not null check (
    cardinality(answers) = 8
    and answers <@ array[1, 2, 3, 4, 5]::smallint[]
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, respondent_user_id)
);

create index perception_rooms_owner_idx
  on public.perception_rooms (owner_user_id, created_at desc);

create index perception_rooms_expires_idx
  on public.perception_rooms (expires_at);

create index perception_responses_room_idx
  on public.perception_responses (room_id);

alter table public.perception_rooms enable row level security;
alter table public.perception_responses enable row level security;

create policy "owners can read their rooms"
  on public.perception_rooms
  for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

revoke all on table public.perception_rooms from anon, authenticated;
revoke all on table public.perception_responses from anon, authenticated;
grant select on table public.perception_rooms to authenticated;

create or replace function public.create_perception_room(
  p_display_name text,
  p_self_answers smallint[]
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
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_display_name is null
     or char_length(btrim(p_display_name)) not between 1 and 20 then
    raise exception 'Display name must contain 1 to 20 characters' using errcode = '22023';
  end if;

  if p_self_answers is null
     or cardinality(p_self_answers) <> 8
     or not (p_self_answers <@ array[1, 2, 3, 4, 5]::smallint[]) then
    raise exception 'Exactly eight answers between 1 and 5 are required' using errcode = '22023';
  end if;

  insert into public.perception_rooms (
    id,
    owner_user_id,
    display_name,
    self_answers,
    invite_token_hash,
    expires_at
  )
  values (
    v_room_id,
    v_user_id,
    btrim(p_display_name),
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
  v_room public.perception_rooms%rowtype;
  v_response_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_invite_token is null or p_invite_token !~ '^[0-9a-f]{48}$' then
    return null;
  end if;

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
    'question_count', 8,
    'already_answered', exists (
      select 1
        from public.perception_responses as response
       where response.room_id = v_room.id
         and response.respondent_user_id = v_user_id
    )
  );
end;
$$;

create or replace function public.submit_perception_response(
  p_invite_token text,
  p_answers smallint[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.perception_rooms%rowtype;
  v_response_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_invite_token is null or p_invite_token !~ '^[0-9a-f]{48}$' then
    raise exception 'Invite is invalid or expired' using errcode = '22023';
  end if;

  if p_answers is null
     or cardinality(p_answers) <> 8
     or not (p_answers <@ array[1, 2, 3, 4, 5]::smallint[]) then
    raise exception 'Exactly eight answers between 1 and 5 are required' using errcode = '22023';
  end if;

  select room.*
    into v_room
    from public.perception_rooms as room
   where room.invite_token_hash = encode(extensions.digest(p_invite_token, 'sha256'), 'hex')
     and room.expires_at > now()
   for update;

  if not found then
    raise exception 'Invite is invalid or expired' using errcode = '22023';
  end if;

  if v_room.owner_user_id = v_user_id then
    raise exception 'The room owner cannot submit a friend response' using errcode = '42501';
  end if;

  insert into public.perception_responses (
    room_id,
    respondent_user_id,
    answers
  )
  values (
    v_room.id,
    v_user_id,
    p_answers
  )
  on conflict (room_id, respondent_user_id)
  do update
    set answers = excluded.answers,
        updated_at = now();

  select count(*)::integer
    into v_response_count
    from public.perception_responses as response
   where response.room_id = v_room.id;

  return jsonb_build_object(
    'room_id', v_room.id,
    'response_count', v_response_count,
    'required_count', 3,
    'revealed', v_response_count >= 3
  );
end;
$$;

create or replace function public.get_perception_results(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.perception_rooms%rowtype;
  v_response_count integer;
  v_friend_averages jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  select room.*
    into v_room
    from public.perception_rooms as room
   where room.id = p_room_id
     and room.owner_user_id = v_user_id
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
    'revealed', true,
    'self_answers', to_jsonb(v_room.self_answers),
    'friend_averages', v_friend_averages
  );
end;
$$;

create or replace function public.rotate_perception_invite(p_room_id uuid)
returns table (
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires_at timestamptz := now() + interval '30 days';
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  update public.perception_rooms as room
     set invite_token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex'),
         expires_at = v_expires_at
   where room.id = p_room_id
     and room.owner_user_id = v_user_id;

  if not found then
    return;
  end if;

  return query select v_token, v_expires_at;
end;
$$;

create or replace function public.delete_perception_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  delete from public.perception_rooms as room
   where room.id = p_room_id
     and room.owner_user_id = v_user_id;

  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

revoke all on function public.create_perception_room(text, smallint[]) from public, anon, authenticated;
revoke all on function public.get_perception_invite(text) from public, anon, authenticated;
revoke all on function public.submit_perception_response(text, smallint[]) from public, anon, authenticated;
revoke all on function public.get_perception_results(uuid) from public, anon, authenticated;
revoke all on function public.rotate_perception_invite(uuid) from public, anon, authenticated;
revoke all on function public.delete_perception_room(uuid) from public, anon, authenticated;

grant execute on function public.create_perception_room(text, smallint[]) to authenticated;
grant execute on function public.get_perception_invite(text) to authenticated;
grant execute on function public.submit_perception_response(text, smallint[]) to authenticated;
grant execute on function public.get_perception_results(uuid) to authenticated;
grant execute on function public.rotate_perception_invite(uuid) to authenticated;
grant execute on function public.delete_perception_room(uuid) to authenticated;
