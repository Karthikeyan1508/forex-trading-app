import React, { useState, useEffect } from 'react';
import './TradeBlotter.css';

const TradeBlotter = ({ userTrades, session, onTradeExecuted, userRole = 'user' }) => {
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [filters, setFilters] = useState({
    currencyPair: '',
    tradeType: '',
    strategy: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'trade_date',
    direction: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sample trades for demo if no real trades exist
  const sampleTrades = [
    {
      id: 'demo-1',
      currency_pair: 'EUR/USD',
      trade_type: 'BUY',
      price: 1.0842,
      quantity: 10000,
      strategy: 'Bollinger Bands',
      trade_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      status: 'completed',
      pnl: 125.50
    },
    {
      id: 'demo-2',
      currency_pair: 'GBP/USD',
      trade_type: 'SELL',
      price: 1.2654,
      quantity: 7500,
      strategy: 'Manual',
      trade_date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      status: 'completed',
      pnl: -45.20
    },
    {
      id: 'demo-3',
      currency_pair: 'USD/JPY',
      trade_type: 'BUY',
      price: 149.85,
      quantity: 5000,
      strategy: 'Bollinger Bands',
      trade_date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      status: 'completed',
      pnl: 287.30
    },
    {
      id: 'demo-4',
      currency_pair: 'EUR/GBP',
      trade_type: 'SELL',
      price: 0.8567,
      quantity: 15000,
      strategy: userRole === 'institution' ? 'Auto-Strategy' : 'Manual',
      trade_date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      status: 'completed',
      pnl: 78.90
    },
    {
      id: 'demo-5',
      currency_pair: 'AUD/USD',
      trade_type: 'BUY',
      price: 0.6543,
      quantity: 12000,
      strategy: 'Bollinger Bands',
      trade_date: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      status: 'completed',
      pnl: -156.75
    }
  ];

  const allTrades = userTrades.length > 0 ? userTrades : sampleTrades;

  useEffect(() => {
    applyFiltersAndSort();
  }, [allTrades, filters, sortConfig]);

  const applyFiltersAndSort = () => {
    let filtered = [...allTrades];

    // Apply filters
    if (filters.currencyPair) {
      filtered = filtered.filter(trade => 
        trade.currency_pair.toLowerCase().includes(filters.currencyPair.toLowerCase())
      );
    }

    if (filters.tradeType) {
      filtered = filtered.filter(trade => 
        trade.trade_type.toLowerCase() === filters.tradeType.toLowerCase()
      );
    }

    if (filters.strategy) {
      filtered = filtered.filter(trade => 
        trade.strategy.toLowerCase().includes(filters.strategy.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(trade => 
        new Date(trade.trade_date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(trade => 
        new Date(trade.trade_date) <= new Date(filters.dateTo)
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(trade => 
        (trade.price * trade.quantity) >= parseFloat(filters.minAmount)
      );
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(trade => 
        (trade.price * trade.quantity) <= parseFloat(filters.maxAmount)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle different data types
        if (sortConfig.key === 'trade_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTrades(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      currencyPair: '',
      tradeType: '',
      strategy: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="sort-icon">↕️</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="sort-icon active">↑</span> : 
      <span className="sort-icon active">↓</span>;
  };

  const getTradePnLClass = (pnl) => {
    if (!pnl) return '';
    return pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
  };

  const calculateTotalStats = () => {
    if (filteredTrades.length === 0) return null;

    const totalTrades = filteredTrades.length;
    const totalVolume = filteredTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
    const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = filteredTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return { totalTrades, totalVolume, totalPnL, winRate };
  };

  const stats = calculateTotalStats();

  return (
    <div className="trade-blotter">
      <div className="blotter-header">
        <div className="header-title">
          <h3>Trade History</h3>
          <span className="trade-count">{filteredTrades.length} trades</span>
        </div>
        
        <div className="header-actions">
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            Filters
            {Object.values(filters).some(v => v) && <span className="filter-active-dot"></span>}
          </button>
          
          {Object.values(filters).some(v => v) && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="trade-stats">
          <div className="stat-item">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{stats.totalTrades}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Volume</span>
            <span className="stat-value">{formatCurrency(stats.totalVolume)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total P&L</span>
            <span className={`stat-value ${getTradePnLClass(stats.totalPnL)}`}>
              {formatCurrency(stats.totalPnL)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{stats.winRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Currency Pair</label>
              <input
                type="text"
                placeholder="e.g., EUR/USD"
                value={filters.currencyPair}
                onChange={(e) => handleFilterChange('currencyPair', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Trade Type</label>
              <select
                value={filters.tradeType}
                onChange={(e) => handleFilterChange('tradeType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Strategy</label>
              <input
                type="text"
                placeholder="e.g., Bollinger Bands"
                value={filters.strategy}
                onChange={(e) => handleFilterChange('strategy', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Min Amount ($)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        {filteredTrades.length === 0 ? (
          <div className="no-trades">
            <div className="no-trades-icon">📊</div>
            <h4>No Trades Found</h4>
            <p>
              {allTrades.length === 0 
                ? 'Execute your first trade to see it appear here.' 
                : 'Try adjusting your filters to see more trades.'}
            </p>
          </div>
        ) : (
          <table className="trades-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('trade_date')} className="sortable">
                  Date {getSortIcon('trade_date')}
                </th>
                <th onClick={() => handleSort('currency_pair')} className="sortable">
                  Pair {getSortIcon('currency_pair')}
                </th>
                <th onClick={() => handleSort('trade_type')} className="sortable">
                  Type {getSortIcon('trade_type')}
                </th>
                <th onClick={() => handleSort('price')} className="sortable">
                  Price {getSortIcon('price')}
                </th>
                <th onClick={() => handleSort('quantity')} className="sortable">
                  Quantity {getSortIcon('quantity')}
                </th>
                <th onClick={() => handleSort('strategy')} className="sortable">
                  Strategy {getSortIcon('strategy')}
                </th>
                <th className="amount-column">Amount</th>
                {userRole === 'institution' && (
                  <th onClick={() => handleSort('pnl')} className="sortable">
                    P&L {getSortIcon('pnl')}
                  </th>
                )}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="trade-row">
                  <td className="date-cell">
                    {formatDate(trade.trade_date)}
                  </td>
                  <td className="pair-cell">
                    <span className="currency-pair">{trade.currency_pair}</span>
                  </td>
                  <td className="type-cell">
                    <span className={`trade-type ${trade.trade_type.toLowerCase()}`}>
                      {trade.trade_type}
                    </span>
                  </td>
                  <td className="price-cell">
                    {typeof trade.price === 'number' ? trade.price.toFixed(4) : trade.price}
                  </td>
                  <td className="quantity-cell">
                    {trade.quantity.toLocaleString()}
                  </td>
                  <td className="strategy-cell">
                    <span className="strategy-tag">{trade.strategy}</span>
                  </td>
                  <td className="amount-cell">
                    {formatCurrency(trade.price * trade.quantity)}
                  </td>
                  {userRole === 'institution' && (
                    <td className={`pnl-cell ${getTradePnLClass(trade.pnl)}`}>
                      {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                    </td>
                  )}
                  <td className="status-cell">
                    <span className={`status-badge ${trade.status || 'completed'}`}>
                      {(trade.status || 'completed').charAt(0).toUpperCase() + (trade.status || 'completed').slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TradeBlotter;
