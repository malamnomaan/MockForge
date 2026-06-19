import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { problemsService } from '../../services/problems';
import { Lock, Unlock, Star, Code, Shield } from 'lucide-react';

export default function Curriculum() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeLevel, setActiveLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const levelData = await problemsService.getLevels();
      setData(levelData);
      if (levelData.levels.length > 0) {
        loadProblems(levelData.levels[0].level_number);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProblems = async (levelId) => {
    setActiveLevel(levelId);
    try {
      const probs = await problemsService.getProblems(levelId);
      setProblems(probs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlockTest = async (levelId) => {
    if(!window.confirm(`Take the AI Boss Fight to unlock Level ${levelId + 1}?`)) return;
    alert("Starting AI Mock Interview... (Prototype Feature)");
    // const res = await problemsService.unlockTest(levelId);
    // navigate(`/app/interview/${res.session_id}`);
  };

  if (loading) return <div>Loading curriculum...</div>;

  const unlocked = data?.unlocked_level || 1;

  return (
    <>
      <SEO title="DSA Curriculum" />
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-2 text-gradient">DSA Curriculum</h1>
        <p className="text-secondary">Master algorithms across 5 levels. Solve problems to earn stars, pass AI tests to unlock next levels.</p>
      </div>

      <div className="grid-sidebar-layout">
        
        {/* Levels Sidebar */}
        <div className="flex-col gap-sm">
          {[1,2,3,4,5].map(lvl => {
            const isUnlocked = lvl <= unlocked;
            const levelObj = data?.levels.find(l => l.level_number === lvl) || { title: `Level ${lvl}` };
            
            return (
              <Card 
                key={lvl} 
                hover={isUnlocked}
                onClick={() => isUnlocked && loadProblems(lvl)}
                style={{ 
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  opacity: isUnlocked ? 1 : 0.6,
                  border: activeLevel === lvl ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                }}
              >
                <div className="flex-between">
                  <div style={{ fontWeight: 600 }}>{levelObj.title}</div>
                  {isUnlocked ? <Unlock size={18} className="text-accent-primary" /> : <Lock size={18} className="text-secondary" />}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Problems List */}
        <div>
          <Card hover={false} style={{ padding: '2rem' }}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <h2 className="heading-3">Level {activeLevel} Problems</h2>
              {activeLevel === unlocked && problems.length > 0 && (
                <Button variant="primary" onClick={() => handleUnlockTest(activeLevel)}>
                  <Shield size={16} /> Take AI Boss Fight
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {problems.map((prob, i) => (
                <div 
                  key={prob.id} 
                  className="glass flex-between" 
                  style={{ padding: '1rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{i + 1}.</span>
                    <span style={{ fontWeight: 500 }}>{prob.title}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(59,130,246,0.2)', color: 'var(--accent-primary)', borderRadius: '1rem' }}>
                      {prob.difficulty}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', color: prob.stars > 0 ? '#fbbf24' : 'var(--text-secondary)' }}>
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={16} fill={idx < prob.stars ? '#fbbf24' : 'transparent'} />
                      ))}
                    </div>
                    <Button variant="outline" onClick={() => navigate(`/app/problems/${prob.id}`)}>
                      <Code size={14} /> Solve
                    </Button>
                  </div>
                </div>
              ))}
              
              {problems.length === 0 && (
                <div className="text-center text-secondary">No problems found for this level.</div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </>
  );
}
