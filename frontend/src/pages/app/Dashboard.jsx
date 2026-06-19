import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play } from 'lucide-react';
import { interviewService } from '../../services/interviews';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [streakDays, setStreakDays] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);

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
    // Calculate 45-day heatmap
    const daysMap = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Initialize last 45 days with 0
    for(let i=44; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      daysMap[d.toDateString()] = { date: d, count: 0 };
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

    // Calculate current streak
    let streak = 0;
    for(let i=heatmap.length-1; i>=0; i--) {
      if(heatmap[i].count > 0) streak++;
      else if(i !== heatmap.length-1) break; // Don't break if today is 0, but yesterday was 1 (optional logic, kept simple here)
      else if (heatmap[i].count === 0 && heatmap[i-1]?.count > 0) continue; // Allow today to be 0
      else break;
    }
    setCurrentStreak(streak);

    // Mock chart data (until we fetch individual evaluations)
    // We'll map the sessions to the chart if they exist, else show empty
    const cData = sessList.slice(0, 10).reverse().map((s, i) => ({
      name: `Int ${i+1}`,
      score: Math.floor(Math.random() * 30) + 60 // Mock score between 60-90 for UI purposes
    }));
    setChartData(cData.length ? cData : [{name: 'Start', score: 0}]);
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
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Performance</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* GitHub Style Streak */}
        <Card hover={false} style={{ padding: '1.5rem' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Activity Streak</h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignContent: 'flex-start' }}>
            {streakDays.map((day, i) => {
              let opacity = 0.1;
              if (day.count === 1) opacity = 0.4;
              if (day.count === 2) opacity = 0.6;
              if (day.count >= 3) opacity = 1;
              
              return (
                <div 
                  key={i} 
                  title={`${day.count} interviews on ${day.date.toLocaleDateString()}`}
                  style={{
                    width: '18px', 
                    height: '18px', 
                    backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                    borderRadius: '4px',
                    border: opacity === 0.1 ? '1px solid var(--glass-border)' : 'none'
                  }}
                />
              );
            })}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }} className="text-gradient">{currentStreak} Days</div>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Current Streak</p>
          </div>
        </Card>
      </div>
      
      {/* Recent Sessions */}
      <Card hover={false} style={{ padding: '1.5rem' }}>
        <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Interviews</h3>
        {sessions.length === 0 ? (
          <p className="text-secondary">No mock interviews taken yet.</p>
        ) : (
          <div className="flex-col gap-sm">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="glass flex-between" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{session.type}</div>
                  <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Status: {session.status.name}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/app/session/${session.id}`)}>
                  {session.status.code === 'INTERVIEW_CREATED' ? 'Continue' : 'View'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
