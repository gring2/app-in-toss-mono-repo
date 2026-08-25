alter table public.perception_rooms
  add column if not exists owner_key_hash text;

do $$
begin
  alter table public.perception_rooms
    add constraint perception_rooms_owner_key_hash_check
    check (owner_key_hash is null or owner_key_hash ~ '^[0-9a-f]{64}$');
exception
  when duplicate_object then null;
end;
$$;

create index if not exists perception_rooms_owner_key_idx
  on public.perception_rooms (owner_key_hash, created_at desc)
  where owner_key_hash is not null;

create table if not exists public.perception_owner_devices (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  owner_key_hash text not null check (owner_key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists perception_owner_devices_owner_key_idx
  on public.perception_owner_devices (owner_key_hash);

alter table public.perception_owner_devices enable row level security;

revoke all on table public.perception_owner_devices from public, anon, authenticated;

create or replace function public.claim_perception_owner_rooms(p_owner_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_key_hash text;
  v_existing_owner_key_hash text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_owner_key is null or char_length(p_owner_key) not between 1 and 512 then
    raise exception 'Owner key is required' using errcode = '22023';
  end if;

  v_owner_key_hash := encode(extensions.digest(p_owner_key, 'sha256'), 'hex');

  insert into public.perception_owner_devices (
    auth_user_id,
    owner_key_hash
  )
  values (
    v_user_id,
    v_owner_key_hash
  )
  on conflict (auth_user_id) do nothing;

  select owner_device.owner_key_hash
    into v_existing_owner_key_hash
    from public.perception_owner_devices as owner_device
   where owner_device.auth_user_id = v_user_id;

  if v_existing_owner_key_hash <> v_owner_key_hash then
    raise exception 'Owner identity mismatch' using errcode = '42501';
  end if;

  update public.perception_rooms as room
     set owner_key_hash = v_owner_key_hash
   where room.owner_user_id = v_user_id
     and room.expires_at > now()
     and room.owner_key_hash is null;

  return v_owner_key_hash;
end;
$$;

revoke all on function public.claim_perception_owner_rooms(text) from public, anon, authenticated;

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
  v_owner_key_hash text;
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

  select owner_device.owner_key_hash
    into v_owner_key_hash
    from public.perception_owner_devices as owner_device
   where owner_device.auth_user_id = v_user_id;

  insert into public.perception_rooms (
    id,
    owner_user_id,
    owner_key_hash,
    display_name,
    self_answers,
    invite_token_hash,
    expires_at
  )
  values (
    v_room_id,
    v_user_id,
    v_owner_key_hash,
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
    'question_count', 8,
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
  v_user_owner_key_hash text;
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

  select owner_device.owner_key_hash
    into v_user_owner_key_hash
    from public.perception_owner_devices as owner_device
   where owner_device.auth_user_id = v_user_id;

  select room.*
    into v_room
    from public.perception_rooms as room
   where room.invite_token_hash = encode(extensions.digest(p_invite_token, 'sha256'), 'hex')
     and room.expires_at > now()
   for update;

  if not found then
    raise exception 'Invite is invalid or expired' using errcode = '22023';
  end if;

  if v_room.owner_user_id = v_user_id
     or (
       v_user_owner_key_hash is not null
       and v_room.owner_key_hash = v_user_owner_key_hash
     ) then
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

create or replace function public.create_perception_room_v2(
  p_display_name text,
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
    self_answers,
    invite_token_hash,
    expires_at
  )
  values (
    v_room_id,
    v_user_id,
    v_owner_key_hash,
    btrim(p_display_name),
    p_self_answers,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_expires_at
  );

  return query select v_room_id, v_token, v_expires_at;
end;
$$;

create or replace function public.list_perception_rooms_v2(p_owner_key text)
returns table (
  room_id uuid,
  display_name text,
  created_at timestamptz,
  expires_at timestamptz,
  response_count integer,
  required_count integer,
  revealed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_key_hash text := public.claim_perception_owner_rooms(p_owner_key);
begin
  return query
  select
    room.id,
    room.display_name,
    room.created_at,
    room.expires_at,
    count(response.id)::integer as response_count,
    3 as required_count,
    count(response.id) >= 3 as revealed
  from public.perception_rooms as room
  left join public.perception_responses as response
    on response.room_id = room.id
  where room.owner_key_hash = v_owner_key_hash
    and room.expires_at > now()
  group by room.id
  order by room.created_at desc;
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

create or replace function public.rotate_perception_invite_v2(
  p_room_id uuid,
  p_owner_key text
)
returns table (
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_owner_key_hash text := public.claim_perception_owner_rooms(p_owner_key);
begin
  update public.perception_rooms as room
     set invite_token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex')
   where room.id = p_room_id
     and room.owner_key_hash = v_owner_key_hash
     and room.expires_at > now();

  if not found then
    return;
  end if;

  return query
  select v_token, room.expires_at
    from public.perception_rooms as room
   where room.id = p_room_id;
end;
$$;

create or replace function public.delete_perception_room_v2(
  p_room_id uuid,
  p_owner_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
  v_owner_key_hash text := public.claim_perception_owner_rooms(p_owner_key);
begin
  delete from public.perception_rooms as room
   where room.id = p_room_id
     and room.owner_key_hash = v_owner_key_hash;

  get diagnostics v_deleted = row_count;

  if v_deleted = 1 then
    delete from public.perception_owner_devices as owner_device
     where owner_device.owner_key_hash = v_owner_key_hash
       and not exists (
         select 1
           from public.perception_rooms as room
          where room.owner_key_hash = v_owner_key_hash
            and room.expires_at > now()
       );
  end if;

  return v_deleted = 1;
end;
$$;

create or replace function public.delete_expired_perception_rooms()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.perception_rooms as room
   where room.expires_at <= now();

  get diagnostics v_deleted = row_count;

  delete from public.perception_owner_devices as owner_device
   where not exists (
     select 1
       from public.perception_rooms as room
      where room.owner_key_hash = owner_device.owner_key_hash
        and room.expires_at > now()
   );

  return v_deleted;
end;
$$;

revoke all on function public.delete_expired_perception_rooms() from public, anon, authenticated;
grant execute on function public.delete_expired_perception_rooms() to postgres;

revoke all on function public.create_perception_room_v2(text, smallint[], text) from public, anon, authenticated;
revoke all on function public.list_perception_rooms_v2(text) from public, anon, authenticated;
revoke all on function public.get_perception_results_v2(uuid, text) from public, anon, authenticated;
revoke all on function public.rotate_perception_invite_v2(uuid, text) from public, anon, authenticated;
revoke all on function public.delete_perception_room_v2(uuid, text) from public, anon, authenticated;

grant execute on function public.create_perception_room_v2(text, smallint[], text) to authenticated;
grant execute on function public.list_perception_rooms_v2(text) to authenticated;
grant execute on function public.get_perception_results_v2(uuid, text) to authenticated;
grant execute on function public.rotate_perception_invite_v2(uuid, text) to authenticated;
grant execute on function public.delete_perception_room_v2(uuid, text) to authenticated;
