const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Import Bollinger Bands utilities
const { getBollingerBandsAnalysis } = require('./utils/bollingerBands');

const app = express();
const PORT = process.env.PORT || 5002;

// Import Supabase client
const supabase = require('./supabase');

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
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

// ExchangeRate API base URL (Free API - no key required)
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

// ==================== AUTHENTICATION ROUTES ====================
// Sign up new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Manual portfolio creation as backup
    // This will only run if the database trigger fails
    if (data.user && data.user.id) {
      try {
        // Check if portfolio already exists (in case trigger worked)
        const { data: existingPortfolio, error: checkError } = await supabase
          .from('user_portfolios')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        // If no portfolio exists, create one
        if (!existingPortfolio || checkError) {
          const { error: portfolioError } = await supabase
            .from('user_portfolios')
            .insert({
              user_id: data.user.id,
              total_balance: 10000.00,
              available_balance: 10000.00,
              total_profit_loss: 0,
              total_trades: 0,
              successful_trades: 0
            });

          if (portfolioError) {
            console.warn('Failed to create user portfolio manually:', portfolioError);
          } else {
            console.log('User portfolio created manually for user:', data.user.id);
          }
        }
      } catch (portfolioErr) {
        console.warn('Portfolio creation backup failed:', portfolioErr);
        // Don't fail the signup if portfolio creation fails
      }
    }

    res.json({
      success: true,
      message: 'User created successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Sign in user
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'User signed in successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Sign in failed:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// Sign out user
app.post('/api/auth/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'User signed out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Sign out failed' });
  }
});

// Get user profile (protected route)
app.get('/api/auth/profile', authenticateUser, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ==================== DATABASE ROUTES ====================
// Save forex data to database
app.post('/api/forex/save', authenticateUser, async (req, res) => {
  try {
    const { date, base_currency, quote_currency, currency_pair, open, high, low, close } = req.body;
    
    const { data, error } = await supabase
      .from('forex_data')
      .insert([{
        date,
        base_currency,
        quote_currency,
        currency_pair,
        open,
        high,
        low,
        close
      }])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Forex data saved successfully',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save forex data' });
  }
});

// Get user's trades
app.get('/api/trades', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', req.user.id)
      .order('trade_date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trades' });
  }
});

