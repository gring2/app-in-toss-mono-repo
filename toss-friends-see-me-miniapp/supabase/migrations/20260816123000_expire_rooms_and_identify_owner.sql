create extension if not exists pg_cron with schema pg_catalog;

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
    ),
    'is_owner', v_room.owner_user_id = v_user_id
  );
end;
$$;

revoke all on function public.get_perception_invite(text) from public, anon, authenticated;
grant execute on function public.get_perception_invite(text) to authenticated;

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
  return v_deleted;
end;
$$;

revoke all on function public.delete_expired_perception_rooms() from public, anon, authenticated;
grant execute on function public.delete_expired_perception_rooms() to postgres;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
    from cron.job
   where jobname = 'delete-expired-perception-rooms';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

select cron.schedule(
  'delete-expired-perception-rooms',
  '15 3 * * *',
  'select public.delete_expired_perception_rooms();'
);
