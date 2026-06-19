import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Check } from 'lucide-react';

export default function Pricing() {
  return (
    <>
      <SEO 
        title="Pricing" 
        description="Choose the right MockForge plan to accelerate your interview prep." 
      />
      
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h1 className="heading-1">Simple, <span className="text-gradient">transparent</span> pricing.</h1>
            <p className="text-secondary">Invest in your career. Upgrade anytime.</p>
          </div>
          
          <div className="grid-cols-3">
            {/* Free Tier */}
            <Card>
              <h3 className="heading-3">Starter</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '1rem 0' }}>$0<span className="text-secondary" style={{ fontSize: '1rem' }}>/mo</span></div>
              <p className="text-secondary mb-lg">Perfect for casual practice.</p>
              
              <ul className="flex-col gap-sm" style={{ marginBottom: '2rem', listStyle: 'none' }}>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> 5 Mock Interviews/mo</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Basic DSA Questions</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', opacity: 0.5 }}><Check size={18} /> No System Design</li>
              </ul>
              
              <Button variant="secondary" fullWidth>Get Started</Button>
            </Card>

            {/* Pro Tier */}
            <Card className="glass" style={{ borderColor: 'var(--accent-primary)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--gradient-primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>RECOMMENDED</div>
              <h3 className="heading-3 text-gradient">Pro Engineer</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '1rem 0' }}>$29<span className="text-secondary" style={{ fontSize: '1rem' }}>/mo</span></div>
              <p className="text-secondary mb-lg">For serious interview prep.</p>
              
              <ul className="flex-col gap-sm" style={{ marginBottom: '2rem', listStyle: 'none' }}>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Unlimited Interviews</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Premium FAANG Questions</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> System Design Scenarios</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Detailed AI Rubric Reports</li>
              </ul>
              
              <Button variant="primary" fullWidth>Upgrade to Pro</Button>
            </Card>

            {/* Enterprise Tier */}
            <Card>
              <h3 className="heading-3">Enterprise</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '1rem 0' }}>$99<span className="text-secondary" style={{ fontSize: '1rem' }}>/mo</span></div>
              <p className="text-secondary mb-lg">For teams and bootcamps.</p>
              
              <ul className="flex-col gap-sm" style={{ marginBottom: '2rem', listStyle: 'none' }}>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Everything in Pro</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Custom Rubrics</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> Admin Dashboard</li>
                <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><Check size={18} color="var(--accent-primary)" /> API Access</li>
              </ul>
              
              <Button variant="secondary" fullWidth>Contact Sales</Button>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
