# Role-Based Authentication Update

## Step 1: Update Database Schema

Run this SQL in your Supabase SQL Editor to add role support:

```sql
-- Add role column to auth.users metadata
-- Note: Supabase stores user metadata in auth.users.user_metadata jsonb field
-- We'll use user_metadata.role for storing the role

-- Update user_portfolios to include role-specific features
ALTER TABLE user_portfolios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE user_portfolios ADD COLUMN IF NOT EXISTS trade_limit DECIMAL(15, 2) DEFAULT 50000.00;
ALTER TABLE user_portfolios ADD COLUMN IF NOT EXISTS auto_trading_enabled BOOLEAN DEFAULT FALSE;

-- Update existing portfolios to have the user role
UPDATE user_portfolios SET role = 'user' WHERE role IS NULL;

-- Create institutions table for additional institution-specific data
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_name VARCHAR(255) NOT NULL,
    institution_type VARCHAR(100), -- 'bank', 'hedge_fund', 'investment_firm', etc.
    license_number VARCHAR(100),
    max_trade_volume DECIMAL(15, 2) DEFAULT 1000000.00,
    auto_trading_strategies JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on institutions table
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for institutions table
CREATE POLICY "Users can view their own institution data" ON institutions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own institution data" ON institutions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own institution data" ON institutions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create auto_trades table for institutional auto-trading
CREATE TABLE IF NOT EXISTS auto_trades (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy_name VARCHAR(100) NOT NULL,
    currency_pair VARCHAR(10) NOT NULL,
    trade_type VARCHAR(10) CHECK (trade_type IN ('Buy', 'Sell')) NOT NULL,
    entry_price DECIMAL(12, 6),
    exit_price DECIMAL(12, 6),
    quantity DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    profit_loss DECIMAL(12, 2) DEFAULT 0,
    strategy_params JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on auto_trades table
ALTER TABLE auto_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for auto_trades table
CREATE POLICY "Users can view their own auto trades" ON auto_trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto trades" ON auto_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto trades" ON auto_trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Update the user portfolio creation function to handle roles
CREATE OR REPLACE FUNCTION public.create_user_portfolio()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role text;
    trade_limit_amount decimal(15, 2);
    auto_trading boolean;
BEGIN
    -- Get role from user metadata (default to 'user')
    user_role := COALESCE(NEW.user_metadata->>'role', 'user');
    
    -- Set limits based on role
    IF user_role = 'institution' THEN
        trade_limit_amount := 1000000.00;
        auto_trading := TRUE;
    ELSE
        trade_limit_amount := 50000.00;
        auto_trading := FALSE;
    END IF;
    
    -- Create user portfolio with role-based settings
    INSERT INTO public.user_portfolios (
        user_id, 
        total_balance, 
        available_balance, 
        role, 
        trade_limit,
        auto_trading_enabled
    )
    VALUES (
        NEW.id, 
        10000.00, 
        10000.00, 
        user_role, 
        trade_limit_amount,
        auto_trading
    );
    
    -- If institution, create institution record
    IF user_role = 'institution' THEN
        INSERT INTO public.institutions (
            user_id,
            institution_name,
            institution_type
        ) VALUES (
            NEW.id,
            COALESCE(NEW.user_metadata->>'institution_name', 'Institution'),
            COALESCE(NEW.user_metadata->>'institution_type', 'investment_firm')
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and continue (don't block user creation)
        RAISE WARNING 'Failed to create user portfolio: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_portfolios_role ON user_portfolios(role);
CREATE INDEX IF NOT EXISTS idx_institutions_user_id ON institutions(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_trades_user_id ON auto_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_trades_status ON auto_trades(status);
```

## Step 2: Backend API Updates

The backend will be updated to:
1. Handle role-based signup
2. Add role-based middleware
3. Create role-specific endpoints
4. Implement auto-trading for institutions

## Step 3: Frontend Updates

The frontend will be updated to:
1. Add role selection during signup
2. Create different dashboards for users vs institutions
3. Implement role-based component rendering
4. Add auto-trading interface for institutions
