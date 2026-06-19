import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AreaChart, Area, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { interviewService } from '../../services/interviews';

const FeedbackTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', maxWidth: '300px', whiteSpace: 'normal', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{label}</p>
        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>Strengths ({data.strengths})</p>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
             {data.rawStrengths?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem' }}>Weaknesses ({data.weaknesses})</p>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
             {data.rawWeaknesses?.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [streakDays, setStreakDays] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [topStrengths, setTopStrengths] = useState([]);
  const [topWeaknesses, setTopWeaknesses] = useState([]);

  useEffect(() => {
    interviewService.getSessions()
      .then(data => {
        const sess = data.results || data;
        setSessions(sess);
        calculateAnalytics(sess);
      })
      .catch(console.error);
  }, []);

  const calculateAnalytics = (sessList) => {
    // Calculate 35-day calendar heatmap (5 full weeks aligned to Sunday)
    const daysMap = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Start date is Sunday of 4 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - 28);
    
    // Initialize exactly 35 days
    for(let i=0; i<35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      daysMap[d.toDateString()] = { date: d, count: 0, isFuture: d > today };
    }

    // Populate actual counts
    sessList.forEach(s => {
      const d = new Date(s.created_at);
      d.setHours(0,0,0,0);
      const dateStr = d.toDateString();
      if(daysMap[dateStr]) {
        daysMap[dateStr].count += 1;
      }
    });

    const heatmap = Object.values(daysMap);
    setStreakDays(heatmap);

    // Calculate current streak (ignoring future dates)
    let streak = 0;
    const pastDays = heatmap.filter(d => !d.isFuture);
    for(let i=pastDays.length-1; i>=0; i--) {
      if(pastDays[i].count > 0) streak++;
      else if(i !== pastDays.length-1) break; // Break if not today
      else if (pastDays[i].count === 0 && pastDays[i-1]?.count > 0) continue; // Allow today to be 0
      else break;
    }
    setCurrentStreak(streak);

    // Calculate Real Analytics Data (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const evaluatedSessions = sessList.filter(s => {
      if (!s.evaluations || s.evaluations.length === 0) return false;
      const d = new Date(s.created_at);
      return d >= thirtyDaysAgo;
    });

    const groupedData = {};
    const allStrengths = [];
    const allWeaknesses = [];
    
    evaluatedSessions.reverse().forEach((s) => {
      const d = new Date(s.created_at);
      const name = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const ev = s.evaluations[0];
      
      const sScore = ev.score || 0;
      const sViolations = s.violations || 0;
      const rawS = Array.isArray(ev.strengths) ? ev.strengths : (ev.strengths ? [ev.strengths] : []);
      const rawW = Array.isArray(ev.weaknesses) ? ev.weaknesses : (ev.weaknesses ? [ev.weaknesses] : []);
      
      allStrengths.push(...rawS);
      allWeaknesses.push(...rawW);
      
      if (!groupedData[name]) {
        groupedData[name] = {
          name,
          scoreSum: sScore,
          count: 1,
          violations: sViolations,
          rawStrengths: [...rawS],
          rawWeaknesses: [...rawW]
        };
      } else {
        groupedData[name].scoreSum += sScore;
        groupedData[name].count += 1;
        groupedData[name].violations += sViolations;
        groupedData[name].rawStrengths.push(...rawS);
        groupedData[name].rawWeaknesses.push(...rawW);
      }
    });

    const cData = Object.values(groupedData).map(g => ({
      name: g.name,
      score: Math.round(g.scoreSum / g.count),
      violations: g.violations,
      strengths: g.rawStrengths.length,
      weaknesses: g.rawWeaknesses.length,
      rawStrengths: g.rawStrengths,
      rawWeaknesses: g.rawWeaknesses
    }));

    setTopStrengths(allStrengths.reverse().slice(0, 10));
    setTopWeaknesses(allWeaknesses.reverse().slice(0, 10));
    setChartData(cData.length ? cData : [{name: 'Start', score: 0, violations: 0, strengths: 0, weaknesses: 0, rawStrengths: [], rawWeaknesses: []}]);
  };

  const handleStartSetup = () => {
    navigate('/app/setup');
  };

  return (
    <>
      <SEO title="Dashboard" />
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-2" style={{ marginBottom: '0.25rem' }}>Welcome Back</h1>
          <p className="text-secondary">Ready to crush your next interview?</p>
        </div>
        <Button size="lg" onClick={handleStartSetup}>
          <Play size={18} /> Setup Mock Interview
        </Button>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem', gap: '2rem' }}>
        {/* Performance Graph */}
        <Card hover={false} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} className="text-accent-primary" />
            <h3 className="heading-3" style={{ fontSize: '1.25rem' }}>AI Performance Score</h3>
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="score" name="Score" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Calendar (35 days) */}
        <Card hover={false} style={{ padding: '1.5rem' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Activity Calendar</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 18px)', gap: '6px', justifyContent: 'center' }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={`header-${i}`} style={{ fontSize: '10px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>
                {d}
              </div>
            ))}
            {streakDays.map((day, i) => {
              let opacity = 0.1;
              if (day.isFuture) opacity = 0.02;
              else if (day.count === 1) opacity = 0.4;
              else if (day.count === 2) opacity = 0.6;
              else if (day.count >= 3) opacity = 1;
              
              return (
                <div 
                  key={i} 
                  onMouseEnter={() => setHoveredDay({ ...day, index: i })}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    width: '18px', 
                    height: '18px', 
                    backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                    borderRadius: '4px',
                    border: opacity === 0.1 || opacity === 0.02 ? '1px solid var(--glass-border)' : 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                    transform: hoveredDay?.index === i ? 'scale(1.2)' : 'scale(1)',
                    zIndex: hoveredDay?.index === i ? 10 : 1
                  }}
                >
                  {/* Modern Tooltip */}
                  {hoveredDay?.index === i && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--glass-border)',
                      zIndex: 50
                    }}>
                      {day.isFuture ? 'Future' : `${day.count} interviews on ${day.date.toLocaleDateString()}`}
                      
                      {/* Tooltip Arrow */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRight: '1px solid var(--glass-border)',
                        borderBottom: '1px solid var(--glass-border)'
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }} className="text-gradient">{currentStreak} Days</div>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Current Streak</p>
          </div>
        </Card>

        {/* Violations Graph */}
        <Card hover={false} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h3 className="heading-3" style={{ fontSize: '1.25rem' }}>Anti-Cheat Violations</h3>
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="violations" name="Violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Strengths vs Weaknesses Graph */}
        <Card hover={false} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={20} style={{ color: '#10b981' }} />
            <h3 className="heading-3" style={{ fontSize: '1.25rem' }}>Feedback Ratio</h3>
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} allowDecimals={false} />
                <Tooltip content={<FeedbackTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="strengths" name="Strengths" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weaknesses" name="Weaknesses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem', gap: '2rem' }}>
        {/* Strengths Card */}
        <Card hover={false} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#10b981' }}>Key Strengths</h3>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '0.5rem' }}>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {topStrengths.length > 0 
                ? topStrengths.map((s, i) => <li key={i} style={{ marginBottom: '0.75rem', lineHeight: 1.5 }}>{s}</li>) 
                : <li>No strengths identified yet.</li>}
            </ul>
          </div>
        </Card>

        {/* Weaknesses Card */}
        <Card hover={false} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#f59e0b' }}>Areas for Improvement</h3>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '0.5rem' }}>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {topWeaknesses.length > 0 
                ? topWeaknesses.map((w, i) => <li key={i} style={{ marginBottom: '0.75rem', lineHeight: 1.5 }}>{w}</li>) 
                : <li>No weaknesses identified yet.</li>}
            </ul>
          </div>
        </Card>
      </div>
      
    </>
  );
}
