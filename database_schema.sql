-- Create forex_data table
CREATE TABLE forex_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    currency_pair TEXT NOT NULL,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    volume_ticks INTEGER DEFAULT 0,
    sma10 FLOAT,
    sma50 FLOAT,
    ema20 FLOAT,
    atr14 FLOAT,
    rsi14 FLOAT,
    bband_upper FLOAT,
    bband_lower FLOAT,
    volatility20 FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create trades table
CREATE TABLE trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL,
    currency_pair TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('Buy', 'Sell')),
    price FLOAT NOT NULL,
    quantity FLOAT NOT NULL,
    trade_date TIMESTAMP NOT NULL,
    pnl FLOAT DEFAULT 0,
    status TEXT DEFAULT 'Filled' CHECK (status IN ('Filled', 'Pending', 'Cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create ml_signals table
CREATE TABLE ml_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency_pair TEXT NOT NULL,
    date DATE NOT NULL,
    predicted_signal TEXT NOT NULL CHECK (predicted_signal IN ('Buy', 'Sell', 'Hold')),
    probability FLOAT,
    features JSONB,
    strategy TEXT DEFAULT 'Logistic Regression',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_portfolios table for tracking user's trading performance
CREATE TABLE user_portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    currency_pair TEXT NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_pnl FLOAT DEFAULT 0,
    balance FLOAT DEFAULT 10000, -- Starting balance
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_forex_data_currency_pair ON forex_data(currency_pair);
CREATE INDEX idx_forex_data_date ON forex_data(date);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_currency_pair ON trades(currency_pair);
CREATE INDEX idx_trades_date ON trades(trade_date);
CREATE INDEX idx_ml_signals_currency_pair ON ml_signals(currency_pair);
CREATE INDEX idx_ml_signals_date ON ml_signals(date);

-- Enable Row Level Security (RLS)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own trades
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own portfolio
CREATE POLICY "Users can view their own portfolio" ON user_portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio" ON user_portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio" ON user_portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public access to forex_data and ml_signals (no user-specific data)
ALTER TABLE forex_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view forex data" ON forex_data
    FOR SELECT USING (true);

CREATE POLICY "Public can view ML signals" ON ml_signals
    FOR SELECT USING (true);

-- Function to automatically create user portfolio on user registration
CREATE OR REPLACE FUNCTION create_user_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_portfolios (user_id, currency_pair)
    VALUES 
        (NEW.id, 'USD/EUR'),
        (NEW.id, 'USD/GBP'),
        (NEW.id, 'USD/JPY'),
        (NEW.id, 'USD/CAD'),
        (NEW.id, 'USD/AUD');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create portfolio when user signs up
CREATE TRIGGER create_user_portfolio_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_portfolio();
