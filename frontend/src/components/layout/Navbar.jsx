import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import './Layout.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Features', path: '/#features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
    { name: 'Career', path: '/career' },
  ];

  return (
    <nav className="navbar glass">
      <div className="container flex-between nav-container">
        <Link to="/" className="logo">
          Mock<span className="text-gradient">Forge</span>
        </Link>

        {/* Desktop Nav */}
        <div className="nav-links desktop-only">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="nav-actions desktop-only">
          <Link to="/login"><Button variant="ghost">Log In</Button></Link>
          <Link to="/signup"><Button variant="primary">Sign Up Free</Button></Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="mobile-menu glass">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className="nav-link"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="mobile-actions">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" fullWidth>Log In</Button>
            </Link>
            <Link to="/signup" onClick={() => setIsOpen(false)}>
              <Button variant="primary" fullWidth>Sign Up Free</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
