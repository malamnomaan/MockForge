import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { problemsService } from '../../services/problems';
import { interviewService } from '../../services/interviews';
import { Play, CheckCircle, XCircle, Terminal } from 'lucide-react';

export default function ProblemWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    problemsService.getProblem(id).then(data => {
      setProblem(data);
      setCode(data.starter_code?.python || 'def solve(x):\n    return x\n');
      setLoading(false);
    }).catch(err => {
      console.error(err);
      navigate('/app/problems');
    });
  }, [id, navigate]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await problemsService.submitProblem(id, code, language);
      setResult({ ...res, isRun: false });
    } catch (err) {
      console.error(err);
      alert('Failed to submit code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCode = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await problemsService.runProblem(id, code, language);
      setResult({ ...res, isRun: true });
    } catch (err) {
      console.error(err);
      alert('Failed to run code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading problem...</div>;

  return (
    <>
      <SEO title={`Solve: ${problem.title}`} />
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8rem)', gap: '1rem', overflow: 'hidden' }}>
        
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button variant="outline" onClick={() => navigate('/app/problems')} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              &larr; Back
            </Button>
            <h1 className="heading-3" style={{ margin: 0 }}>{problem.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={language} 
              onChange={e => {
                setLanguage(e.target.value);
                setCode(problem.starter_code[e.target.value] || '// Start coding\n');
              }}
              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)' }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
            <Button variant="secondary" onClick={handleRunCode} disabled={submitting} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              <Terminal size={14} /> Run Code
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Submit <Play size={14} />
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '1rem', flex: 1, minHeight: 0 }}>
          
          {/* Description Panel */}
          <Card hover={false} style={{ overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(59,130,246,0.2)', color: 'var(--accent-primary)', borderRadius: '1rem' }}>
                {problem.difficulty}
              </span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: problem.description }} style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', overflowWrap: 'anywhere' }} />
            
            {problem.test_cases && problem.test_cases.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Test Cases</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {problem.test_cases.map((tc, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', overflowWrap: 'anywhere' }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Test Case {idx + 1}</div>
                      <strong>Input:</strong> <code style={{ color: 'var(--accent-primary)' }}>{tc.input}</code><br/>
                      <strong>Expected:</strong> <code style={{ color: '#10b981' }}>{tc.expected_output}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* IDE Panel */}
          <div className="glass" style={{ display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={val => setCode(val)}
                options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
              />
            </div>
            
            {/* Console Output */}
            <div style={{ height: '250px', background: '#0f172a', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, fontSize: '0.8rem' }}>
                Test Results
              </div>
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                {!result ? (
                  <span className="text-secondary">Run your code to see results.</span>
                ) : (
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: result.passed ? '#10b981' : '#ef4444' }}>
                      {result.passed ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      {result.passed ? 'Accepted!' : 'Failed'} {result.isRun ? '' : `(${result.stars} Stars)`}
                    </h3>
                    {result.error && <pre style={{ color: '#ef4444', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{result.error}</pre>}
                    {result.output && <pre style={{ color: 'var(--text-secondary)', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{result.output}</pre>}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
