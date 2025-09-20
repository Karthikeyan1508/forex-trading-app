import React, { useState } from 'react';
import LivePricePanel from './components/LivePricePanel';
import CandlestickChart from './components/CandlestickChart';
import TradeBlotter from './components/TradeBlotter';
import StrategyMetrics from './components/StrategyMetrics';

const InstitutionDashboard = ({ 
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
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('bollinger_bands');
  const [tradeAmount, setTradeAmount] = useState(50000);
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [stopLoss, setStopLoss] = useState(2.0);
  const [takeProfit, setTakeProfit] = useState(5.0);

  const handleCurrencyChange = (newBase, newTarget) => {
    setBaseCurrency(newBase);
    setTargetCurrency(newTarget);
  };

  const getAuthHeaders = () => {
    return session?.access_token ? {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
  };

  const handleAutoTrade = async () => {
    try {
      const autoTradeData = {
        strategy_name: selectedStrategy,
        currency_pair: `${baseCurrency}/${targetCurrency}`,
        trade_type: 'Buy', // This would be determined by the strategy
        quantity: tradeAmount,
        strategy_params: {
          risk_level: riskLevel,
          stop_loss: stopLoss / 100,
          take_profit: takeProfit / 100,
          period: 20, // For Bollinger Bands
          std_dev: 2
        }
      };

      const response = await fetch('http://localhost:5002/api/auto-trade', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(autoTradeData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Auto trade executed successfully!');
        // Optionally trigger a refresh of trades
        if (typeof createSampleTrade === 'function') {
          createSampleTrade();
        }
      } else {
        alert(`Auto trade failed: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Auto trading error:', error);
      alert('Failed to execute auto trade');
    }
  };

  return (
    <div className="dashboard-container institution-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Institution Trading Dashboard</h2>
          <p className="dashboard-subtitle">
            Advanced trading analytics, automated strategies, and portfolio management
          </p>
        </div>
        <div className="account-info">
          <div className="account-limits">
            <span className="limit-label">Trade Limit:</span>
            <span className="limit-value">$1,000,000</span>
          </div>
          <div className="auto-status">
            <span className={`status-indicator ${autoTradingEnabled ? 'active' : 'inactive'}`}>
              {autoTradingEnabled ? 'Auto Trading ON' : 'Auto Trading OFF'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid institution-grid">
        {/* Live Price Panel */}
        <div className="grid-section full-width">
          <LivePricePanel 
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            onCurrencyChange={handleCurrencyChange}
            session={session}
            institutionMode={true}
          />
        </div>

        {/* Chart Section */}
        <div className="grid-section chart-section">
          <CandlestickChart 
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            session={session}
            institutionMode={true}
          />
        </div>

        {/* Strategy Metrics */}
        <div className="grid-section metrics-section">
          <StrategyMetrics 
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            session={session}
            institutionMode={true}
          />
        </div>

        {/* Auto Trading Panel - Institution Only */}
        <div className="grid-section auto-trading-section">
          <div className="auto-trading-panel">
            <div className="panel-header">
              <h3>Automated Trading System</h3>
              <div className="auto-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoTradingEnabled}
                    onChange={(e) => setAutoTradingEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="auto-trading-controls">
              <div className="strategy-config">
                <div className="config-row">
                  <label>
                    Trading Strategy:
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      disabled={!autoTradingEnabled}
                    >
                      <option value="bollinger_bands">Bollinger Bands</option>
                      <option value="momentum">Momentum Strategy</option>
                      <option value="mean_reversion">Mean Reversion</option>
                      <option value="rsi_divergence">RSI Divergence</option>
                      <option value="moving_average">Moving Average Crossover</option>
                    </select>
                  </label>

                  <label>
                    Trade Amount:
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(Number(e.target.value))}
                      disabled={!autoTradingEnabled}
                      min="10000"
                      max="1000000"
                      step="10000"
                    />
                  </label>
                </div>

                <div className="config-row">
                  <label>
                    Risk Level:
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      disabled={!autoTradingEnabled}
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </label>

                  <label>
                    Stop Loss (%):
                    <input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(Number(e.target.value))}
                      disabled={!autoTradingEnabled}
                      min="0.5"
                      max="10"
                      step="0.5"
                    />
                  </label>

                  <label>
                    Take Profit (%):
                    <input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(Number(e.target.value))}
                      disabled={!autoTradingEnabled}
                      min="1"
                      max="20"
                      step="0.5"
                    />
                  </label>
                </div>

                <div className="auto-actions">
                  <button 
                    onClick={handleAutoTrade} 
                    disabled={!autoTradingEnabled || loading || !baseCurrency || !targetCurrency}
                    className="auto-trade-button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Execute Auto Trade
                  </button>

                  <div className="strategy-info">
                    <div className="info-item">
                      <span className="info-label">Pair:</span>
                      <span className="info-value">{baseCurrency}/{targetCurrency}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Amount:</span>
                      <span className="info-value">${tradeAmount.toLocaleString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Strategy:</span>
                      <span className="info-value">{selectedStrategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="grid-section analytics-section">
          <div className="advanced-analytics">
            <h3>Advanced Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Portfolio Overview</h4>
                <div className="portfolio-stats">
                  <div className="stat">
                    <span className="stat-label">Total Positions</span>
                    <span className="stat-value">{userTrades.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Active Strategies</span>
                    <span className="stat-value">{autoTradingEnabled ? '1' : '0'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Daily P&L</span>
                    <span className="stat-value positive">+$2,450</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>Risk Metrics</h4>
                <div className="risk-metrics">
                  <div className="risk-item">
                    <span>Value at Risk (VaR):</span>
                    <span className="risk-value moderate">$15,000</span>
                  </div>
                  <div className="risk-item">
                    <span>Max Drawdown:</span>
                    <span className="risk-value low">2.3%</span>
                  </div>
                  <div className="risk-item">
                    <span>Sharpe Ratio:</span>
                    <span className="risk-value high">1.8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="grid-section full-width">
          <TradeBlotter 
            userTrades={userTrades}
            session={session}
            userRole="institution"
            showAdvanced={true}
          />
        </div>
      </div>
    </div>
  );

};

export default InstitutionDashboard;
