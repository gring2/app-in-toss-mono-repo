create or replace function public.get_perception_invite_v2(
  p_invite_token text,
  p_owner_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_supplied_owner_key_hash text;
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

  if p_owner_key is null or char_length(p_owner_key) not between 1 and 512 then
    raise exception 'Owner key is required' using errcode = '22023';
  end if;

  v_supplied_owner_key_hash := encode(extensions.digest(p_owner_key, 'sha256'), 'hex');

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
      or v_room.owner_key_hash = v_supplied_owner_key_hash
      or (
        v_user_owner_key_hash is not null
        and v_room.owner_key_hash = v_user_owner_key_hash
      )
    )
  );
end;
$$;

create or replace function public.submit_perception_response_v2(
  p_invite_token text,
  p_answers smallint[],
  p_owner_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_supplied_owner_key_hash text;
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

  if p_owner_key is null or char_length(p_owner_key) not between 1 and 512 then
    raise exception 'Owner key is required' using errcode = '22023';
  end if;

  if p_answers is null
     or cardinality(p_answers) <> 8
     or not (p_answers <@ array[1, 2, 3, 4, 5]::smallint[]) then
    raise exception 'Exactly eight answers between 1 and 5 are required' using errcode = '22023';
  end if;

  v_supplied_owner_key_hash := encode(extensions.digest(p_owner_key, 'sha256'), 'hex');

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
     or v_room.owner_key_hash = v_supplied_owner_key_hash
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

revoke all on function public.get_perception_invite_v2(text, text)
  from public, anon, authenticated;
grant execute on function public.get_perception_invite_v2(text, text)
  to authenticated;

revoke all on function public.submit_perception_response_v2(text, smallint[], text)
  from public, anon, authenticated;
grant execute on function public.submit_perception_response_v2(text, smallint[], text)
  to authenticated;

-- The legacy endpoint cannot identify the same room owner on a fresh device.
revoke execute on function public.submit_perception_response(text, smallint[])
  from authenticated;
