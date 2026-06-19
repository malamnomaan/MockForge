import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Globe } from 'lucide-react';
import './Layout.css';

export default function Footer() {
  return (
    <footer className="footer glass">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">
              Mock<span className="text-gradient">Forge</span>
            </Link>
            <p className="text-secondary mt-sm">
              FAANG-level mock interviews powered by AI. Level up your coding and system design skills.
            </p>
            <div className="social-links mt-md">
              <a href="#"><MessageSquare size={20} /></a>
              <a href="#"><Globe size={20} /></a>
              <a href="#"><Mail size={20} /></a>
            </div>
          </div>
          
          <div className="footer-links">
            <h4 className="heading-4">Product</h4>
            <Link to="/#features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/changelog">Changelog</Link>
          </div>

          <div className="footer-links">
            <h4 className="heading-4">Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/career">Careers</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-links">
            <h4 className="heading-4">Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="text-secondary">© {new Date().getFullYear()} MockForge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
