# Bridge sunset checklist (PR6)

Do **not** run the destructive bridge-sunset migration until all of these are true:

- [ ] `account_type_migration_reviews` has **zero unresolved rows**
- [ ] Every active user has a non-null `profiles.account_type`
- [ ] No production app code still reads or writes `user_roles`
- [ ] No edge function still depends on `user_roles` fallback audience resolution
- [ ] Admin/backoffice surfaces that used to expose legacy roles are rewritten or intentionally removed

## Recommended preflight SQL

```sql
-- 1) unresolved migration reviews
select count(*) as unresolved_reviews
from public.account_type_migration_reviews
where coalesce(status, 'pending') not in ('resolved', 'dismissed');

-- 2) active users missing canonical account type
select count(*) as active_users_missing_account_type
from auth.users u
left join public.profiles p on p.user_id = u.id
where u.deleted_at is null
  and p.account_type is null;

-- 3) users still present in user_roles but missing canonical profiles.account_type
select count(distinct ur.user_id) as bridge_only_users
from public.user_roles ur
left join public.profiles p on p.user_id = ur.user_id
where p.account_type is null;

-- 4) users with multiple distinct non-admin legacy roles
select count(*) as users_with_multiple_non_admin_roles
from (
  select user_id
  from public.user_roles
  where role <> 'admin'::public.app_role
  group by user_id
  having count(distinct role) > 1
) t;
```

## Rollout notes

- Apply the canonical-only app and edge-function changes before the destructive migration.
- Keep the migration guarded so it aborts early when the readiness gates are not met.
- Prefer archiving `user_roles` before dropping the active table.
- If preflight fails, stop here and resolve the data issues first.
