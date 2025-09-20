import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Auth.css';

const Signup = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('investment_firm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (role === 'institution' && !institutionName.trim()) {
      setError('Institution name is required');
      setLoading(false);
      return;
    }

    // Prepare user metadata with role information
    const userMetadata = {
      name,
      role,
      ...(role === 'institution' && {
        institution_name: institutionName,
        institution_type: institutionType
      })
    };

    const { error } = await signUp(email, password, userMetadata);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created! Please check your email to confirm your account.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up</h2>
        <p className="auth-subtitle">Create your forex trading account</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-select"
            >
              <option value="user">Individual Trader</option>
              <option value="institution">Institution</option>
            </select>
            <small className="form-help">
              {role === 'user' 
                ? 'Individual traders get access to signals and manual trading'
                : 'Institutions get auto-trading features and higher trade limits'
              }
            </small>
          </div>

          {role === 'institution' && (
            <>
              <div className="form-group">
                <label>Institution Name</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  required
                  placeholder="Enter institution name"
                />
              </div>

              <div className="form-group">
                <label>Institution Type</label>
                <select
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  className="auth-select"
                >
                  <option value="investment_firm">Investment Firm</option>
                  <option value="bank">Bank</option>
                  <option value="hedge_fund">Hedge Fund</option>
                  <option value="trading_company">Trading Company</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle">
          Already have an account?{' '}
          <button type="button" onClick={onToggleMode} className="toggle-link">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
