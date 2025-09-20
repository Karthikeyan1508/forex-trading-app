import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [forexData, setForexData] = useState(null);
  const [currencyDetails, setCurrencyDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchResults, setSearchResults] = useState(null);

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
      const response = await fetch(`http://localhost:5002/api/forex/currencies`);
      const result = await response.json();
      
      if (result.success) {
        setForexData(result.data);
      } else {
        setError('Failed to fetch currency data');
      }
    } catch (err) {
      console.error('Frontend error:', err);
      setError('Error connecting to server. Backend might not be running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencyDetails = async (currencyCode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5002/api/forex/currency/${currencyCode}`);
      const result = await response.json();
      
      if (result.success) {
        setCurrencyDetails(result.data);
      } else {
        setError('Failed to fetch currency details');
      }
    } catch (err) {
      console.error('Frontend error:', err);
      setError('Error connecting to server. Backend might not be running.');
    } finally {
      setLoading(false);
    }
  };

  const searchByCountry = async () => {
    if (!searchCountry.trim()) {
      setError('Please enter a country name');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5002/api/forex/search/country/${searchCountry}`);
      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result);
      } else {
        setError('No currencies found for this country');
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
              📊 Get All Currencies
            </button>
            <button onClick={fetchForexData} disabled={loading}>
              💱 Get All Rates for {baseCurrency}
            </button>
            <button onClick={fetchCurrencyPair} disabled={loading}>
              🔄 Get {baseCurrency}/{targetCurrency} Rate
            </button>
            <button onClick={() => fetchCurrencyDetails(baseCurrency)} disabled={loading}>
              📋 Get {baseCurrency} Details
            </button>
          </div>

          <div className="search-section">
            <h3>🌍 Search Currency by Country</h3>
            <div className="search-controls">
              <input
                type="text"
                placeholder="Enter country name (e.g., Germany, India, Japan)"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchByCountry()}
              />
              <button onClick={searchByCountry} disabled={loading}>
                🔍 Search
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading forex data...</div>}
        
        {error && <div className="error">{error}</div>}

        {forexData && (
          <div className="forex-data">
            <div className="data-header">
              <h2>📈 Exchange Rate Data</h2>
              {forexData.base && <p>Base Currency: <strong>{forexData.base}</strong></p>}
              {forexData.date && <p>Last Updated: <strong>{forexData.date}</strong></p>}
              {forexData.last_updated && <p>Last Updated: <strong>{forexData.last_updated}</strong></p>}
              {forexData.total_currencies && <p>Total Currencies: <strong>{forexData.total_currencies}</strong></p>}
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
            ) : forexData.supported_currencies ? (
              <div className="currencies-grid">
                <h3>All Supported Currencies ({forexData.total_currencies})</h3>
                <div className="currencies-list">
                  {forexData.supported_currencies.slice(0, 30).map((currency) => (
                    <div key={currency.code} className="currency-item" onClick={() => fetchCurrencyDetails(currency.code)}>
                      <div className="currency-header">
                        <span className="currency-code">{currency.code}</span>
                        <span className="currency-symbol">{currency.symbol}</span>
                      </div>
                      <div className="currency-name">{currency.name}</div>
                      <div className="currency-countries">
                        {currency.countries.slice(0, 2).join(', ')}
                        {currency.countries.length > 2 && ` +${currency.countries.length - 2} more`}
                      </div>
                      <div className="currency-rate">1 USD = {currency.rate?.toFixed(4) || 'N/A'} {currency.code}</div>
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

        {currencyDetails && (
          <div className="currency-details">
            <h2>💰 {currencyDetails.name} ({currencyDetails.code}) Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Symbol:</strong> {currencyDetails.symbol}
              </div>
              <div className="detail-item">
                <strong>Countries:</strong> {currencyDetails.countries.join(', ')}
              </div>
              <div className="detail-item">
                <strong>Total Trading Pairs:</strong> {currencyDetails.total_pairs}
              </div>
              <div className="detail-item">
                <strong>Last Updated:</strong> {currencyDetails.last_updated}
              </div>
            </div>
            <div className="rates-preview">
              <h4>Sample Rates (1 {currencyDetails.code} =)</h4>
              <div className="rates-list">
                {Object.entries(currencyDetails.current_rates)
                  .slice(0, 8)
                  .map(([currency, rate]) => (
                    <div key={currency} className="rate-item">
                      <span className="currency">{currency}</span>
                      <span className="rate">{rate.toFixed(4)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {searchResults && (
          <div className="search-results">
            <h2>🔍 Search Results for "{searchResults.search_term}"</h2>
            <p>Found {searchResults.results_count} currency(ies)</p>
            <div className="search-results-list">
              {searchResults.data.map((currency) => (
                <div key={currency.code} className="search-result-item" onClick={() => fetchCurrencyDetails(currency.code)}>
                  <div className="result-header">
                    <span className="currency-code">{currency.code}</span>
                    <span className="currency-symbol">{currency.symbol}</span>
                  </div>
                  <div className="currency-name">{currency.name}</div>
                  <div className="currency-countries">
                    <strong>Used in:</strong> {currency.countries.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
