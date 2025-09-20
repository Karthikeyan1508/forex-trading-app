import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [forexData, setForexData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');

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

  const fetchTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5002/api/forex/test`);
      const result = await response.json();
      
      if (result.success) {
        setForexData(result.data);
      } else {
        setError('Failed to fetch test data');
      }
    } catch (err) {
      console.error('Frontend error:', err);
      setError('Error connecting to server. Backend might not be running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForexData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏦 Forex Trading Dashboard</h1>
        <p>Real-time exchange rates powered by ExchangeRate API</p>
        <p>✅ Backend running on: <strong>http://localhost:5002</strong></p>
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
            <button onClick={fetchTestData} disabled={loading}>
              🧪 Test Connection
            </button>
            <button onClick={fetchForexData} disabled={loading}>
              Get All Rates for {baseCurrency}
            </button>
            <button onClick={fetchCurrencyPair} disabled={loading}>
              Get {baseCurrency}/{targetCurrency} Rate
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
                    .slice(0, 20) // Show first 20 currencies
                    .map(([currency, rate]) => (
                      <div key={currency} className="rate-item">
                        <span className="currency">{currency}</span>
                        <span className="rate">{rate.toFixed(4)}</span>
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
      </main>
    </div>
  );
}

export default App;
