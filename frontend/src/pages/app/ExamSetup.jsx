import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Code, Server, Zap, Crown, Lock } from 'lucide-react';
import { interviewService } from '../../services/interviews';

export default function ExamSetup() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('DSA');
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);

  const examTypes = [
    {
      id: 'DSA',
      title: 'Data Structures & Algorithms',
      description: 'Standard coding interview focusing on algorithmic problem solving.',
      icon: <Code size={24} className="text-accent-primary" />
    },
    {
      id: 'SYSTEM_DESIGN',
      title: 'System Design',
      description: 'Architectural interview for scaling web services and databases.',
      icon: <Server size={24} className="text-accent-secondary" />
    },
    {
      id: 'RAPID_FIRE',
      title: 'Rapid Fire QnA',
      description: 'Quick technical questions to test fundamental knowledge.',
      icon: <Zap size={24} style={{ color: '#fbbf24' }} />
    },
    {
      id: 'SKILL_BASED',
      title: 'Skill Based (Premium)',
      description: 'Advanced framework-specific interview scenarios.',
      icon: <Crown size={24} style={{ color: '#fbbf24' }} />,
      disabled: true,
      premium: true
    }
  ];

  const languages = ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'TypeScript'];
  const difficulties = [
    { label: 'Easy (0-1 yrs)', value: 'Easy' },
    { label: 'Medium (2-5 yrs)', value: 'Medium' },
    { label: 'Hard (5-8 yrs)', value: 'Hard' },
    { label: 'Expert (8+ yrs)', value: 'Expert' }
  ];

  const handleStart = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      let prompt = '';
      if (selectedType === 'DSA') prompt = `Generate a random ${selectedDifficulty.toLowerCase()} level array/string question.`;
      if (selectedType === 'SYSTEM_DESIGN') prompt = `Design a URL shortener like bit.ly for a ${selectedDifficulty.toLowerCase()} level candidate.`;
      if (selectedType === 'RAPID_FIRE') prompt = `Rapid Fire QnA Round for a ${selectedDifficulty.toLowerCase()} level developer.`;

      const session = await interviewService.createSession(selectedType, prompt, selectedLanguage, selectedDifficulty);
      window.open(`/app/interview/${session.id}`, '_blank', 'width=1200,height=800');
      navigate('/app');
    } catch (error) {
      console.error(error);
      alert('Failed to initialize session.');
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Setup Interview" />
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h1 className="heading-2 text-gradient" style={{ marginBottom: '0.5rem' }}>Setup Your Interview</h1>
          <p className="text-secondary">Configure your AI mock interview experience.</p>
        </div>

        {/* Configuration Selectors */}
        <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Programming Language</label>
            <select 
              value={selectedLanguage} 
              onChange={e => setSelectedLanguage(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)' }}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Experience Level</label>
            <select 
              value={selectedDifficulty} 
              onChange={e => setSelectedDifficulty(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)' }}
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {examTypes.map((exam) => (
            <Card 
              key={exam.id}
              hover={!exam.disabled} 
              onClick={() => !exam.disabled && setSelectedType(exam.id)}
              style={{ 
                cursor: exam.disabled ? 'not-allowed' : 'pointer', 
                border: selectedType === exam.id ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                opacity: exam.disabled ? 0.6 : 1,
                position: 'relative'
              }}
            >
              {exam.premium && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <Lock size={18} className="text-secondary" />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                  {exam.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{exam.title}</h3>
              </div>
              <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>{exam.description}</p>
            </Card>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="outline" onClick={() => navigate('/app')}>Cancel</Button>
          <Button variant="primary" onClick={handleStart} disabled={loading}>
            {loading ? 'Initializing...' : 'Start Interview'}
          </Button>
        </div>

      </div>
    </>
  );
}