// Create new trade
app.post('/api/trades', authenticateUser, async (req, res) => {
  try {
    const { strategy, currency_pair, trade_type, price, quantity, trade_date } = req.body;
    
    const { data, error } = await supabase
      .from('trades')
      .insert([{
        user_id: req.user.id,
        strategy,
        currency_pair,
        trade_type,
        price,
        quantity,
        trade_date: trade_date || new Date().toISOString()
      }])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Trade created successfully',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// Get user's portfolio
app.get('/api/portfolio', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
});

// ==================== FOREX DATA ROUTES ====================

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

// Get supported currencies with country details
app.get('/api/forex/currencies', async (req, res) => {
  try {
    // Get USD rates to see all available currencies
    const response = await axios.get(`${EXCHANGE_RATE_API_URL}/USD`);
    
    const currencies = Object.keys(response.data.rates).map(code => {
      const details = getCurrencyDetails(code);
      return {
        ...details,
        rate: response.data.rates[code] // Current rate against USD
      };
    });
    
    res.json({
      success: true,
      data: {
        base: 'USD',
        total_currencies: currencies.length,
        last_updated: response.data.date,
        supported_currencies: currencies
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

// Get detailed currency information by code
app.get('/api/forex/currency/:code', async (req, res) => {
  try {
    const currencyCode = req.params.code.toUpperCase();
    const details = getCurrencyDetails(currencyCode);
    
    // Get current rates for this currency
    const response = await axios.get(`${EXCHANGE_RATE_API_URL}/${currencyCode}`);
    
    res.json({
      success: true,
      data: {
        ...details,
        current_rates: response.data.rates,
        last_updated: response.data.date,
        total_pairs: Object.keys(response.data.rates).length
      }
    });
  } catch (error) {
    console.error('Error fetching currency details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch currency details'
    });
  }
});

// Search currencies by country name
app.get('/api/forex/search/country/:country', (req, res) => {
  try {
    const countryName = req.params.country.toLowerCase();
    const matchingCurrencies = [];
    
    Object.keys(currencyData).forEach(code => {
      const currency = currencyData[code];
      const hasMatchingCountry = currency.countries.some(country => 
        country.toLowerCase().includes(countryName)
      );
      
      if (hasMatchingCountry) {
        matchingCurrencies.push({
          code,
          name: currency.name,
          countries: currency.countries,
          symbol: currency.symbol
        });
      }
    });
    
    res.json({
      success: true,
      search_term: req.params.country,
      results_count: matchingCurrencies.length,
      data: matchingCurrencies
    });
  } catch (error) {
    console.error('Error searching currencies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search currencies'
    });
  }
});

// Comprehensive currency data with countries
const currencyData = {
  'USD': { name: 'US Dollar', countries: ['United States', 'Ecuador', 'El Salvador', 'Panama', 'Puerto Rico'], symbol: '$' },
  'EUR': { name: 'Euro', countries: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Portugal', 'Finland', 'Ireland', 'Greece', 'Luxembourg', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Malta', 'Cyprus'], symbol: '€' },
  'GBP': { name: 'British Pound Sterling', countries: ['United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland'], symbol: '£' },
  'JPY': { name: 'Japanese Yen', countries: ['Japan'], symbol: '¥' },
  'AUD': { name: 'Australian Dollar', countries: ['Australia', 'Nauru', 'Tuvalu', 'Kiribati'], symbol: 'A$' },
  'CAD': { name: 'Canadian Dollar', countries: ['Canada'], symbol: 'C$' },
  'CHF': { name: 'Swiss Franc', countries: ['Switzerland', 'Liechtenstein'], symbol: 'CHF' },
  'CNY': { name: 'Chinese Yuan', countries: ['China'], symbol: '¥' },
  'SEK': { name: 'Swedish Krona', countries: ['Sweden'], symbol: 'kr' },
  'NOK': { name: 'Norwegian Krone', countries: ['Norway'], symbol: 'kr' },
  'DKK': { name: 'Danish Krone', countries: ['Denmark', 'Faroe Islands', 'Greenland'], symbol: 'kr' },
  'PLN': { name: 'Polish Zloty', countries: ['Poland'], symbol: 'zł' },
  'CZK': { name: 'Czech Koruna', countries: ['Czech Republic'], symbol: 'Kč' },
  'HUF': { name: 'Hungarian Forint', countries: ['Hungary'], symbol: 'Ft' },
  'RUB': { name: 'Russian Ruble', countries: ['Russia'], symbol: '₽' },
  'INR': { name: 'Indian Rupee', countries: ['India', 'Bhutan'], symbol: '₹' },
  'BRL': { name: 'Brazilian Real', countries: ['Brazil'], symbol: 'R$' },
  'MXN': { name: 'Mexican Peso', countries: ['Mexico'], symbol: '$' },
  'ZAR': { name: 'South African Rand', countries: ['South Africa', 'Lesotho', 'Namibia', 'Eswatini'], symbol: 'R' },
  'KRW': { name: 'South Korean Won', countries: ['South Korea'], symbol: '₩' },
  'SGD': { name: 'Singapore Dollar', countries: ['Singapore', 'Brunei'], symbol: 'S$' },
  'HKD': { name: 'Hong Kong Dollar', countries: ['Hong Kong'], symbol: 'HK$' },
  'NZD': { name: 'New Zealand Dollar', countries: ['New Zealand', 'Cook Islands', 'Niue', 'Pitcairn Islands', 'Tokelau'], symbol: 'NZ$' },
  'TRY': { name: 'Turkish Lira', countries: ['Turkey', 'Northern Cyprus'], symbol: '₺' },
  'ILS': { name: 'Israeli New Shekel', countries: ['Israel', 'Palestine'], symbol: '₪' },
  'AED': { name: 'UAE Dirham', countries: ['United Arab Emirates'], symbol: 'د.إ' },
  'SAR': { name: 'Saudi Riyal', countries: ['Saudi Arabia'], symbol: 'ر.س' },
  'QAR': { name: 'Qatari Riyal', countries: ['Qatar'], symbol: 'ر.ق' },
  'KWD': { name: 'Kuwaiti Dinar', countries: ['Kuwait'], symbol: 'د.ك' },
  'BHD': { name: 'Bahraini Dinar', countries: ['Bahrain'], symbol: '.د.ب' },
  'OMR': { name: 'Omani Rial', countries: ['Oman'], symbol: 'ر.ع.' },
  'EGP': { name: 'Egyptian Pound', countries: ['Egypt'], symbol: '£' },
  'NGN': { name: 'Nigerian Naira', countries: ['Nigeria'], symbol: '₦' },
  'GHS': { name: 'Ghanaian Cedi', countries: ['Ghana'], symbol: '₵' },
  'KES': { name: 'Kenyan Shilling', countries: ['Kenya'], symbol: 'Sh' },
  'UGX': { name: 'Ugandan Shilling', countries: ['Uganda'], symbol: 'Sh' },
  'TZS': { name: 'Tanzanian Shilling', countries: ['Tanzania'], symbol: 'Sh' },
  'ETB': { name: 'Ethiopian Birr', countries: ['Ethiopia'], symbol: 'Br' },
  'MAD': { name: 'Moroccan Dirham', countries: ['Morocco', 'Western Sahara'], symbol: 'د.م.' },
  'TND': { name: 'Tunisian Dinar', countries: ['Tunisia'], symbol: 'د.ت' },
  'DZD': { name: 'Algerian Dinar', countries: ['Algeria'], symbol: 'د.ج' },
  'LYD': { name: 'Libyan Dinar', countries: ['Libya'], symbol: 'ل.د' },
  'THB': { name: 'Thai Baht', countries: ['Thailand'], symbol: '฿' },
  'MYR': { name: 'Malaysian Ringgit', countries: ['Malaysia'], symbol: 'RM' },
  'IDR': { name: 'Indonesian Rupiah', countries: ['Indonesia'], symbol: 'Rp' },
  'PHP': { name: 'Philippine Peso', countries: ['Philippines'], symbol: '₱' },
  'VND': { name: 'Vietnamese Dong', countries: ['Vietnam'], symbol: '₫' },
  'PKR': { name: 'Pakistani Rupee', countries: ['Pakistan'], symbol: '₨' },
  'BDT': { name: 'Bangladeshi Taka', countries: ['Bangladesh'], symbol: '৳' },
  'LKR': { name: 'Sri Lankan Rupee', countries: ['Sri Lanka'], symbol: '₨' },
  'NPR': { name: 'Nepalese Rupee', countries: ['Nepal'], symbol: '₨' },
  'AFN': { name: 'Afghan Afghani', countries: ['Afghanistan'], symbol: '؋' },
  'IRR': { name: 'Iranian Rial', countries: ['Iran'], symbol: '﷼' },
  'IQD': { name: 'Iraqi Dinar', countries: ['Iraq'], symbol: 'ع.د' },
  'JOD': { name: 'Jordanian Dinar', countries: ['Jordan'], symbol: 'د.ا' },
  'LBP': { name: 'Lebanese Pound', countries: ['Lebanon'], symbol: 'ل.ل' },
  'SYP': { name: 'Syrian Pound', countries: ['Syria'], symbol: '£' },
  'YER': { name: 'Yemeni Rial', countries: ['Yemen'], symbol: '﷼' }
};

// ==================== BOLLINGER BANDS STRATEGY ROUTES ====================
// Get comprehensive Bollinger Bands analysis for a currency pair
app.get('/api/bollinger/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    
    console.log(`🎯 API Request: Bollinger Bands analysis for ${from}/${to}`);
    
    // Use CSV-integrated Bollinger Bands analysis
    const analysis = await getBollingerBandsAnalysis(from, to);
    
    res.json({
      success: true,
      message: `Bollinger Bands analysis for ${from}/${to}`,
      data: analysis
    });
  } catch (error) {
    console.error('❌ Bollinger Bands API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform Bollinger Bands analysis',
      details: error.message
    });
  }
});

// Get current trading signal for a currency pair
app.get('/api/signal/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    
    // Get Bollinger Bands data
    const bollingerData = await getHistoricalBollingerData(from, to, 30);
    
    // Get current rate
    const currentRateResponse = await axios.get(`${EXCHANGE_RATE_API_URL}/${from}`);
    const currentRate = currentRateResponse.data.rates[to];
    
    if (!currentRate) {
      return res.status(400).json({
        success: false,
        error: `Exchange rate not available for ${from}/${to}`
      });
    }

    // Evaluate auto-trading conditions if requested
    const autoTradingEval = evaluateAutoTradingConditions(bollingerData, {
      maxRisk: 2,
      minConfidence: 70
    });

    res.json({
      success: true,
      data: {
        currencyPair: `${from}/${to}`,
        currentPrice: currentRate,
        signal: bollingerData.bollingerBands.currentSignal,
        analysis: bollingerData.analysis,
        autoTradingRecommendation: autoTradingEval,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trading signal'
    });
  }
});

// Get backtesting results for Bollinger Bands strategy
app.get('/api/backtest/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    const days = parseInt(req.query.days) || 90;
    const initialBalance = parseFloat(req.query.balance) || 10000;
    
    const bollingerData = await getHistoricalBollingerData(from, to, days);
    
    // Simulate trading based on signals
    let balance = initialBalance;
    let position = 0;
    let trades = [];
    let maxDrawdown = 0;
    let peakBalance = initialBalance;
    
    const signals = bollingerData.bollingerBands.signals || [];
    const historicalData = bollingerData.historical || [];
    
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const price = signal.price;
      
      if (signal.signal.includes('BUY') && position <= 0 && signal.strength > 70) {
        // Buy signal
        const tradeSize = Math.floor(balance * 0.1); // 10% of balance
        const quantity = tradeSize / price;
        position += quantity;
        balance -= tradeSize;
        
        trades.push({
          type: 'BUY',
          price: price,
          quantity: quantity,
          amount: tradeSize,
          balance: balance,
          signal: signal.signal,
          strength: signal.strength,
          date: historicalData[signal.index]?.date || new Date().toISOString()
        });
      } else if (signal.signal.includes('SELL') && position > 0 && signal.strength > 70) {
        // Sell signal
        const saleAmount = position * price;
        balance += saleAmount;
        
        trades.push({
          type: 'SELL',
          price: price,
          quantity: position,
          amount: saleAmount,
          balance: balance,
          signal: signal.signal,
          strength: signal.strength,
          date: historicalData[signal.index]?.date || new Date().toISOString()
        });
        
        position = 0;
      }
      
      // Calculate drawdown
      if (balance > peakBalance) {
        peakBalance = balance;
      }
      const drawdown = ((peakBalance - balance) / peakBalance) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Final position value
    const finalValue = balance + (position * signals[signals.length - 1]?.price || 0);
    const totalReturn = ((finalValue - initialBalance) / initialBalance) * 100;
    const winningTrades = trades.filter(t => t.type === 'SELL').filter(t => {
      const buyTrade = trades.reverse().find(bt => bt.type === 'BUY' && bt.date < t.date);
      return buyTrade ? t.price > buyTrade.price : false;
    }).length;
    
    const totalTrades = trades.filter(t => t.type === 'SELL').length;
    
    res.json({
      success: true,
      data: {
        currencyPair: `${from}/${to}`,
        backtestPeriod: `${days} days`,
        initialBalance,
        finalBalance: Math.round(finalValue * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalTrades,
        winningTrades,
        winRate: totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        trades: trades.slice(-20), // Last 20 trades
        analysis: bollingerData.analysis
      }
    });
  } catch (error) {
    console.error('Backtesting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run backtest'
    });
  }
});

