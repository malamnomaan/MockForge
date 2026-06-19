import SEO from '../components/SEO';

export default function About() {
  return (
    <>
      <SEO title="About Us" description="Learn about the MockForge mission and the team behind the platform." />
      
      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="heading-1">Our <span className="text-gradient">Mission</span></h1>
          
          <div className="glass glass-card" style={{ marginTop: '2rem' }}>
            <p className="text-secondary" style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              At MockForge, we believe that landing a job at a top-tier tech company shouldn't be gated by who you know or how much you can afford for expensive human mock interviews.
            </p>
            <p className="text-secondary" style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              We are building the world's most advanced AI-powered technical interviewer. Our platform is trained on thousands of real interview transcripts to provide you with the exact environment, stress, and feedback you'll experience in a real FAANG interview.
            </p>
            <p className="text-secondary" style={{ fontSize: '1.125rem' }}>
              Built by Ex-Meta and Ex-Google engineers, MockForge is the tool we wish we had when we were preparing for our own interviews.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
