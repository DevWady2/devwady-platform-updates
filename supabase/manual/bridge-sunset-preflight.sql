-- PR6 manual preflight checks

select count(*) as unresolved_reviews
from public.account_type_migration_reviews
where coalesce(status, 'pending') not in ('resolved', 'dismissed');

select count(*) as active_users_missing_account_type
from auth.users u
left join public.profiles p on p.user_id = u.id
where u.deleted_at is null
  and p.account_type is null;

select count(distinct ur.user_id) as bridge_only_users
from public.user_roles ur
left join public.profiles p on p.user_id = ur.user_id
where p.account_type is null;

select count(*) as users_with_multiple_non_admin_roles
from (
  select user_id
  from public.user_roles
  where role <> 'admin'::public.app_role
  group by user_id
  having count(distinct role) > 1
) t;
