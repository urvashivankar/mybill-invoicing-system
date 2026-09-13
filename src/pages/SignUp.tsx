import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAppContext } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { loginState } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    setPasswordStrength(password ? strength : 0);
  }, [password]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signup({ name, email, password });
      loginState(res.user, res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStrengthBars = () => {
    const bars = [];
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E']; // Red, Orange, Yellow, Green
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    
    for (let i = 0; i < 4; i++) {
      bars.push(
        <div 
          key={i} 
          style={{
            height: '6px',
            width: '100%',
            borderRadius: '9999px',
            backgroundColor: i < passwordStrength ? colors[Math.max(0, passwordStrength - 1)] : '#E2E8F0',
            transition: 'all 0.3s'
          }}
        ></div>
      );
    }
    
    return (
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>{bars}</div>
        {password && (
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            textAlign: 'right',
            color: passwordStrength < 2 ? '#EF4444' : passwordStrength < 3 ? '#CA8A04' : '#16A34A'
          }}>
            {labels[Math.max(0, passwordStrength - 1)]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <img src="/logo.svg" alt="MyBill Logo" className="auth-logo" />
          <div className="auth-brand">
            My<span className="auth-brand-highlight">Bill</span>
          </div>
          <div className="auth-subtitle">Smart Billing</div>
          
          <h2 className="auth-title" style={{ marginTop: '16px' }}>Create an account</h2>
          <p className="auth-description">Start managing your business billing today</p>
        </div>
        
        <div className="auth-card">
          <form onSubmit={handleSignUp} noValidate>
            
            {error && (
              <div className="auth-error">
                <AlertCircle size={20} className="auth-error-icon" />
                <div className="auth-error-text">{error}</div>
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="name" className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="auth-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="auth-input has-right-icon"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-input-right-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {renderStrengthBars()}
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon" style={{ color: confirmPassword && password === confirmPassword ? '#22C55E' : '#94A3B8' }}>
                  <CheckCircle2 size={18} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="auth-input has-right-icon"
                  style={{ 
                    borderColor: confirmPassword && password !== confirmPassword ? '#FCA5A5' : confirmPassword && password === confirmPassword ? '#86EFAC' : undefined
                  }}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-input-right-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn"
              style={{ marginTop: '24px' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"></circle>
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in instead</Link>
          </div>
        </div>
        
        <div className="auth-footer-bottom">
          &copy; {new Date().getFullYear()} MyBill Software. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default SignUp;