// ==================== INSTITUTION ROUTES (Role-based) ====================
// Get auto-trades for the institution
app.get('/api/institution/auto-trades', authenticateUser, async (req, res) => {
  try {
    const userRole = req.user.user_metadata?.role || 'user';
    if (userRole !== 'institution') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action'
      });
    }

    const { data, error } = await supabase
      .from('auto_trades')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching auto-trades:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create/Update auto-trading settings
app.post('/api/institution/auto-trade', authenticateUser, async (req, res) => {
  try {
    const userRole = req.user.user_metadata?.role || 'user';
    if (userRole !== 'institution') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action'
      });
    }

    const {
      strategy,
      currency_pair,
      is_active = true,
      max_risk_per_trade = 10000,
      stop_loss_pct = 5.0,
      take_profit_pct = 10.0,
      trade_frequency_minutes = 60
    } = req.body;

    if (!strategy || !currency_pair) {
      return res.status(400).json({
        success: false,
        error: 'Strategy and currency pair are required'
      });
    }

    // Check if user already has an auto-trade setup for this pair
    const { data: existing } = await supabase
      .from('auto_trades')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('currency_pair', currency_pair)
      .single();

    let result;

    if (existing) {
      // Update existing auto-trade
      const { data, error } = await supabase
        .from('auto_trades')
        .update({
          strategy,
          is_active,
          max_risk_per_trade,
          stop_loss_pct,
          take_profit_pct,
          trade_frequency_minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new auto-trade
      const { data, error } = await supabase
        .from('auto_trades')
        .insert([{
          user_id: req.user.id,
          strategy,
          currency_pair,
          is_active,
          max_risk_per_trade,
          stop_loss_pct,
          take_profit_pct,
          trade_frequency_minutes
        }])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error.message
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: existing ? 'Auto-trade settings updated' : 'Auto-trade created'
    });
  } catch (error) {
    console.error('Error creating/updating auto-trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Toggle auto-trading on/off
app.patch('/api/institution/auto-trade/:id/toggle', authenticateUser, async (req, res) => {
  try {
    const userRole = req.user.user_metadata?.role || 'user';
    if (userRole !== 'institution') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action'
      });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from('auto_trades')
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Auto-trade not found or access denied'
      });
    }

    res.json({
      success: true,
      data: data,
      message: `Auto-trading ${is_active ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling auto-trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to get currency details
function getCurrencyDetails(code) {
  const currency = currencyData[code];
  if (currency) {
    return {
      code,
      name: currency.name,
      countries: currency.countries,
      symbol: currency.symbol
    };
  }
  return {
    code,
    name: code,
    countries: ['Unknown'],
    symbol: code
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Forex Trading API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      latest_rates: '/api/forex/latest/:base',
      currency_pair: '/api/forex/pair/:from/:to',
      all_currencies: '/api/forex/currencies',
      currency_details: '/api/forex/currency/:code',
      search_by_country: '/api/forex/search/country/:country'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Forex API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Currency search: http://localhost:${PORT}/api/forex/search/country/{countryName}`);
  console.log(`💰 Currency details: http://localhost:${PORT}/api/forex/currency/{currencyCode}`);
});
