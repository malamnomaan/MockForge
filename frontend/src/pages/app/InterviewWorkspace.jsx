import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { interviewService } from '../../services/interviews';
import { aiService } from '../../services/ai';
import { Send, AlertTriangle } from 'lucide-react';

export default function InterviewWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [code, setCode] = useState('// Write your solution here...\n');
  const [submitting, setSubmitting] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    interviewService.getSession(id)
      .then(data => {
        setSession(data);
        if (data.answer) setCode(data.answer);
        if (data.chat_history) setChatHistory(data.chat_history.filter(m => m.role !== 'system'));
        
        // Auto-start chat if empty
        if (!data.chat_history || data.chat_history.length === 0) {
          handleSendMessage("I'm ready to begin.");
        }
      })
      .catch(err => {
        console.error(err);
        navigate('/app');
      });
  }, [id, navigate]);

  // Anti-Cheat: Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => w + 1);
        alert('Warning: Tab switching is tracked during the interview!');
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Scroll chat to bottom using scrollTop to prevent browser layout shifts
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleEditorMount = (editor, monaco) => {
    // Anti-Cheat: Prevent Paste
    editor.onDidPaste(() => {
      setWarnings(w => w + 1);
      alert('Pasting code is disabled during the interview.');
    });
  };

  const handleSubmit = async () => {
    if(!window.confirm("Are you sure you want to submit your final answer?")) return;
    
    setSubmitting(true);
    try {
      await interviewService.submitAnswer(id, code);
      await interviewService.transitionStatus(id, 'INTERVIEW_SUBMITTED');
      await interviewService.transitionStatus(id, 'INTERVIEW_EVALUATED');
      await aiService.triggerEvaluation(id);
      navigate(`/app/session/${id}`);
    } catch (error) {
      console.error('Submission failed', error);
      alert('Failed to submit interview. See console.');
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (customMessage = null) => {
    const msg = customMessage || chatInput;
    if (!msg.trim()) return;

    if (!customMessage) {
      // Optimistic update
      setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
      setChatInput('');
    }
    
    setChatLoading(true);
    try {
      const response = await aiService.sendChatMessage(id, msg);
      setChatHistory(response.chat_history.filter(m => m.role !== 'system'));
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the brain.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!session) return <div>Loading workspace...</div>;

  return (
    <>
      <SEO title="Interview Workspace" />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 className="heading-3" style={{ margin: 0 }}>Mock Interview: {session.type}</h1>
            {warnings > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem' }}>
                <AlertTriangle size={16} /> {warnings} Violations Detected
              </div>
            )}
          </div>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Evaluating...' : 'Submit Solution'}
          </Button>
        </div>

        {/* Workspace Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
          
          {/* Chat / Agent Panel */}
          <Card hover={false} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>AI Interviewer</h3>
            </div>
            
            {/* Chat History */}
            <div 
              ref={chatContainerRef}
              style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}
            >
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--accent-primary)' }}>System</div>
                {session.question}
              </div>

              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{ 
                  background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: msg.role === 'user' ? '#fff' : 'var(--accent-primary)' }}>
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>AI is typing...</div>
              )}
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Discuss the problem..."
                className="glass"
                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', outline: 'none', color: 'white' }}
              />
              <Button onClick={() => handleSendMessage()} disabled={chatLoading} style={{ padding: '0 1rem' }}>
                <Send size={18} />
              </Button>
            </div>
          </Card>

          {/* Monaco Editor Panel */}
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--glass-border)', minHeight: 0 }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
              <span className="text-secondary" style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>solution.js</span>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Editor
                height="100%"
                defaultLanguage={session.language ? session.language.toLowerCase() : 'javascript'}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 16 },
                  automaticLayout: true
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
