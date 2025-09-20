import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Signup from './Signup';
import UserDashboard from './UserDashboard';
import InstitutionDashboard from './InstitutionDashboard';
import './App.css';
import './Dashboard.css';

// Main Dashboard Component (when user is logged in)
function Dashboard() {
  const [forexData, setForexData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [userTrades, setUserTrades] = useState([]);

  const { user, signOut, session } = useAuth();
  const userRole = user?.user_metadata?.role || 'user';

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
        strategy: userRole === 'institution' ? 'Auto-Strategy' : 'Manual',
        currency_pair: `${baseCurrency}/${targetCurrency}`,
        trade_type: 'Buy',
        price: forexData.rates[targetCurrency] || 1.0,
        quantity: userRole === 'institution' ? 10000 : 1000,
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

  const dashboardProps = {
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
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="brand-icon">FX</div>
            <div className="brand-info">
              <h1 className="brand-title">ForexTrader Pro</h1>
              <p className="brand-subtitle">Professional Trading Platform</p>
            </div>
          </div>
          <div className="navbar-actions">
            <div className="user-info">
              <span className="user-welcome">Welcome back,</span>
              <span className="user-name">{user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
              <span className="user-role">({userRole === 'institution' ? 'Institution' : 'Individual'})</span>
            </div>
            <button onClick={handleSignOut} className="signout-button">
              <span>Sign Out</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {userRole === 'institution' ? (
          <InstitutionDashboard {...dashboardProps} />
        ) : (
          <UserDashboard {...dashboardProps} />
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
