import React, { useState, useEffect } from 'react';
import './LivePricePanel.css';

const LivePricePanel = ({ baseCurrency, targetCurrency, onCurrencyChange, session }) => {
  const [priceData, setPriceData] = useState(null);
  const [signalData, setSignalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const currencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' }
  ];

  const fetchPriceAndSignal = async () => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch current price
      const priceResponse = await fetch(`http://localhost:5002/api/forex/pair/${baseCurrency}/${targetCurrency}`);
      const priceResult = await priceResponse.json();

      if (priceResult.success) {
        setPriceData({
          rate: priceResult.data.conversion_rate,
          lastUpdate: priceResult.data.time_last_update_utc,
          pair: `${baseCurrency}/${targetCurrency}`
        });
      }

      // Fetch Bollinger Bands signal
      const signalResponse = await fetch(`http://localhost:5002/api/signal/${baseCurrency}/${targetCurrency}`);
      const signalResult = await signalResponse.json();

      if (signalResult.success) {
        setSignalData(signalResult.data);
      }

      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching price/signal:', err);
      setError('Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceAndSignal();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchPriceAndSignal, 30000);
    
    return () => clearInterval(interval);
  }, [baseCurrency, targetCurrency]);

  const getSignalColor = (signal) => {
    if (!signal) return '#6B7280';
    
    switch (signal.signal) {
      case 'STRONG_BUY':
        return '#10B981';
      case 'BUY':
        return '#34D399';
      case 'STRONG_SELL':
        return '#EF4444';
      case 'SELL':
        return '#F87171';
      case 'NEUTRAL':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getSignalIcon = (signal) => {
    if (!signal) return '⏸️';
    
    switch (signal.signal) {
      case 'STRONG_BUY':
        return '🚀';
      case 'BUY':
        return '📈';
      case 'STRONG_SELL':
        return '📉';
      case 'SELL':
        return '🔻';
      case 'NEUTRAL':
        return '➡️';
      default:
        return '⏸️';
    }
  };

  const formatPrice = (price) => {
    if (!price) return '-.----';
    return typeof price === 'number' ? price.toFixed(4) : parseFloat(price).toFixed(4);
  };

  const getBaseCurrencyFlag = () => {
    const currency = currencies.find(c => c.code === baseCurrency);
    return currency?.flag || '💰';
  };

  const getTargetCurrencyFlag = () => {
    const currency = currencies.find(c => c.code === targetCurrency);
    return currency?.flag || '💰';
  };

  return (
    <div className="live-price-panel">
      <div className="price-header">
        <h3>Live Market Data</h3>
        <div className="refresh-info">
          <button onClick={fetchPriceAndSignal} disabled={loading} className="refresh-btn">
            <svg className={`refresh-icon ${loading ? 'spinning' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            Refresh
          </button>
          {lastUpdate && (
            <span className="last-update">
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="currency-selectors">
        <div className="currency-selector">
          <label>Base Currency</label>
          <select 
            value={baseCurrency} 
            onChange={(e) => onCurrencyChange(e.target.value, targetCurrency)}
            className="currency-select"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        <div className="currency-swap">
          <button 
            onClick={() => onCurrencyChange(targetCurrency, baseCurrency)}
            className="swap-btn"
            title="Swap currencies"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 2l4 4-4 4M3 6h18M7 22l-4-4 4-4M21 18H3"/>
            </svg>
          </button>
        </div>

        <div className="currency-selector">
          <label>Target Currency</label>
          <select 
            value={targetCurrency} 
            onChange={(e) => onCurrencyChange(baseCurrency, e.target.value)}
            className="currency-select"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Fetching live data...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {priceData && !loading && (
        <div className="price-display">
          <div className="currency-pair">
            <span className="base-currency">
              <span className="currency-flag">{getBaseCurrencyFlag()}</span>
              {baseCurrency}
            </span>
            <span className="separator">/</span>
            <span className="target-currency">
              <span className="currency-flag">{getTargetCurrencyFlag()}</span>
              {targetCurrency}
            </span>
          </div>

          <div className="current-price">
            <span className="price-value">{formatPrice(priceData.rate)}</span>
            <span className="price-label">
              1 {baseCurrency} = {formatPrice(priceData.rate)} {targetCurrency}
            </span>
          </div>
        </div>
      )}

      {signalData?.signal && !loading && (
        <div className="signal-display">
          <div className="signal-header">
            <h4>Bollinger Bands Signal</h4>
          </div>
          
          <div className="signal-main">
            <div className="signal-indicator" style={{ backgroundColor: getSignalColor(signalData.signal) }}>
              <span className="signal-icon">{getSignalIcon(signalData.signal)}</span>
              <div className="signal-details">
                <span className="signal-type">{signalData.signal.signal.replace('_', ' ')}</span>
                <span className="signal-strength">Strength: {signalData.signal.strength}%</span>
              </div>
            </div>
          </div>

          <div className="signal-reason">
            <p>{signalData.signal.reason}</p>
          </div>

          {signalData.signal.bollingerBands && (
            <div className="bollinger-levels">
              <div className="bb-level">
                <span className="bb-label">Upper Band:</span>
                <span className="bb-value">{formatPrice(signalData.signal.bollingerBands.upper)}</span>
              </div>
              <div className="bb-level middle">
                <span className="bb-label">Middle Band:</span>
                <span className="bb-value">{formatPrice(signalData.signal.bollingerBands.middle)}</span>
              </div>
              <div className="bb-level">
                <span className="bb-label">Lower Band:</span>
                <span className="bb-value">{formatPrice(signalData.signal.bollingerBands.lower)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {signalData?.analysis && (
        <div className="market-analysis">
          <h4>Market Analysis</h4>
          <div className="analysis-summary">
            <div className="trend-indicator">
              <span className="trend-label">Trend:</span>
              <span className={`trend-value ${signalData.analysis.trend.toLowerCase()}`}>
                {signalData.analysis.trend}
              </span>
              <span className="confidence-badge">{signalData.analysis.confidence}%</span>
            </div>
            
            {signalData.analysis.insights && signalData.analysis.insights.length > 0 && (
              <div className="insights">
                {signalData.analysis.insights.map((insight, index) => (
                  <p key={index} className="insight-item">{insight}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePricePanel;
