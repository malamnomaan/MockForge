import React, { useState, useEffect, useRef } from 'react';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { Flame, Code, Terminal, TerminalSquare, Cpu, Mic, MessageSquare, Award, Trophy } from 'lucide-react';

const ICON_MAP = {
  'Flame': Flame,
  'Code': Code,
  'Terminal': Terminal,
  'TerminalSquare': TerminalSquare,
  'Cpu': Cpu,
  'Mic': Mic,
  'MessageSquare': MessageSquare,
  'Award': Award,
  'Trophy': Trophy
};

export default function Profile() {
  const [profile, setProfile] = useState({ 
    name: '', email: '', bio: '', target_role: '', experience_level: '', github_url: '', linkedin_url: '' 
  });
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAllBadges, setShowAllBadges] = useState(false);
  
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const leftCardRef = useRef(null);
  const [leftHeight, setLeftHeight] = useState('auto');

  useEffect(() => {
    Promise.all([
      authService.getProfile(),
      authService.getAchievements()
    ]).then(([profData, achData]) => {
      setProfile(profData);
      setAchievements(achData);
      
      // Update height after render
      setTimeout(() => {
        if (leftCardRef.current) {
          setLeftHeight(leftCardRef.current.offsetHeight + 'px');
        }
      }, 100);
    }).catch(console.error);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const updated = await authService.updateProfile({ 
        name: profile.name,
        bio: profile.bio,
        target_role: profile.target_role,
        experience_level: profile.experience_level,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url
      });
      setProfile(updated);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
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
      
      {/* Custom Tooltip */}
      {hoveredBadge && (
        <div style={{
          position: 'fixed',
          top: mousePos.y + 15,
          left: mousePos.x + 15,
          zIndex: 9999,
          background: 'rgba(20, 20, 25, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hoveredBadge.color}40`,
          borderRadius: '8px',
          padding: '1rem',
          maxWidth: '250px',
          pointerEvents: 'none',
          boxShadow: `0 10px 25px rgba(0,0,0,0.5), 0 0 15px ${hoveredBadge.color}20`
        }}>
          <h4 style={{ color: hoveredBadge.color, fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{hoveredBadge.name}</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4', marginBottom: hoveredBadge.earned ? '0.5rem' : '0' }}>
            {hoveredBadge.description}
          </p>
          {hoveredBadge.earned && hoveredBadge.unlocked_date && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 500 }}>
                Unlocked on {new Date(hoveredBadge.unlocked_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Toast */}
      {message && message === 'Profile updated successfully!' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: 'var(--text-primary)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ background: 'var(--accent-primary)', borderRadius: '50%', padding: '0.25rem', display: 'flex', background: '#10b981' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span style={{ fontWeight: 500 }}>{message}</span>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-2" style={{ marginBottom: '0.25rem' }}>Profile Settings</h1>
        <p className="text-secondary">Manage your account preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Profile Settings */}
        <div ref={leftCardRef}>
          <Card hover={false} style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            {message && message !== 'Profile updated successfully!' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
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
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                />
              </div>

              <div className="flex-col gap-sm">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Target Role</label>
                <input 
                  type="text" 
                  value={profile.target_role || ''}
                  onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                  placeholder="e.g. Frontend Engineer"
                />
              </div>

              <div className="flex-col gap-sm">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Experience Level</label>
                <select 
                  value={profile.experience_level || ''}
                  onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                  className="glass"
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Select level...</option>
                  <option value="Student">Student / Intern</option>
                  <option value="Junior">Junior (0-2 years)</option>
                  <option value="Mid">Mid-Level (2-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                </select>
              </div>

              <div className="flex-col gap-sm">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Bio</label>
                <textarea 
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="glass" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', resize: 'vertical', minHeight: '80px' }} 
                  placeholder="Tell us a little about yourself"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="flex-col gap-sm">
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>GitHub Profile</label>
                  <input 
                    type="url" 
                    value={profile.github_url || ''}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    className="glass" 
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                    placeholder="https://github.com/..."
                  />
                </div>
                
                <div className="flex-col gap-sm">
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>LinkedIn Profile</label>
                  <input 
                    type="url" 
                    value={profile.linkedin_url || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    className="glass" 
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }} 
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Achievements & Badges */}
        <div style={{ minWidth: 0, minHeight: 0 }}>
          <Card hover={false} style={{ padding: '2rem', height: leftHeight, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 className="heading-3" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>Achievements & Badges</h2>
            
            {achievements ? (
              <>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {!showAllBadges && achievements.badges.filter(b => b.earned).length === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--glass-border)', margin: 'auto' }}>
                      <Award size={48} color="var(--text-secondary)" style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                      <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>No badges earned yet</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Keep practicing to unlock your first achievement!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                      {(showAllBadges ? achievements.badges : achievements.badges.filter(b => b.earned).slice(0, 6)).map(badge => {
                        const IconComp = ICON_MAP[badge.icon] || Award;
                        const isEarned = badge.earned;
                        const metricStr = badge.category === 'streak' ? 'days' : badge.category === 'learning' ? 'problems' : 'interviews';
                        const leftText = badge.left > 0 ? `${badge.left} ${metricStr} left` : 'Unlocked';
                        
                        return (
                          <div 
                            key={badge.id}
                            onMouseEnter={(e) => { setHoveredBadge(badge); setMousePos({ x: e.clientX, y: e.clientY }); }}
                            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoveredBadge(null)}
                            style={{
                              padding: '1.5rem 1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              borderRadius: 'var(--radius-md)',
                              background: isEarned ? `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))` : 'rgba(0,0,0,0.2)',
                              border: isEarned ? `1px solid ${badge.color}40` : '1px solid var(--glass-border)',
                              boxShadow: isEarned ? `0 0 20px ${badge.color}20` : 'none',
                              position: 'relative',
                              overflow: 'hidden',
                              filter: isEarned ? 'none' : 'grayscale(100%) opacity(0.5)',
                              transition: 'all 0.3s ease',
                              cursor: isEarned ? 'pointer' : 'default'
                            }}
                          >
                            {/* Glow effect */}
                            {isEarned && (
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${badge.color}, transparent)` }} />
                            )}
                            
                            <div style={{ 
                              background: isEarned ? `${badge.color}20` : 'rgba(255,255,255,0.1)', 
                              padding: '1rem', 
                              borderRadius: '50%', 
                              marginBottom: '1rem',
                              boxShadow: isEarned ? `0 0 15px ${badge.color}40` : 'none'
                            }}>
                              <IconComp size={28} color={isEarned ? badge.color : 'white'} />
                            </div>
                            
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{badge.name}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {leftText}
                            </p>
                            
                            {!isEarned && (
                              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${badge.progress}%`, background: badge.color }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {achievements.badges.length > 0 && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <Button variant="outline" onClick={() => setShowAllBadges(!showAllBadges)}>
                      {showAllBadges ? 'Show Less' : 'Show All Badges'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-secondary">Loading achievements...</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
