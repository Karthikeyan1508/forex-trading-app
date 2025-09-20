# Forex Trading App - Supabase Database Setup

## Database Schema Setup Instructions

### 1. Go to your Supabase Dashboard
Visit: https://wtfbyoecevoibjsewtmj.supabase.co

### 2. Navigate to SQL Editor
- Go to the "SQL Editor" tab in your Supabase dashboard
- Create a new query
- Copy and paste the following SQL code:

```sql
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create forex_data table for storing currency exchange data
CREATE TABLE IF NOT EXISTS forex_data (
    id SERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(12, 6) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'ExchangeRate-API'
);

-- Create trades table for user trading records
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy VARCHAR(100) NOT NULL,
    currency_pair VARCHAR(10) NOT NULL,
    trade_type VARCHAR(10) CHECK (trade_type IN ('Buy', 'Sell')) NOT NULL,
    price DECIMAL(12, 6) NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    trade_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Cancelled')),
    profit_loss DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ml_signals table for machine learning trading signals
CREATE TABLE IF NOT EXISTS ml_signals (
    id SERIAL PRIMARY KEY,
    currency_pair VARCHAR(10) NOT NULL,
    signal_type VARCHAR(10) CHECK (signal_type IN ('Buy', 'Sell', 'Hold')) NOT NULL,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
    model_name VARCHAR(100) NOT NULL,
    features JSONB,
    prediction_price DECIMAL(12, 6),
    actual_price DECIMAL(12, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create user_portfolios table for tracking user portfolio performance
CREATE TABLE IF NOT EXISTS user_portfolios (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_balance DECIMAL(15, 2) DEFAULT 10000.00,
    available_balance DECIMAL(15, 2) DEFAULT 10000.00,
    total_profit_loss DECIMAL(12, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security on tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_signals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trades table
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_portfolios table
CREATE POLICY "Users can view their own portfolio" ON user_portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio" ON user_portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio" ON user_portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for ml_signals (read-only for authenticated users)
CREATE POLICY "Authenticated users can view ml_signals" ON ml_signals
    FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forex_data_currencies ON forex_data(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_forex_data_timestamp ON forex_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON trades(currency_pair);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_ml_signals_currency_pair ON ml_signals(currency_pair);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);

-- Create function to automatically create portfolio for new users
CREATE OR REPLACE FUNCTION create_user_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_portfolios (user_id, total_balance, available_balance)
    VALUES (NEW.id, 10000.00, 10000.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create portfolio when user signs up
CREATE OR REPLACE TRIGGER create_portfolio_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_portfolio();

-- Create function to update portfolio when trade is created
CREATE OR REPLACE FUNCTION update_portfolio_on_trade()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_portfolios 
    SET 
        total_trades = total_trades + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update portfolio stats when trade is inserted
CREATE OR REPLACE TRIGGER update_portfolio_on_trade_insert
    AFTER INSERT ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_on_trade();

-- Insert some sample forex data (optional)
INSERT INTO forex_data (base_currency, target_currency, exchange_rate, source) VALUES
    ('USD', 'EUR', 0.8500, 'ExchangeRate-API'),
    ('USD', 'GBP', 0.7800, 'ExchangeRate-API'),
    ('USD', 'JPY', 110.0000, 'ExchangeRate-API'),
    ('EUR', 'USD', 1.1765, 'ExchangeRate-API'),
    ('GBP', 'USD', 1.2821, 'ExchangeRate-API')
ON CONFLICT DO NOTHING;
```

### 3. Execute the Query
- Click "Run" to execute the SQL and create all tables, indexes, and policies
- You should see a success message

### 4. Verify Tables Created
Go to the "Table Editor" tab and you should see:
- forex_data
- trades  
- user_portfolios
- ml_signals

## Testing the Application

### 1. Start Backend Server
```bash
cd "C:\Users\This PC\OneDrive\Desktop\forex-trading-app\backend"
npm start
```

### 2. Start Frontend Server
```bash
cd "C:\Users\This PC\OneDrive\Desktop\forex-trading-app\frontend"  
npm start
```

### 3. Test Authentication Flow
1. Visit http://localhost:3000
2. You should see the Login/Signup page
3. Create a new account - this will automatically create a user portfolio
4. Sign in and test the forex data fetching
5. Create a sample trade to test database integration

## Features Implemented
✅ User Authentication (Supabase Auth)
✅ Protected Routes  
✅ User Portfolio Management
✅ Trade Recording
✅ Real-time Forex Data
✅ Row Level Security
✅ Automatic Portfolio Creation
✅ Responsive UI

## Next Steps
1. Add trade history page
2. Implement portfolio performance charts
3. Add ML signal integration
4. Create trading strategies
5. Add notifications system
