import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Code, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../../services/auth';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: <LayoutDashboard size={20} />, end: true },
    { name: 'Interviews', path: '/app/interviews', icon: <Code size={20} /> },
    { name: 'Profile', path: '/app/profile', icon: <User size={20} /> },
  ];

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Toggle */}
      <div className="mobile-header glass">
        <span className="logo">Mock<span className="text-gradient">Forge</span></span>
        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar glass ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo">Mock<span className="text-gradient">Forge</span></span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
