const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// ExchangeRate API base URL (Free API - no key required)
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

// Get latest exchange rates for a base currency
app.get('/api/forex/latest/:base', async (req, res) => {
  console.log(`Fetching rates for: ${req.params.base}`);
  try {
    const base = req.params.base.toUpperCase();
    console.log(`Making request to: ${EXCHANGE_RATE_API_URL}/${base}`);
    
    const response = await axios.get(`${EXCHANGE_RATE_API_URL}/${base}`);
    console.log('API response received successfully');
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Detailed error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchange rates',
      details: error.message
    });
  }
});

// Get exchange rates between two currencies
app.get('/api/forex/pair/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();
    
    console.log(`Fetching pair: ${fromCurrency}/${toCurrency}`);
    
    const response = await axios.get(`${EXCHANGE_RATE_API_URL}/${fromCurrency}`);
    
    const baseRate = response.data.rates[toCurrency];
    if (!baseRate) {
      return res.status(400).json({
        success: false,
        error: `Currency ${toCurrency} not found`
      });
    }

    res.json({
      success: true,
      data: {
        base_code: fromCurrency,
        target_code: toCurrency,
        conversion_rate: baseRate,
        time_last_update_utc: response.data.date
      }
    });
  } catch (error) {
    console.error('Error fetching currency pair:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch currency pair data'
    });
  }
});

// Get supported currencies (simplified for free API)
app.get('/api/forex/currencies', async (req, res) => {
  try {
    // Get USD rates to see all available currencies
    const response = await axios.get(`${EXCHANGE_RATE_API_URL}/USD`);
    
    const currencies = Object.keys(response.data.rates).map(code => ({
      code,
      name: getCurrencyName(code)
    }));
    
    res.json({
      success: true,
      data: {
        supported_codes: currencies
      }
    });
  } catch (error) {
    console.error('Error fetching supported currencies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported currencies'
    });
  }
});

// Helper function to get currency names
function getCurrencyName(code) {
  const currencyNames = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound Sterling',
    'JPY': 'Japanese Yen',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'SEK': 'Swedish Krona',
    'NZD': 'New Zealand Dollar',
    'MXN': 'Mexican Peso',
    'SGD': 'Singapore Dollar',
    'HKD': 'Hong Kong Dollar',
    'NOK': 'Norwegian Krone',
    'INR': 'Indian Rupee',
    'KRW': 'South Korean Won',
    'TRY': 'Turkish Lira',
    'RUB': 'Russian Ruble',
    'BRL': 'Brazilian Real',
    'ZAR': 'South African Rand'
  };
  return currencyNames[code] || code;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Forex Trading API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint with mock data
app.get('/api/forex/test', (req, res) => {
  const mockData = {
    base: 'USD',
    date: new Date().toISOString().split('T')[0],
    rates: {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.25,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.50
    }
  };
  
  console.log('Test endpoint called - returning mock data');
  
  res.json({
    success: true,
    data: mockData,
    message: 'This is test data - external API connection will be tested separately'
  });
});

// Test endpoint with mock data
app.get('/api/forex/test', (req, res) => {
  res.json({
    success: true,
    data: {
      base: "USD",
      date: "2025-09-20",
      rates: {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.25,
        CAD: 1.25,
        AUD: 1.35
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Forex API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
