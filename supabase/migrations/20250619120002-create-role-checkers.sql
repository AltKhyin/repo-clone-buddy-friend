
-- Create centralized role-checking functions to eliminate duplicated permission logic
-- These functions serve as the single source of truth for user role validation

-- Checks if a user has the 'editor' or 'admin' role
create or replace function is_editor(p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from "Practitioners"
    where id = p_user_id and role in ('editor', 'admin')
  );
$$ language sql security definer stable;

-- Checks if a user has the 'admin' role
create or replace function is_admin(p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from "Practitioners"
    where id = p_user_id and role = 'admin'
  );
$$ language sql security definer stable;

-- Checks if a user has any moderator-level permissions
create or replace function can_moderate(p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from "Practitioners"
    where id = p_user_id and role in ('moderator', 'editor', 'admin')
  );
$$ language sql security definer stable;
