begin;
alter table public.mvp_users add column sync_revision bigint not null default 0;
create table public.mvp_change_log(user_id uuid not null references public.mvp_users(id)on delete cascade,revision bigint not null,entity text not null,record_id uuid not null,snapshot jsonb not null,primary key(user_id,revision,entity,record_id));
alter table public.mvp_change_log enable row level security;
create policy owner_read on public.mvp_change_log for select to authenticated using(user_id=auth.uid());
revoke all on public.mvp_change_log from anon,authenticated;
create function public.mvp_log_change()returns trigger language plpgsql set search_path=public,pg_temp as $$declare revision_value bigint;row jsonb:=to_jsonb(new);uid uuid;rid uuid;begin revision_value=nullif(current_setting('pkos.revision',true),'')::bigint;if revision_value is null then return new;end if;uid=case when tg_table_name='mvp_users'then(row->>'id')::uuid else(row->>'user_id')::uuid end;rid=coalesce(row->>'id',row->>'user_id')::uuid;if uid::text<>current_setting('pkos.owner',true)then raise exception 'Sync owner mismatch';end if;insert into public.mvp_change_log values(uid,revision_value,tg_table_name,rid,row)on conflict(user_id,revision,entity,record_id)do update set snapshot=excluded.snapshot;return new;end$$;
do $$declare name text;begin foreach name in array array['mvp_users','mvp_settings','mvp_projects','mvp_tasks','mvp_inbox_items','mvp_artifacts','mvp_daily_briefs','mvp_focus_sessions']loop execute format('create trigger log_change after insert or update on public.%I for each row execute function public.mvp_log_change()',name);end loop;end$$;
create function public.mvp_validate_preferences(p jsonb)returns void language plpgsql set search_path=public,pg_temp as $$declare k text;v jsonb;lo integer;hi integer;begin
 for k,v in select * from jsonb_each(p)loop
  if k=any(array['briefEnabled','stalledHints','reduceMotion','sound','vibration','autoStart','aiConsent','requireEvidence','reflection','hideSensitive'])then if jsonb_typeof(v)<>'boolean'then raise exception 'Invalid boolean preference: %',k;end if;
  elsif k=any(array['maxProjects','maxToday','focusMinutes','breakMinutes','steps','stallDays','snoozeMinutes','completedDays'])then
   lo=1;hi=case k when 'maxProjects'then 20 when 'maxToday'then 30 when 'focusMinutes'then 120 when 'breakMinutes'then 60 when 'steps'then 20 when 'stallDays'then 90 when 'snoozeMinutes'then 1440 else 365 end;
   if jsonb_typeof(v)<>'number'or(v#>>'{}')::numeric<>trunc((v#>>'{}')::numeric)or(v#>>'{}')::numeric not between lo and hi then raise exception 'Invalid number preference: %',k;end if;
  elsif k in('briefTime','quietStart','quietEnd')then if (v#>>'{}')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$'then raise exception 'Invalid time preference';end if;
  elsif k='theme'then if v#>>'{}'not in('system','light','dark','oled','neon')then raise exception 'Invalid theme';end if;
  elsif k='textSize'then if v#>>'{}'not in('default','large')then raise exception 'Invalid text size';end if;
  elsif k='detail'then if v#>>'{}'not in('brief','standard','detailed')then raise exception 'Invalid detail';end if;
  elsif k='progressControl'then if v#>>'{}'not in('all','buttons','slider','number')then raise exception 'Invalid progress control';end if;
  elsif k='reminderWording'then if v#>>'{}'not in('gentle','direct')then raise exception 'Invalid reminder wording';end if;
  elsif k='instructions'then if jsonb_typeof(v)<>'string'or length(v#>>'{}')>2000 then raise exception 'Instructions too long';end if;
  else raise exception 'Unknown preference: %',k;
  end if;
 end loop;
end$$;
alter function public.mvp_command(uuid,text,jsonb)rename to mvp_command_core;
revoke all on function public.mvp_command_core(uuid,text,jsonb)from public,anon,authenticated;
create function public.mvp_command(p_mutation_id uuid,p_command text,p_data jsonb default '{}')returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
#variable_conflict use_variable
declare uid uuid:=auth.uid();id uuid:=nullif(p_data->>'id','')::uuid;revision bigint;receipt public.mvp_mutation_receipts;result jsonb;task public.mvp_tasks;project public.mvp_projects;begin
 if uid is null then raise exception using errcode='42501',message='Sign in required';end if;
 insert into public.mvp_users(id)values(uid)on conflict do nothing;insert into public.mvp_settings(user_id)values(uid)on conflict do nothing;
 perform 1 from public.mvp_users where mvp_users.id=uid and deleted_at is null for update;if not found then raise exception 'Account unavailable';end if;
 select * into receipt from public.mvp_mutation_receipts where user_id=uid and mutation_id=p_mutation_id;if found then if receipt.request_hash<>md5(p_command||p_data::text)then raise exception 'Mutation ID reused with different data';end if;return receipt.result;end if;
 update public.mvp_users set sync_revision=sync_revision+1 where mvp_users.id=uid returning sync_revision into revision;
 perform set_config('pkos.revision',revision::text,true);perform set_config('pkos.owner',uid::text,true);
 if p_command='save_settings'then perform public.mvp_validate_preferences(coalesce(p_data->'preferences','{}'));end if;
 if p_command in('trash_task','restore_task')then
  select * into task from public.mvp_tasks where mvp_tasks.id=id and user_id=uid for update;if not found then raise exception using errcode='42501',message='Task unavailable';end if;perform public.mvp_check_version(task.version,p_data);
  if p_command='trash_task'then
   update public.mvp_tasks set deleted_at=now(),today_date=null where mvp_tasks.id in(with recursive subtree as(select t.id from public.mvp_tasks t where t.id=id union select t.id from public.mvp_tasks t join subtree s on t.parent_id=s.id and t.user_id=uid)select * from subtree)and user_id=uid;
   update public.mvp_focus_sessions set status='ended',ended_at=now(),outcome='task_trashed'where user_id=uid and status in('running','paused')and task_id in(select t.id from public.mvp_tasks t where t.user_id=uid and t.deleted_at is not null);
  else
   update public.mvp_tasks set deleted_at=null,parent_id=null,project_id=case when exists(select 1 from public.mvp_projects p where p.id=task.project_id and p.status not in('completed','archived')and p.deleted_at is null)then task.project_id else null end,today_date=null where mvp_tasks.id=id;
  end if;
  if task.project_id is not null then update public.mvp_projects set next_action_task_id=(select t.id from public.mvp_tasks t where t.project_id=task.project_id and t.user_id=uid and t.deleted_at is null and t.cancelled_at is null and t.status<>'done'order by t.created_at limit 1)where mvp_projects.id=task.project_id;end if;
  select to_jsonb(t)into result from public.mvp_tasks t where t.id=id;
 elsif p_command='reopen_project'then
  select * into project from public.mvp_projects where mvp_projects.id=id and user_id=uid for update;if not found then raise exception using errcode='42501',message='Project unavailable';end if;perform public.mvp_check_version(project.version,p_data);
  update public.mvp_projects set status='planned',completed_at=null,deleted_at=null,progress=case when project.progress_mode='tasks'then coalesce((select round(100.0*count(*)filter(where t.status='done')/nullif(count(*),0))from public.mvp_tasks t where t.project_id=id and t.deleted_at is null and t.cancelled_at is null),0)else least(progress,99)end where mvp_projects.id=id returning to_jsonb(mvp_projects.*)into result;
 else result=public.mvp_command_core(p_mutation_id,p_command,p_data);end if;
 result=result||jsonb_build_object('_revision',revision);
 insert into public.mvp_mutation_receipts(user_id,mutation_id,request_hash,result)values(uid,p_mutation_id,md5(p_command||p_data::text),result)on conflict(user_id,mutation_id)do update set result=excluded.result;
 return result;
end$$;
revoke all on function public.mvp_command(uuid,text,jsonb)from public,anon;grant execute on function public.mvp_command(uuid,text,jsonb)to authenticated;
create function public.mvp_sync(p_after_revision bigint default 0)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid();current_revision bigint;next_revision bigint;rows jsonb:='[]';chunk jsonb;name text;begin
 if uid is null then raise exception using errcode='42501',message='Sign in required';end if;
 select sync_revision into current_revision from public.mvp_users where id=uid and deleted_at is null for share;if not found then return jsonb_build_object('revision',0,'records','[]'::jsonb);end if;
 if p_after_revision=0 then
  foreach name in array array['mvp_users','mvp_settings','mvp_projects','mvp_tasks','mvp_inbox_items','mvp_artifacts','mvp_daily_briefs','mvp_focus_sessions']loop
   execute format('select coalesce(jsonb_agg(jsonb_build_object(''entity'',%L,''id'',coalesce(to_jsonb(r)->>''id'',to_jsonb(r)->>''user_id''),''snapshot'',to_jsonb(r))),''[]''::jsonb)from public.%I r where %I=$1',name,name,case when name='mvp_users'then 'id'else 'user_id'end)into chunk using uid;rows=rows||chunk;
  end loop;next_revision=current_revision;
 else
  select coalesce(max(revision),current_revision)into next_revision from(select distinct revision from public.mvp_change_log where user_id=uid and revision>p_after_revision order by revision limit 100)r;
  select coalesce(jsonb_agg(jsonb_build_object('entity',entity,'id',record_id,'snapshot',snapshot)order by revision,entity,record_id),'[]')into rows from public.mvp_change_log where user_id=uid and revision>p_after_revision and revision<=next_revision;
 end if;
 return jsonb_build_object('revision',next_revision,'records',rows);
end$$;
revoke all on function public.mvp_sync(bigint)from public,anon;grant execute on function public.mvp_sync(bigint)to authenticated;
commit;
