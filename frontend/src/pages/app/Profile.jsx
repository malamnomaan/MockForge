import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    authService.getProfile().then(data => {
      setProfile(data);
    }).catch(console.error);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const updated = await authService.updateProfile({ name: profile.name });
      setProfile(updated);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Profile settings" />
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-2" style={{ marginBottom: '0.25rem' }}>Profile Settings</h1>
        <p className="text-secondary">Manage your account preferences.</p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <Card hover={false} style={{ padding: '2rem' }}>
          {message && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {message}
            </div>
          )}
          
          <form className="flex-col gap-md" onSubmit={handleUpdate}>
            <div className="flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
              <input 
                type="email" 
                value={profile.email}
                disabled
                className="glass" 
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', outline: 'none', background: 'rgba(0,0,0,0.2)' }} 
              />
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Email cannot be changed.</span>
            </div>

            <div className="flex-col gap-sm">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="glass" 
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
