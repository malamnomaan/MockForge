import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { interviewService } from '../../services/interviews';
import { aiService } from '../../services/ai';
import { ArrowLeft } from 'lucide-react';

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
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
              <code>{session.answer || 'No answer submitted.'}</code>
            </pre>
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
              <Card hover={false} style={{ padding: '1.5rem', borderColor: 'var(--accent-primary)' }}>
                <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>AI Score</h3>
                <div className="text-gradient" style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1 }}>
                  {evaluation.score}/100
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
                  {evaluation.improvements ? evaluation.improvements.map((imp, i) => <li key={i}>{imp}</li>) : <li>No improvements suggested.</li>}
                </ul>
              </Card>
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
