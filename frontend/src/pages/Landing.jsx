import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Terminal, Cpu, Trophy, Code2 } from 'lucide-react';

export default function Landing() {
  return (
    <>
      <SEO 
        title="Home" 
        description="Ace your FAANG interviews with MockForge. AI-powered system design and algorithms mock interviews." 
      />
      
      {/* Hero Section */}
      <section className="section text-center">
        <div className="container">
          <div className="bg-glow"></div>
          <h1 className="heading-1 mt-md">
            Master the <span className="text-gradient">FAANG</span> Interview.
          </h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
            Experience hyper-realistic mock interviews for Data Structures, Algorithms, and System Design, powered by state-of-the-art AI.
          </p>
          <div className="flex-center gap-md">
            <Button size="lg">Start Free Trial</Button>
            <Button variant="secondary" size="lg">View Demo</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 className="heading-2">Why Mock<span className="text-gradient">Forge</span>?</h2>
            <p className="text-secondary">Everything you need to crack the toughest technical interviews.</p>
          </div>
          
          <div className="grid-cols-2">
            <Card>
              <Terminal size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
              <h3 className="heading-3">Real Coding Environments</h3>
              <p className="text-secondary">Execute your code in a realistic IDE environment just like you would in a real interview setting.</p>
            </Card>
            
            <Card>
              <Cpu size={32} color="var(--accent-secondary)" style={{ marginBottom: '1rem' }} />
              <h3 className="heading-3">AI Interviewer</h3>
              <p className="text-secondary">Get instant feedback, hints, and dynamic follow-up questions from our trained AI interviewer.</p>
            </Card>
            
            <Card>
              <Code2 size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
              <h3 className="heading-3">System Design Architecture</h3>
              <p className="text-secondary">Whiteboard complex scalable systems and receive deep architectural critiques.</p>
            </Card>

            <Card>
              <Trophy size={32} color="var(--accent-secondary)" style={{ marginBottom: '1rem' }} />
              <h3 className="heading-3">FAANG Rubrics</h3>
              <p className="text-secondary">Evaluations based strictly on rubrics from top tech companies (Signal, Coding, Design).</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section text-center" style={{ paddingBottom: '8rem' }}>
        <div className="container">
          <Card hover={false} className="bg-glow right">
            <h2 className="heading-2">Ready to secure your dream offer?</h2>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>
              Join thousands of engineers who leveled up their interview skills with MockForge.
            </p>
            <Button size="lg">Create Your Account</Button>
          </Card>
        </div>
      </section>
    </>
  );
}
