/**
 * Navbar - Sticky responsive navigation, CSS class: el-navbar
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = path => location.pathname === path ? 'active' : '';
  const dashLink = () => {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student';
  };
  const roleColor = { admin:'#e74c3c', instructor:'#3498db', student:'#00c9a7' }[user?.role] || '#f0a500';

  return (
    <nav className="navbar navbar-expand-lg el-navbar">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand" to="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.75rem', fontWeight:800, color:'var(--el-accent)' }}>
          <i className="bi bi-mortarboard-fill me-2"></i>EduLearn
        </Link>

        {/* Mobile toggle */}
        <button className="navbar-toggler border-0" onClick={() => setOpen(!open)} style={{ color:'#fff', background:'none' }}>
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          {/* Center links */}
          <ul className="navbar-nav mx-auto gap-1">
            {[['/', 'Home'], ['/courses', 'Courses']].map(([path, label]) => (
              <li key={path} className="nav-item">
                <Link className={`nav-link ${isActive(path)}`} to={path} onClick={() => setOpen(false)}
                  style={{ color:'rgba(255,255,255,.82)', fontWeight:500, padding:'7px 16px', borderRadius:'var(--r-sm)', transition:'var(--tr)' }}>
                  {label}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li className="nav-item">
                <Link className="nav-link" to={dashLink()} onClick={() => setOpen(false)}
                  style={{ color:'rgba(255,255,255,.82)', fontWeight:500, padding:'7px 16px', borderRadius:'var(--r-sm)', transition:'var(--tr)' }}>
                  Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* Right side */}
          <div className="d-flex align-items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link to="/login"    className="btn-outline-gold btn-sm" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="btn-gold btn-sm"         onClick={() => setOpen(false)}>Get Started</Link>
              </>
            ) : (
              <div className="dropdown">
                <button className="btn d-flex align-items-center gap-2 dropdown-toggle"
                  data-bs-toggle="dropdown"
                  style={{ background:'rgba(255,255,255,.10)', color:'#fff', border:'1px solid rgba(255,255,255,.20)', borderRadius:'var(--r-md)' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--g-accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.88rem' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="d-none d-lg-block">{user.name?.split(' ')[0]}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius:'var(--r-lg)', minWidth:210, marginTop:8 }}>
                  <li>
                    <div className="px-4 py-3" style={{ borderBottom:'1px solid #f0f0f0' }}>
                      <div className="fw-700 text-dark">{user.name}</div>
                      <div style={{ fontSize:'.78rem', color:roleColor, fontWeight:600, textTransform:'capitalize' }}>{user.role}</div>
                      <div style={{ fontSize:'.75rem', color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                    </div>
                  </li>
                  <li><Link className="dropdown-item py-2" to={dashLink()} onClick={() => setOpen(false)}><i className="bi bi-speedometer2 me-2 text-primary"></i>Dashboard</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item py-2 text-danger" onClick={() => { logout(); setOpen(false); }}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
