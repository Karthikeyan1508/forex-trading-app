import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Signup from './Signup';
import './App.css';

// Main Dashboard Component (when user is logged in)
function Dashboard() {
  const [forexData, setForexData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [userTrades, setUserTrades] = useState([]);

  const { user, signOut, session } = useAuth();

  const getAuthHeaders = () => {
    return session?.access_token ? {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
  };

  const fetchForexData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5002/api/forex/latest/${baseCurrency}`);
      const result = await response.json();
      
      if (result.success) {
        setForexData(result.data);
      } else {
        setError(result.error || 'Failed to fetch forex data');
      }
    } catch (err) {
      console.error('Frontend error:', err);
      setError('Error connecting to server. Make sure the backend is running on port 5002.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencyPair = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5002/api/forex/pair/${baseCurrency}/${targetCurrency}`);
      const result = await response.json();
      
      if (result.success) {
        setForexData(result.data);
      } else {
        setError(result.error || 'Failed to fetch currency pair data');
      }
    } catch (err) {
      console.error('Frontend error:', err);
      setError('Error connecting to server. Make sure the backend is running on port 5002.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTrades = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/trades', {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setUserTrades(result.data);
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
    }
  };

  const createSampleTrade = async () => {
    if (!forexData || !forexData.rates) return;

    try {
      const sampleTrade = {
        strategy: 'Manual',
        currency_pair: `${baseCurrency}/${targetCurrency}`,
        trade_type: 'Buy',
        price: forexData.rates[targetCurrency] || 1.0,
        quantity: 1000,
        trade_date: new Date().toISOString()
      };

      const response = await fetch('http://localhost:5002/api/trades', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sampleTrade)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Sample trade created successfully!');
        fetchUserTrades();
      } else {
        alert('Failed to create trade: ' + result.error);
      }
    } catch (err) {
      console.error('Error creating trade:', err);
      alert('Error creating trade');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchForexData();
      fetchUserTrades();
    }
  }, [user]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>🏦 Forex Trading Dashboard</h1>
            <p>Welcome back, {user?.user_metadata?.name || user?.email}!</p>
            <p>✅ Backend running on: <strong>http://localhost:5002</strong></p>
          </div>
          <button onClick={handleSignOut} className="signout-button">
            Sign Out
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="controls">
          <div className="currency-selector">
            <label>
              Base Currency:
              <select 
                value={baseCurrency} 
                onChange={(e) => setBaseCurrency(e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CHF">CHF - Swiss Franc</option>
                <option value="CNY">CNY - Chinese Yuan</option>
              </select>
            </label>

            <label>
              Target Currency:
              <select 
                value={targetCurrency} 
                onChange={(e) => setTargetCurrency(e.target.value)}
              >
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CHF">CHF - Swiss Franc</option>
                <option value="CNY">CNY - Chinese Yuan</option>
              </select>
            </label>
          </div>

          <div className="buttons">
            <button onClick={fetchForexData} disabled={loading}>
              Get All Rates for {baseCurrency}
            </button>
            <button onClick={fetchCurrencyPair} disabled={loading}>
              Get {baseCurrency}/{targetCurrency} Rate
            </button>
            <button onClick={createSampleTrade} disabled={loading || !forexData}>
              📊 Create Sample Trade
            </button>
          </div>
        </div>

        {loading && <div className="loading">Loading forex data...</div>}
        
        {error && <div className="error">{error}</div>}

        {forexData && (
          <div className="forex-data">
            <div className="data-header">
              <h2>📈 Exchange Rate Data</h2>
              <p>Base Currency: <strong>{forexData.base}</strong></p>
              <p>Last Updated: <strong>{forexData.date}</strong></p>
            </div>

            {forexData.rates ? (
              <div className="rates-grid">
                <h3>All Exchange Rates (1 {forexData.base} =)</h3>
                <div className="rates-list">
                  {Object.entries(forexData.rates)
                    .slice(0, 20)
                    .map(([currency, rate]) => (
                      <div key={currency} className="rate-item">
                        <span className="currency">{currency}</span>
                        <span className="rate">{typeof rate === 'number' ? rate.toFixed(4) : rate}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="pair-data">
                <h3>Currency Pair Rate</h3>
                <div className="pair-rate">
                  <p>1 {forexData.base_code} = {forexData.conversion_rate} {forexData.target_code}</p>
                  <p>Last Updated: {forexData.time_last_update_utc}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {userTrades.length > 0 && (
          <div className="trades-section">
            <h3>📊 Your Recent Trades</h3>
            <div className="trades-list">
              {userTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="trade-item">
                  <span className={`trade-type ${trade.trade_type.toLowerCase()}`}>
                    {trade.trade_type}
                  </span>
                  <span className="trade-pair">{trade.currency_pair}</span>
                  <span className="trade-price">${trade.price}</span>
                  <span className="trade-quantity">{trade.quantity}</span>
                  <span className="trade-strategy">{trade.strategy}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Authentication wrapper component
function AuthWrapper() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <Login onToggleMode={() => setIsLogin(false)} />
    ) : (
      <Signup onToggleMode={() => setIsLogin(true)} />
    );
  }

  return <Dashboard />;
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;
