
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// ...existing code...

// Backtest endpoint for Bollinger Bands strategy
app.get('/api/backtest/:baseCurrency/:targetCurrency', async (req, res) => {
  const { baseCurrency, targetCurrency } = req.params;
  const days = parseInt(req.query.days) || 90;
  const balance = parseFloat(req.query.balance) || 10000;

  // Mock backtest data
  const mockData = {
    baseCurrency,
    targetCurrency,
    days,
    initialBalance: balance,
    finalBalance: balance * (1 + Math.random() * 0.1),
    trades: [
      { date: '2025-07-01', action: 'BUY', price: 1.12, amount: 1000, pnl: 50 },
      { date: '2025-07-10', action: 'SELL', price: 1.15, amount: 1000, pnl: 80 },
      { date: '2025-08-01', action: 'BUY', price: 1.13, amount: 1000, pnl: -20 },
      { date: '2025-08-15', action: 'SELL', price: 1.18, amount: 1000, pnl: 120 },
    ],
    metrics: {
      totalTrades: 4,
      winRate: 0.75,
      maxDrawdown: 0.04,
      sharpeRatio: 1.2,
      totalPnL: 230
    }
  };
  res.json({ success: true, data: mockData });
});

// ...existing code...

// Single Forex Pair Price Endpoint
app.get('/api/forex/pair/:base/:target', async (req, res) => {
  const { base, target } = req.params;
  const apiKey = process.env.FOREX_API_KEY || '3474488b7ca77d943794cf28';
  if (!base || !target || base === target) {
    return res.status(400).json({ error: 'Invalid currency pair' });
  }
  try {
    const url = `${EXCHANGE_RATE_API_URL}/${apiKey}/pair/${base}/${target}`;
    const response = await axios.get(url);
    const data = response.data;
    if (data.result === 'success') {
      res.json({
        pair: `${base}/${target}`,
        rate: data.conversion_rate,
        lastUpdate: data.time_last_update_utc
      });
    } else {
      res.status(500).json({ error: data["error-type"] || 'API error' });
    }
  } catch (error) {
    console.error('Pair price fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch forex pair price' });
  }
});

// Live Forex Prices for All Currencies Endpoint
app.get('/api/forex/all', async (req, res) => {
  const apiKey = process.env.FOREX_API_KEY || '3474488b7ca77d943794cf28';
  const baseCurrency = req.query.base || 'USD';
  try {
    // This endpoint returns all rates for the base currency
    const url = `${EXCHANGE_RATE_API_URL}/${apiKey}/latest/${baseCurrency}`;
    const response = await axios.get(url);
    const data = response.data;
    if (data.result === 'success') {
      // Return all rates as an array of { pair, rate }
      const rates = Object.entries(data.conversion_rates).map(([target, rate]) => ({
        pair: `${baseCurrency}/${target}`,
        rate,
      }));
      res.json({
        base: baseCurrency,
        lastUpdate: data.time_last_update_utc,
        rates
      });
    } else {
      res.status(500).json({ error: data["error-type"] || 'API error' });
    }
  } catch (error) {
    console.error('All live prices fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch all live forex prices' });
  }
});

// Import Supabase client
const supabase = require('./supabase');

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware - must be declared before any route that uses it
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// ExchangeRate API base URL (with API key)
const EXCHANGE_RATE_API_URL = 'https://v6.exchangerate-api.com/v6';

// Live Forex Price Endpoint
app.get('/api/forex/latest/:baseCurrency/:targetCurrency', async (req, res) => {
  const { baseCurrency, targetCurrency } = req.params;
  const apiKey = process.env.FOREX_API_KEY || '3474488b7ca77d943794cf28';
  if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) {
    return res.status(400).json({ error: 'Invalid currency pair' });
  }
  try {
    const url = `${EXCHANGE_RATE_API_URL}/${apiKey}/pair/${baseCurrency}/${targetCurrency}`;
    const response = await axios.get(url);
    const data = response.data;
    if (data.result === 'success') {
      res.json({
        pair: `${baseCurrency}/${targetCurrency}`,
        rate: data.conversion_rate,
        lastUpdate: data.time_last_update_utc
      });
    } else {
      res.status(500).json({ error: data["error-type"] || 'API error' });
    }
  } catch (error) {
    console.error('Live price fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch live forex price' });
  }
});

// Bollinger Bands Route - must be after authenticateUser declaration
app.get('/api/bollinger-bands/:baseCurrency/:targetCurrency', authenticateUser, async (req, res) => {
  const { baseCurrency, targetCurrency } = req.params;

  try {
    // Mock data for demonstration. Replace with actual Bollinger Bands calculation logic
    const mockData = {
      historical_data: [
        { close: 1.15 },
        { close: 1.17 },
        { close: 1.16 },
        { close: 1.18 },
        { close: 1.20 },
        { close: 1.22 }
      ],
      bollinger_bands: [
        { upper: 1.23, middle: 1.19, lower: 1.15 },
        { upper: 1.25, middle: 1.21, lower: 1.18 },
        { upper: 1.27, middle: 1.23, lower: 1.19 },
        { upper: 1.28, middle: 1.24, lower: 1.21 },
        { upper: 1.30, middle: 1.26, lower: 1.23 },
        { upper: 1.32, middle: 1.28, lower: 1.25 }
      ],
      signals: [
        { signal: 'Buy', price: 1.15, strength: 0.85, confidence: 0.9 },
        { signal: 'Sell', price: 1.32, strength: 0.75, confidence: 0.8 }
      ],
      analysis: {
        position: 'Middle',
        volatility: 'Low',
        trend: 'Uptrend',
        recommendation: 'Hold'
      }
    };

    res.json(mockData);
  } catch (error) {
    console.error('Error in bollinger bands API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Other application routes here... (your existing code)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Forex API endpoints available at http://localhost:${PORT}/api`);
});
