import React from 'react';
import LivePricePanel from './components/LivePricePanel';
import CandlestickChart from './components/CandlestickChart';
import TradeBlotter from './components/TradeBlotter';
import StrategyMetrics from './components/StrategyMetrics';

const UserDashboard = ({ 
  forexData, 
  loading, 
  error, 
  baseCurrency, 
  setBaseCurrency, 
  targetCurrency, 
  setTargetCurrency, 
  fetchForexData, 
  fetchCurrencyPair, 
  userTrades, 
  createSampleTrade, 
  user, 
  session 
}) => {
  const handleCurrencyChange = (newBase, newTarget) => {
    setBaseCurrency(newBase);
    setTargetCurrency(newTarget);
  };
  return (
    <div className="dashboard-container user-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Individual Trading Dashboard</h2>
          <p className="dashboard-subtitle">
            Monitor markets, analyze trends, and track your trading performance
          </p>
        </div>
        <div className="account-info">
          <div className="account-limits">
            <span className="limit-label">Trade Limit:</span>
            <span className="limit-value">$50,000</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Live Price Panel */}
        <div className="grid-section full-width">
          <LivePricePanel 
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            onCurrencyChange={handleCurrencyChange}
            session={session}
          />
        </div>

        {/* Chart Section */}
        <div className="grid-section chart-section">
          <CandlestickChart 
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            session={session}
          />
        </div>

        {/* Strategy Metrics */}
        <div className="grid-section metrics-section">
          <StrategyMetrics 
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            session={session}
          />
        </div>

        {/* Trade Controls */}
        <div className="grid-section controls-section">
          <div className="trading-controls">
            <h3>Quick Trade</h3>
            <div className="trade-actions">
              <button 
                onClick={createSampleTrade} 
                className="trade-btn buy-btn"
                disabled={!baseCurrency || !targetCurrency || baseCurrency === targetCurrency}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
                Execute Trade
              </button>
              <div className="trade-info">
                <span>Current Pair: <strong>{baseCurrency}/{targetCurrency}</strong></span>
                <span>Max Position: <strong>$50,000</strong></span>
              </div>
            </div>
          </div>

          <div className="account-summary">
            <h4>Account Summary</h4>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Trades</span>
                <span className="stat-value">{userTrades.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Account Type</span>
                <span className="stat-value">Individual</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className="stat-value status-active">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="grid-section full-width">
          <TradeBlotter 
            userTrades={userTrades}
            session={session}
            userRole="user"
          />
        </div>
      </div>

      {/* Legacy Data Display (conditionally shown) */}
      {forexData && (
        <div className="legacy-data-section">
          <h3>Raw Data View</h3>
          {loading && <div className="loading">Loading forex data...</div>}
          {error && <div className="error">{error}</div>}
          
          {forexData.rates ? (
            <div className="rates-grid">
              <p>All Exchange Rates (1 {forexData.base} =)</p>
              <div className="rates-list">
                {Object.entries(forexData.rates)
                  .slice(0, 10)
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
              <p>1 {forexData.base_code} = {forexData.conversion_rate} {forexData.target_code}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
