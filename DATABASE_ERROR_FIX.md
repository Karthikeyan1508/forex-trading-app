# Database Error Fix - Run these SQL commands in Supabase

If you're getting "Database error saving new user", run these commands in your Supabase SQL Editor:

## Fix 1: Update the trigger function with proper permissions

```sql
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_portfolio_on_signup ON auth.users;
DROP FUNCTION IF EXISTS create_user_portfolio();

-- Recreate function with proper permissions
CREATE OR REPLACE FUNCTION public.create_user_portfolio()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_portfolios (user_id, total_balance, available_balance)
  VALUES (NEW.id, 10000.00, 10000.00);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and continue (don't block user creation)
    RAISE WARNING 'Failed to create user portfolio: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER create_portfolio_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_portfolio();
```

## Fix 2: Update RLS policies to allow service role

```sql
-- Temporarily disable RLS for user_portfolios during signup
ALTER TABLE user_portfolios DISABLE ROW LEVEL SECURITY;

-- Re-enable with updated policies
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own portfolio" ON user_portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON user_portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolio" ON user_portfolios;

-- Create new policies that allow service role access
CREATE POLICY "Users can view their own portfolio" ON user_portfolios
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own portfolio" ON user_portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own portfolio" ON user_portfolios
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Allow service role to insert portfolios for new users
CREATE POLICY "Service role can manage portfolios" ON user_portfolios
    FOR ALL USING (auth.role() = 'service_role');
```

## Fix 3: Alternative approach - Manual portfolio creation in backend

If the trigger still doesn't work, we can handle portfolio creation in the backend code instead.

```sql
-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS create_portfolio_on_signup ON auth.users;
```

Then the backend will handle portfolio creation manually when users sign up.

---

**Try Fix 1 first, then Fix 2 if needed. Only use Fix 3 if both fail.**
