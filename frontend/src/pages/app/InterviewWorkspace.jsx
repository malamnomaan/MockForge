import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { interviewService } from '../../services/interviews';
import { aiService } from '../../services/ai';
import { Send, AlertTriangle, Plus, FileCode, Play, Terminal } from 'lucide-react';

const getBoilerplate = (lang) => {
  switch(lang?.toLowerCase()) {
    case 'python': return 'def solve():\n    pass\n';
    case 'java': return 'class Solution {\n    public void solve() {\n        \n    }\n}\n';
    case 'c++': return 'class Solution {\npublic:\n    void solve() {\n        \n    }\n};\n';
    case 'go': return 'package main\n\nfunc solve() {\n    \n}\n';
    case 'typescript': return 'function solve(): void {\n    \n}\n';
    default: return '// Write your solution here...\n';
  }
};

export default function InterviewWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  
  // Workspace State
  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [includeCode, setIncludeCode] = useState(false);
  
  const [warnings, setWarnings] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const chatContainerRef = useRef(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [executionError, setExecutionError] = useState(false);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    interviewService.getSession(id)
      .then(data => {
        setSession(data);
        if (data.answer) {
          try {
            const parsed = JSON.parse(data.answer);
            setFiles(Array.isArray(parsed) ? parsed : [{ name: 'solution.txt', content: data.answer }]);
          } catch(e) {
            setFiles([{ name: 'solution.txt', content: data.answer }]);
          }
        } else {
          const extMap = { 'python': 'py', 'java': 'java', 'c++': 'cpp', 'go': 'go', 'typescript': 'ts' };
          const ext = extMap[data.language?.toLowerCase()] || 'js';
          setFiles([{ name: `main.${ext}`, content: getBoilerplate(data.language) }]);
        }

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
        setToastMessage('Warning: Tab switching is tracked during the interview!');
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

  const updateFileContent = (newContent) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[activeFileIndex].content = newContent;
      return newFiles;
    });
  };

  const handleAddFile = () => {
    const name = prompt("Enter new file name (e.g., helper.js):");
    if (name) {
      setFiles(prev => [...prev, { name, content: '// New file\n' }]);
      setActiveFileIndex(files.length); // Next index
    }
  };

  const handleEditorMount = (editor, monaco) => {
    // Anti-Cheat: Prevent Paste
    editor.onDidPaste(() => {
      setWarnings(w => w + 1);
      setToastMessage('Pasting code is disabled during the interview.');
    });
  };

  const handleSubmit = async () => {
    if(!window.confirm("Are you sure you want to submit your final answer?")) return;
    
    setSubmitting(true);
    try {
      await interviewService.submitAnswer(id, JSON.stringify(files), warnings);
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

  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionOutput('Executing code...');
    setExecutionError(false);
    try {
      const result = await interviewService.executeCode(session.language, files);
      setExecutionOutput(result.output);
      setExecutionError(result.error);
    } catch (err) {
      setExecutionOutput('Failed to connect to execution server.\n' + err.message);
      setExecutionError(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSendMessage = async (customMessage = null) => {
    const msg = customMessage || chatInput;
    if (!msg.trim()) return;

    let payloadMsg = msg;
    if (includeCode && files.length > 0 && !customMessage) {
      const codeContext = files.map(f => `--- File: ${f.name} ---\n${f.content}`).join('\n\n');
      payloadMsg = `${msg}\n\n[CODE CONTEXT]\n${codeContext}`;
    }

    if (!customMessage) {
      // Optimistic update
      setChatHistory(prev => [...prev, { role: 'user', content: payloadMsg }]);
      setChatInput('');
    }
    
    setChatLoading(true);
    try {
      const response = await aiService.sendChatMessage(id, payloadMsg);
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

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--accent-primary)', color: 'white', padding: '1rem 2rem',
          borderRadius: 'var(--radius-lg)', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          <AlertTriangle size={20} />
          {toastMessage}
        </div>
      )}

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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="secondary" onClick={handleRunCode} disabled={isExecuting || submitting}>
              <Play size={16} /> {isExecuting ? 'Running...' : 'Run Code'}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting || isExecuting}>
              {submitting ? 'Evaluating...' : 'Submit Solution'}
            </Button>
          </div>
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
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content.includes('[CODE CONTEXT]') ? msg.content.split('[CODE CONTEXT]')[0].trim() : msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>AI is typing...</div>
              )}
            </div>

            {/* Chat Input */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  id="includeCode" 
                  checked={includeCode} 
                  onChange={e => setIncludeCode(e.target.checked)} 
                />
                <label htmlFor="includeCode" style={{ cursor: 'pointer' }}>Include codebase in message</label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            </div>
          </Card>

          {/* Monaco Editor Panel */}
          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--glass-border)', minHeight: 0 }}>
            {/* Tab Bar */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', overflowX: 'auto' }}>
              {files.map((file, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveFileIndex(idx)}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    cursor: 'pointer',
                    background: activeFileIndex === idx ? 'rgba(255,255,255,0.1)' : 'transparent',
                    borderRight: '1px solid var(--glass-border)',
                    borderBottom: activeFileIndex === idx ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileCode size={16} className={activeFileIndex === idx ? 'text-accent-primary' : 'text-secondary'} />
                  <span className={activeFileIndex === idx ? 'text-primary' : 'text-secondary'} style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {file.name}
                  </span>
                </div>
              ))}
              <div 
                onClick={handleAddFile}
                style={{ padding: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                title="New File"
              >
                <Plus size={18} />
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                {files.length > 0 && (
                  <Editor
                    height="100%"
                    defaultLanguage={session.language ? session.language.toLowerCase() : 'javascript'}
                    theme="vs-dark"
                    value={files[activeFileIndex].content}
                    onChange={(val) => updateFileContent(val || '')}
                    onMount={handleEditorMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      padding: { top: 16 },
                      automaticLayout: true
                    }}
                  />
                )}
              </div>
              
              {/* Console Output Panel */}
              <div style={{ height: '220px', borderTop: '1px solid var(--glass-border)', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                  <Terminal size={14} className="text-secondary" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Console Output</span>
                </div>
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '0.875rem', color: executionError ? '#ef4444' : '#10b981', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.5 }}>
                    {executionOutput || 'Ready. Click "Run Code" to execute your solution.'}
                  </pre>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
