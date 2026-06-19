import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { interviewService } from '../../services/interviews';

export default function Interviews() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewService.getSessions()
      .then(data => {
        setSessions(data.results || data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title="Past Interviews" />
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-2" style={{ marginBottom: '0.25rem' }}>Past Interviews</h1>
          <p className="text-secondary">Review your previous mock interview sessions and evaluations.</p>
        </div>
        <Button onClick={() => navigate('/app/setup')}>
          New Interview
        </Button>
      </div>

      <Card hover={false} style={{ padding: '1.5rem' }}>
        {loading ? (
          <p className="text-secondary">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-secondary">No mock interviews taken yet.</p>
        ) : (
          <div className="flex-col gap-sm">
            {sessions.map(session => {
              const d = new Date(session.created_at);
              return (
                <div key={session.id} className="glass flex-between" style={{ padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{session.type}</div>
                    <div className="text-secondary" style={{ fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
                      <span>Status: <strong style={{ color: 'var(--text-primary)' }}>{session.status.name}</strong></span>
                      <span>Date: {d.toLocaleDateString()}</span>
                      {session.evaluations && session.evaluations.length > 0 && (
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                          Score: {session.evaluations[0].score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(`/app/session/${session.id}`)}>
                    {session.status.code === 'INTERVIEW_CREATED' ? 'Continue' : 'Review Details'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
