import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // 1. Register the user
      await authService.register({
        name,
        email,
        password,
        password_confirm: passwordConfirm
      });
      
      // 2. Log them in automatically
      await authService.login(email, password);
      
      // 3. Redirect to dashboard
      navigate('/');
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Sign Up" description="Create your MockForge account." />
      <div className="bg-glow right"></div>
      
      <section className="section flex-center" style={{ flex: 1 }}>
        <div className="container flex-center">
          <Card hover={false} style={{ width: '100%', maxWidth: '400px' }}>
            <div className="text-center" style={{ marginBottom: '2rem' }}>
              <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Create Account</h2>
              <p className="text-secondary">Start your FAANG prep today.</p>
            </div>
            
            {errors.non_field_errors && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {Array.isArray(errors.non_field_errors) ? errors.non_field_errors.join(' ') : errors.non_field_errors}
              </div>
            )}
            {errors.detail && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {errors.detail}
              </div>
            )}
            
            <form className="flex-col gap-md" onSubmit={handleSignup}>
              <div className="flex-col gap-sm">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                  placeholder="John Doe" 
                />
                {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{Array.isArray(errors.name) ? errors.name.join(' ') : errors.name}</span>}
              </div>

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
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                  placeholder="Min 8 characters" 
                />
                {errors.password && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{Array.isArray(errors.password) ? errors.password.join(' ') : errors.password}</span>}
              </div>

              <div className="flex-col gap-sm">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Confirm Password</label>
                <input 
                  type="password" 
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                  placeholder="Confirm your password" 
                />
                {errors.password_confirm && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{Array.isArray(errors.password_confirm) ? errors.password_confirm.join(' ') : errors.password_confirm}</span>}
              </div>
              
              <Button type="submit" variant="primary" fullWidth style={{ marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <p className="text-center text-secondary" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
              Already have an account? <Link to="/login" className="text-gradient">Log in</Link>
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}
