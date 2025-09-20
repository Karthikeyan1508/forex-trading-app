import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './CandlestickChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const CandlestickChart = ({ baseCurrency, targetCurrency, session, institutionMode = false }) => {
  const [chartData, setChartData] = useState(null);
  const [bollingerData, setBollingerData] = useState(null);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');

  const fetchChartData = async () => {
    if (!baseCurrency || !targetCurrency) return;

    setLoading(true);
    try {
      // Fetch Bollinger Bands data
      const response = await fetch(`http://localhost:5002/api/bollinger-bands/${baseCurrency}/${targetCurrency}`, {
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        } : { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setBollingerData(data);
        
        // Convert to chart format
        const labels = data.historical_data.map((_, index) => `Day ${index + 1}`);
        const prices = data.historical_data.map(item => item.close);
        const upperBand = data.bollinger_bands.map(item => item.upper);
        const middleBand = data.bollinger_bands.map(item => item.middle);
        const lowerBand = data.bollinger_bands.map(item => item.lower);

        setChartData({
          labels,
          datasets: [
            {
              label: `${baseCurrency}/${targetCurrency} Price`,
              data: prices,
              borderColor: '#1f2937',
              backgroundColor: '#1f2937',
              borderWidth: 2,
              fill: false,
              tension: 0.1,
            },
            {
              label: 'Upper Band',
              data: upperBand,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 1,
              fill: false,
              borderDash: [5, 5],
            },
            {
              label: 'Middle Band (SMA)',
              data: middleBand,
              borderColor: '#3b82f6',
              backgroundColor: '#3b82f6',
              borderWidth: 1,
              fill: false,
            },
            {
              label: 'Lower Band',
              data: lowerBand,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 1,
              fill: false,
              borderDash: [5, 5],
            }
          ]
        });

        // Extract signals
        if (data.signals && data.signals.length > 0) {
          setSignals(data.signals);
        }
      } else {
        setError('Failed to fetch chart data');
      }
    } catch (err) {
      console.error('Chart data fetch error:', err);
      setError('Error loading chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCurrency, targetCurrency]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: `${baseCurrency}/${targetCurrency} - Bollinger Bands Strategy`,
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            if (label) {
              return label + ': ' + context.parsed.y.toFixed(4);
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      },
      line: {
        tension: 0.1
      }
    }
  };

  return (
    <div className="candlestick-chart">
      <div className="chart-header">
        <div className="chart-title">
          <h3>Price Chart with Bollinger Bands</h3>
          <div className="chart-subtitle">
            {baseCurrency}/{targetCurrency} • {timeframe} Timeframe
          </div>
        </div>
        <div className="chart-controls">
          <div className="timeframe-selector">
            <button 
              className={timeframe === '1H' ? 'active' : ''} 
              onClick={() => setTimeframe('1H')}
            >
              1H
            </button>
            <button 
              className={timeframe === '4H' ? 'active' : ''} 
              onClick={() => setTimeframe('4H')}
            >
              4H
            </button>
            <button 
              className={timeframe === '1D' ? 'active' : ''} 
              onClick={() => setTimeframe('1D')}
            >
              1D
            </button>
            <button 
              className={timeframe === '1W' ? 'active' : ''} 
              onClick={() => setTimeframe('1W')}
            >
              1W
            </button>
          </div>
          <button className="refresh-btn" onClick={fetchChartData}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12A9 9 0 1 0 12 3"/>
              <path d="M3 12L8 7M3 12L8 17"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chart-container">
        {loading && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <span>Loading chart data...</span>
          </div>
        )}

        {error && (
          <div className="chart-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
            <button onClick={fetchChartData}>Retry</button>
          </div>
        )}

        {chartData && !loading && !error && (
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {signals.length > 0 && (
        <div className="signal-summary">
          <h4>Trading Signals</h4>
          <div className="signals-list">
            {signals.slice(0, 3).map((signal, index) => (
              <div key={index} className={`signal-item ${signal.signal.toLowerCase()}`}>
                <div className="signal-type">
                  <span className={`signal-badge ${signal.signal.toLowerCase()}`}>
                    {signal.signal}
                  </span>
                  <span className="signal-strength">{signal.strength}</span>
                </div>
                <div className="signal-details">
                  <span>Price: {signal.price}</span>
                  <span>Confidence: {Math.round(signal.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bollingerData && (
        <div className="bollinger-info">
          <h4>Bollinger Bands Analysis</h4>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="analysis-label">Current Position:</span>
              <span className="analysis-value">
                {bollingerData.analysis?.position || 'N/A'}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Volatility:</span>
              <span className="analysis-value">
                {bollingerData.analysis?.volatility || 'N/A'}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Trend:</span>
              <span className="analysis-value">
                {bollingerData.analysis?.trend || 'N/A'}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Recommendation:</span>
              <span className={`analysis-value recommendation ${bollingerData.analysis?.recommendation?.toLowerCase()}`}>
                {bollingerData.analysis?.recommendation || 'Hold'}
              </span>
            </div>
          </div>
        </div>
      )}

      {institutionMode && (
        <div className="advanced-metrics">
          <h4>Advanced Metrics</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Volatility Index</span>
              <span className="metric-value">0.65</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">RSI</span>
              <span className="metric-value">58.3</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">MACD</span>
              <span className="metric-value positive">+0.012</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Volume</span>
              <span className="metric-value">1.2M</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
