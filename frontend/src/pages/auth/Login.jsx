import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await authService.login(email, password);
      // Redirect to dashboard on success
      navigate('/'); // Change this to '/dashboard' once it exists
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      } else {
        setErrors({ detail: 'Invalid credentials or something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Log In" description="Log in to your MockForge account." />
      <div className="bg-glow"></div>
      
      <section className="section flex-center" style={{ flex: 1 }}>
        <div className="container flex-center">
          <Card hover={false} style={{ width: '100%', maxWidth: '400px' }}>
            <div className="text-center" style={{ marginBottom: '2rem' }}>
              <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Welcome Back</h2>
              <p className="text-secondary">Log in to continue your prep.</p>
            </div>
            
            {errors.detail && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {errors.detail}
              </div>
            )}
            {errors.non_field_errors && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {Array.isArray(errors.non_field_errors) ? errors.non_field_errors.join(' ') : errors.non_field_errors}
              </div>
            )}
            
            <form className="flex-col gap-md" onSubmit={handleLogin}>
              <div className="flex-col gap-sm">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                  placeholder="you@example.com" 
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{Array.isArray(errors.email) ? errors.email.join(' ') : errors.email}</span>}
              </div>
              
              <div className="flex-col gap-sm">
                <div className="flex-between">
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                  <a href="#" className="text-gradient" style={{ fontSize: '0.875rem' }}>Forgot?</a>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                  placeholder="••••••••" 
                />
                {errors.password && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{Array.isArray(errors.password) ? errors.password.join(' ') : errors.password}</span>}
              </div>
              
              <Button type="submit" variant="primary" fullWidth style={{ marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
            
            <p className="text-center text-secondary" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
              Don't have an account? <Link to="/signup" className="text-gradient">Sign up</Link>
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}
