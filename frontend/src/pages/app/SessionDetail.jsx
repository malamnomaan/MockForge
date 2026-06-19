import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { interviewService } from '../../services/interviews';
import { aiService } from '../../services/ai';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    // Fetch session details
    interviewService.getSession(id).then(data => {
      setSession(data);
      // Fetch evaluations if session is terminal
      if (data.status.code === 'INTERVIEW_EVALUATED') {
        aiService.getEvaluations(id).then(evals => {
          if (evals.results && evals.results.length > 0) {
            setEvaluation(evals.results[0]);
          }
        }).catch(console.error);
      }
    }).catch(err => {
      console.error(err);
      navigate('/app');
    });
  }, [id, navigate]);

  if (!session) return <div>Loading session data...</div>;

  const renderAnswer = () => {
    if (!session.answer) return <code>No answer submitted.</code>;
    try {
      const parsed = JSON.parse(session.answer);
      if (Array.isArray(parsed)) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {parsed.map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{f.name}</div>
                <pre style={{ margin: 0, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
                  <code>{f.content}</code>
                </pre>
              </div>
            ))}
          </div>
        );
      }
    } catch(e) {}
    
    return (
      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
        <code>{session.answer}</code>
      </pre>
    );
  };

  return (
    <>
      <SEO title="Session Results" />
      <div style={{ marginBottom: '2rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app')} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
        <h1 className="heading-2" style={{ marginBottom: '0.25rem' }}>Interview Results</h1>
        <p className="text-secondary">Type: {session.type}</p>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Q & A */}
        <div className="flex-col gap-lg">
          <Card hover={false} style={{ padding: '1.5rem' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Question</h3>
            <div className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
              {session.question}
            </div>
          </Card>

          <Card hover={false} style={{ padding: '1.5rem' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Your Answer</h3>
            {renderAnswer()}
          </Card>
        </div>

        {/* Right Column: Evaluation */}
        <div>
          {session.status.code !== 'INTERVIEW_EVALUATED' ? (
            <Card hover={false} style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-secondary">This session has not been evaluated yet.</p>
              <Button onClick={() => navigate(`/app/interview/${session.id}`)} style={{ marginTop: '1rem' }}>
                Continue Interview
              </Button>
            </Card>
          ) : evaluation ? (
            <div className="flex-col gap-md">
              <Card hover={false} style={{ padding: '1.5rem', borderColor: 'var(--accent-primary)', position: 'relative' }}>
                <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
                  AI Score
                  {evaluation.verdict && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginLeft: '1rem',
                      background: evaluation.verdict === 'hire' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: evaluation.verdict === 'hire' ? '#10b981' : '#ef4444'
                    }}>
                      {evaluation.verdict.replace('_', ' ')}
                    </span>
                  )}
                </h3>
                <div className="text-gradient" style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1 }}>
                  {evaluation.final_score}/100
                </div>

                <div style={{ 
                  position: 'absolute', top: '1.5rem', right: '1.5rem', 
                  padding: '0.5rem 1rem', borderRadius: '1rem', fontWeight: 600, fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: session.violations > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: session.violations > 0 ? '#ef4444' : '#10b981',
                  border: session.violations > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {session.violations > 0 ? (
                    <><AlertTriangle size={16} /> {session.violations} Anti-Cheat Violations</>
                  ) : (
                    <>Clean Interview (0 Violations)</>
                  )}
                </div>
              </Card>

              <Card hover={false} style={{ padding: '1.5rem' }}>
                <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#10b981' }}>Strengths</h3>
                <ul className="text-secondary" style={{ paddingLeft: '1.5rem' }}>
                  {evaluation.strengths ? evaluation.strengths.map((s, i) => <li key={i}>{s}</li>) : <li>No specific strengths recorded.</li>}
                </ul>
              </Card>

              <Card hover={false} style={{ padding: '1.5rem' }}>
                <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#ef4444' }}>Weaknesses</h3>
                <ul className="text-secondary" style={{ paddingLeft: '1.5rem' }}>
                  {evaluation.weaknesses ? evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>) : <li>No specific weaknesses recorded.</li>}
                </ul>
              </Card>

              <Card hover={false} style={{ padding: '1.5rem' }}>
                <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>Improvements</h3>
                <ul className="text-secondary" style={{ paddingLeft: '1.5rem' }}>
                  {evaluation.improvements.map((imp, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem', color: '#64748b' }}>{imp}</li>
                  ))}
                </ul>
              </Card>

              {evaluation.scores && Object.keys(evaluation.scores).length > 0 && (
                <Card hover={false} style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#94a3b8' }}>Detailed Score Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(evaluation.scores).map(([category, catScore]) => (
                      <div key={category} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                          {category.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{catScore}/100</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card hover={false} style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="text-secondary">Generating AI evaluation report...</p>
            </Card>
          )}
        </div>

      </div>
    </>
  );
}
