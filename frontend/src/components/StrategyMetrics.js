import React, { useState, useEffect } from 'react';
import './StrategyMetrics.css';

const StrategyMetrics = ({ baseCurrency, targetCurrency, session }) => {
  const [backtestData, setBacktestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parameters, setParameters] = useState({
    days: 90,
    balance: 10000
  });

  const fetchBacktestData = async () => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5002/api/backtest/${baseCurrency}/${targetCurrency}?days=${parameters.days}&balance=${parameters.balance}`
      );
      const result = await response.json();

      if (result.success) {
        setBacktestData(result.data);
      } else {
        setError(result.error || 'Failed to fetch backtest data');
      }
    } catch (err) {
      console.error('Backtest fetch error:', err);
      setError('Failed to load backtest data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacktestData();
  }, [baseCurrency, targetCurrency, parameters]);

  const runBacktest = () => {
    fetchBacktestData();
  };

  const getPerformanceColor = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskLevel = (maxDrawdown) => {
    if (maxDrawdown < 5) return { level: 'Low', color: 'low-risk' };
    if (maxDrawdown < 15) return { level: 'Medium', color: 'medium-risk' };
    return { level: 'High', color: 'high-risk' };
  };

  const getWinRateGrade = (winRate) => {
    if (winRate >= 70) return { grade: 'A+', color: 'grade-a' };
    if (winRate >= 60) return { grade: 'A', color: 'grade-a' };
    if (winRate >= 50) return { grade: 'B', color: 'grade-b' };
    if (winRate >= 40) return { grade: 'C', color: 'grade-c' };
    return { grade: 'D', color: 'grade-d' };
  };

  const calculateSharpeRatio = (totalReturn, maxDrawdown) => {
    // Simplified Sharpe ratio calculation (return / volatility proxy)
    const volatility = Math.max(maxDrawdown, 1);
    return totalReturn / volatility;
  };

  return (
    <div className="strategy-metrics">
      <div className="metrics-header">
        <h3>Bollinger Bands Strategy Performance</h3>
        <div className="backtest-controls">
          <div className="parameter-group">
            <label>Period (days):</label>
            <select 
              value={parameters.days} 
              onChange={(e) => setParameters(prev => ({ ...prev, days: parseInt(e.target.value) }))}
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
              <option value={180}>180 Days</option>
              <option value={365}>1 Year</option>
            </select>
          </div>
          
          <div className="parameter-group">
            <label>Initial Balance:</label>
            <select 
              value={parameters.balance} 
              onChange={(e) => setParameters(prev => ({ ...prev, balance: parseInt(e.target.value) }))}
            >
              <option value={10000}>$10,000</option>
              <option value={50000}>$50,000</option>
              <option value={100000}>$100,000</option>
              <option value={500000}>$500,000</option>
              <option value={1000000}>$1,000,000</option>
            </select>
          </div>
          
          <button onClick={runBacktest} disabled={loading} className="run-backtest-btn">
            <svg className={`backtest-icon ${loading ? 'spinning' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="metrics-loading">
          <div className="loading-spinner"></div>
          <span>Running backtest analysis...</span>
        </div>
      )}

      {error && (
        <div className="metrics-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {backtestData && !loading && (
        <>
          <div className="performance-overview">
            <div className="overview-card main-performance">
              <div className="card-header">
                <h4>Overall Performance</h4>
                <span className="period-badge">{backtestData.backtestPeriod}</span>
              </div>
              <div className="performance-main">
                <div className="initial-final">
                  <div className="balance-item">
                    <span className="balance-label">Initial</span>
                    <span className="balance-value">{formatCurrency(backtestData.initialBalance)}</span>
                  </div>
                  <div className="arrow-icon">→</div>
                  <div className="balance-item">
                    <span className="balance-label">Final</span>
                    <span className={`balance-value ${getPerformanceColor(backtestData.finalBalance - backtestData.initialBalance)}`}>
                      {formatCurrency(backtestData.finalBalance)}
                    </span>
                  </div>
                </div>
                <div className="return-display">
                  <span className={`return-value ${getPerformanceColor(backtestData.totalReturn)}`}>
                    {formatPercentage(backtestData.totalReturn)}
                  </span>
                  <span className="return-label">Total Return</span>
                </div>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🎯</div>
                <div className="metric-content">
                  <span className="metric-value">{backtestData.totalTrades}</span>
                  <span className="metric-label">Total Trades</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🏆</div>
                <div className="metric-content">
                  <span className="metric-value win-rate">{backtestData.winRate}%</span>
                  <span className="metric-label">Win Rate</span>
                  <div className={`grade-badge ${getWinRateGrade(backtestData.winRate).color}`}>
                    {getWinRateGrade(backtestData.winRate).grade}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📉</div>
                <div className="metric-content">
                  <span className="metric-value">{backtestData.maxDrawdown.toFixed(2)}%</span>
                  <span className="metric-label">Max Drawdown</span>
                  <div className={`risk-badge ${getRiskLevel(backtestData.maxDrawdown).color}`}>
                    {getRiskLevel(backtestData.maxDrawdown).level} Risk
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <span className="metric-value">{calculateSharpeRatio(backtestData.totalReturn, backtestData.maxDrawdown).toFixed(2)}</span>
                  <span className="metric-label">Sharpe Ratio</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detailed-analysis">
            <div className="analysis-section">
              <h4>Trade Analysis</h4>
              <div className="trade-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Winning Trades</span>
                  <span className="breakdown-value positive">{backtestData.winningTrades}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Losing Trades</span>
                  <span className="breakdown-value negative">{backtestData.totalTrades - backtestData.winningTrades}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Average per Trade</span>
                  <span className="breakdown-value">
                    {formatCurrency((backtestData.finalBalance - backtestData.initialBalance) / Math.max(backtestData.totalTrades, 1))}
                  </span>
                </div>
              </div>
            </div>

            {backtestData.analysis && (
              <div className="analysis-section">
                <h4>Market Analysis</h4>
                <div className="market-insights">
                  <div className="insight-item">
                    <span className="insight-label">Market Trend</span>
                    <span className={`insight-value trend-${backtestData.analysis.trend?.toLowerCase()}`}>
                      {backtestData.analysis.trend}
                    </span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Trend Confidence</span>
                    <span className="insight-value">{backtestData.analysis.confidence}%</span>
                  </div>
                  {backtestData.analysis.averageSignalStrength && (
                    <div className="insight-item">
                      <span className="insight-label">Avg Signal Strength</span>
                      <span className="insight-value">{backtestData.analysis.averageSignalStrength}%</span>
                    </div>
                  )}
                </div>
                
                {backtestData.analysis.insights && backtestData.analysis.insights.length > 0 && (
                  <div className="strategy-insights">
                    <h5>Key Insights</h5>
                    <ul className="insights-list">
                      {backtestData.analysis.insights.map((insight, index) => (
                        <li key={index} className="insight-point">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {backtestData.trades && backtestData.trades.length > 0 && (
            <div className="recent-trades">
              <h4>Recent Backtest Trades</h4>
              <div className="trades-preview">
                {backtestData.trades.slice(0, 5).map((trade, index) => (
                  <div key={index} className="trade-preview-item">
                    <div className="trade-info">
                      <span className={`trade-type ${trade.type.toLowerCase()}`}>
                        {trade.type}
                      </span>
                      <span className="trade-price">{trade.price.toFixed(4)}</span>
                      <span className="trade-date">{new Date(trade.date).toLocaleDateString()}</span>
                    </div>
                    <div className={`trade-amount ${getPerformanceColor(trade.amount - (trade.quantity * trade.price))}`}>
                      {formatCurrency(trade.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="performance-summary">
            <div className="summary-card">
              <h5>Strategy Effectiveness</h5>
              <div className="effectiveness-meter">
                <div 
                  className="effectiveness-fill" 
                  style={{ width: `${Math.max(0, Math.min(100, backtestData.winRate))}%` }}
                ></div>
                <span className="effectiveness-label">
                  {backtestData.winRate >= 60 ? 'Highly Effective' : 
                   backtestData.winRate >= 40 ? 'Moderately Effective' : 'Needs Improvement'}
                </span>
              </div>
            </div>
            
            <div className="summary-recommendation">
              <h5>Recommendation</h5>
              <p className="recommendation-text">
                {backtestData.totalReturn > 10 && backtestData.winRate > 60 
                  ? "Strong performance. This strategy shows excellent potential for live trading."
                  : backtestData.totalReturn > 0 && backtestData.winRate > 45
                  ? "Moderate performance. Consider fine-tuning parameters for better results."
                  : "Poor performance. Review strategy parameters or consider alternative approaches."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StrategyMetrics;
