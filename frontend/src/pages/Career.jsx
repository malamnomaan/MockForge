import SEO from '../components/SEO';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Career() {
  const jobs = [
    { title: "Senior AI Engineer", dept: "Engineering", location: "Remote", type: "Full-time" },
    { title: "Frontend Developer (React)", dept: "Engineering", location: "Remote", type: "Full-time" },
    { title: "Product Designer", dept: "Design", location: "New York, NY", type: "Hybrid" },
    { title: "Developer Advocate", dept: "Marketing", location: "Remote", type: "Full-time" }
  ];

  return (
    <>
      <SEO title="Careers" description="Join the MockForge team and help build the future of technical interviewing." />
      
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h1 className="heading-1">Join the <span className="text-gradient">Forge</span></h1>
            <p className="text-secondary">Help us democratize access to elite tech careers.</p>
          </div>
          
          <div className="flex-col gap-md" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {jobs.map((job, idx) => (
              <Card key={idx} className="flex-between" style={{ padding: '1.5rem' }}>
                <div>
                  <h3 className="heading-3" style={{ marginBottom: '0.25rem' }}>{job.title}</h3>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{job.dept}</span>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>•</span>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{job.location}</span>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>•</span>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{job.type}</span>
                  </div>
                </div>
                <Button variant="secondary">Apply</Button>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
