-- Ecosystem-wide account deletion.
--
-- User.supabaseId is a plain text stamp, not a foreign key to auth.users, so
-- deleting an auth user does not cascade to app data by itself. This trigger
-- makes auth-user deletion erase every ecosystem tool's rows keyed on that id.
--
-- Deleting the public.users row cascades all Dynasty Tree Builder data through
-- the onDelete: Cascade FKs already defined in the Prisma schema.
--
-- Adding a future Bag Of Holding Tools app = add one DELETE line to the function
-- body below (e.g. `DELETE FROM other_tool.users WHERE "supabaseId" = OLD.id::text;`).
-- That single central edit is the whole registration; existing tools are untouched.

-- The function can be created unconditionally: its body is not resolved against
-- auth.users at creation time, and public.users always exists.
CREATE OR REPLACE FUNCTION public.handle_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- Dynasty Tree Builder: cascades dynasties/characters/relationships/custom_* rows.
  DELETE FROM public.users WHERE "supabaseId" = OLD.id::text;
  -- Future tools: add one DELETE line each, keyed on OLD.id::text.
  RETURN OLD;
END;
$func$;

-- Bind the trigger only when the auth schema exists. On Prisma's shadow database
-- (no auth schema) this block is a clean no-op, so migrate validation still passes.
DO $do$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
    CREATE TRIGGER on_auth_user_deleted
      AFTER DELETE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_account_deletion();
  END IF;
END $do$;
