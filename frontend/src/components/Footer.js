/**
 * Footer - Clean footer with el-footer CSS class
 */
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="el-footer">
    <div className="container">
      <div className="row g-4 mb-4">
        <div className="col-lg-4 col-md-6">
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', fontWeight:800, color:'var(--el-accent)', marginBottom:12 }}>
            <i className="bi bi-mortarboard-fill me-2"></i>EduLearn
          </div>
          <p style={{ color:'rgba(255,255,255,.6)', lineHeight:1.8, fontSize:'.9rem' }}>
            India's premier online learning platform. Learn from top instructors and transform your career with industry-relevant skills.
          </p>
          <div className="d-flex gap-3 mt-3">
            {['facebook','twitter','instagram','linkedin','youtube'].map(s => (
              <a key={s} href="#!" style={{ color:'rgba(255,255,255,.5)', fontSize:'1.2rem', transition:'var(--tr)' }}
                onMouseOver={e => e.target.style.color='var(--el-accent)'}
                onMouseOut={e  => e.target.style.color='rgba(255,255,255,.5)'}>
                <i className={`bi bi-${s}`}></i>
              </a>
            ))}
          </div>
        </div>
        <div className="col-lg-2 col-md-6">
          <h5 className="mb-3">Quick Links</h5>
          <Link to="/">Home</Link>
          <Link to="/courses">All Courses</Link>
          <Link to="/register">Join Now</Link>
          <Link to="/login">Login</Link>
        </div>
        <div className="col-lg-3 col-md-6">
          <h5 className="mb-3">Categories</h5>
          {['Web Development','Data Science','Mobile Development','Design','DevOps','Marketing'].map(c => (
            <Link key={c} to={`/courses?category=${encodeURIComponent(c)}`}>{c}</Link>
          ))}
        </div>
        <div className="col-lg-3 col-md-6">
          <h5 className="mb-3">Contact Us</h5>
          <div className="mb-3">
            {[['bi-telephone-fill','+91 000000000'],['bi-envelope-fill','yourgmail@gmail.com'],['bi-geo-alt-fill','India']].map(([ic,txt]) => (
              <div key={ic} className="d-flex align-items-center gap-2 mb-2">
                <i className={`bi ${ic}`} style={{ color:'var(--el-accent)' }}></i>
                <span style={{ fontSize:'.88rem' }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr style={{ borderColor:'rgba(255,255,255,.10)' }} />
      <div className="d-flex flex-wrap justify-content-between align-items-center py-3">
        <p style={{ margin:0, color:'rgba(255,255,255,.45)', fontSize:'.88rem' }}>© 2024 EduLearn. All rights reserved. Made with ❤️ in India</p>
        <div className="d-flex gap-3">
          <a href="#!" style={{ color:'rgba(255,255,255,.45)', fontSize:'.82rem' }}>Privacy Policy</a>
          <a href="#!" style={{ color:'rgba(255,255,255,.45)', fontSize:'.82rem' }}>Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
