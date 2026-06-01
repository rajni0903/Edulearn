/**
 * HomePage - Premium interactive landing page
 * CSS: Uses el-* classes from index.css + Bootstrap 5 grid
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import { getCourses } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── Scroll-triggered animation hook ── */
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

/* ── Data ── */
const CATEGORIES = [
  { name:'Web Development',    icon:'bi-code-slash',        color:'#0d6efd' },
  { name:'Data Science',       icon:'bi-graph-up-arrow',    color:'#00c9a7' },
  { name:'Mobile Development', icon:'bi-phone',             color:'#f0a500' },
  { name:'DevOps',             icon:'bi-gear-wide-connected',color:'#6610f2' },
  { name:'Design',             icon:'bi-palette',           color:'#e91e63' },
  { name:'Marketing',          icon:'bi-megaphone',         color:'#ff5722' },
];

const FEATURES = [
  { icon:'bi-play-circle-fill', title:'HD Video Lessons',    desc:'Crystal-clear content from industry experts, watch anytime on any device.',         color:'#0d6efd' },
  { icon:'bi-award-fill',       title:'Verified Certificates',desc:'Earn industry-recognized certificates after passing the final exam (75%+).',        color:'#f0a500' },
  { icon:'bi-people-fill',      title:'Active Community',    desc:'Join thousands of learners, get peer help, and grow your network.',                   color:'#00c9a7' },
  { icon:'bi-phone-fill',       title:'Mobile Friendly',     desc:'Responsive UI — learn on your phone, tablet, or desktop seamlessly.',                 color:'#e91e63' },
  { icon:'bi-infinity',         title:'Lifetime Access',     desc:'Enroll once and access all course updates for life, including new videos.',            color:'#6610f2' },
  { icon:'bi-translate',        title:'Hindi + English',     desc:'Bilingual quizzes and content — learn comfortably in your preferred language.',       color:'#ff5722' },
];

const TESTIMONIALS = [
  { name:'Rohit Sharma',  role:'Frontend Developer', text:'EduLearn changed my career! Got placed at a top startup within 2 months of completing the React course.', rating:5, avatar:'R' },
  { name:'Priya Nair',    role:'Data Analyst',       text:'The Data Science course structure is world-class. Every concept explained from scratch with real datasets.', rating:5, avatar:'P' },
  { name:'Arjun Mehta',   role:'Full Stack Dev',     text:'Completed 3 courses and now freelancing. The certificates are well-recognized by clients.', rating:5, avatar:'A' },
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses({ limit: 6 })
      .then(r => setCourses(r.data?.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Navbar />
      <HeroSection isAuthenticated={isAuthenticated} user={user} />
      <StatsStrip />
      <CategoriesSection />
      <CoursesSection courses={courses} loading={loading} />
      <FeaturesSection />
      <TestimonialsSection />
      <CtaSection isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
};

/* ── Hero ───────────────────────────────────────────────── */
const HeroSection = ({ isAuthenticated, user }) => (
  <section className="hero-section">
    <div className="container position-relative" style={{ zIndex: 2 }}>
      <div className="row align-items-center g-5">
        {/* Left text */}
        <div className="col-lg-6 el-fade-in-up">
          <div className="hero-badge">🚀 #1 Learning Platform in India</div>
          <h1 className="hero-title mb-4">
            Learn Skills That <span>Define</span> Your Future
          </h1>
          <p className="hero-sub mb-5">
            Access 500+ premium courses from industry experts. Start for free,
            earn certificates, and launch your dream career with EduLearn.
          </p>
          <div className="d-flex flex-wrap gap-3">
            <Link to="/courses" className="btn-gold btn-lg">
              <i className="bi bi-play-circle-fill"></i> Explore Courses
            </Link>
            {!isAuthenticated ? (
              <Link to="/register" className="btn-outline-gold btn-lg">
                <i className="bi bi-person-plus-fill"></i> Join Free
              </Link>
            ) : (
              <Link to={`/${user?.role === 'admin' ? 'admin' : user?.role === 'instructor' ? 'instructor' : 'student'}`} className="btn-outline-gold btn-lg">
                <i className="bi bi-speedometer2"></i> My Dashboard
              </Link>
            )}
          </div>
          <div className="d-flex gap-3 mt-4" style={{ color: 'rgba(255,255,255,.65)', fontSize: '.88rem' }}>
            {['No credit card required','Free courses available','Cancel anytime'].map((t,i) => (
              <span key={i}><i className="bi bi-check-circle-fill me-1" style={{ color:'#00c9a7' }}></i>{t}</span>
            ))}
          </div>
        </div>

        {/* Right stat cards */}
        <div className="col-lg-6 el-fade-in-up el-d2">
          <div className="row g-3 mb-3">
            {[
              { num:'50K+',  label:'Active Students'  },
              { num:'500+',  label:'Expert Courses'   },
              { num:'200+',  label:'Top Instructors'  },
              { num:'98%',   label:'Success Rate'     },
            ].map((s, i) => (
              <div key={i} className="col-6">
                <div className="h-stat">
                  <div className="h-stat-num">{s.num}</div>
                  <div className="h-stat-lbl">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Social proof bar */}
          <div className="p-4 rounded-4" style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', backdropFilter:'blur(12px)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex">
                {['A','B','C','D','E'].map((l,i) => (
                  <div key={i} style={{ width:34,height:34,borderRadius:'50%',background:`hsl(${i*50},65%,55%)`,border:'2px solid #fff',marginLeft:i?'-10px':0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.78rem',fontWeight:700 }}>{l}</div>
                ))}
              </div>
              <div style={{ color:'rgba(255,255,255,.8)', fontSize:'.88rem' }}>
                <strong style={{ color:'#fff' }}>49,000+ students</strong> enrolled this month
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ── Stats Strip ─────────────────────────────────────────── */
const StatsStrip = () => {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{ background:'#fff', boxShadow:'0 2px 20px rgba(0,0,0,.08)', padding:'28px 0' }}>
      <div className="container">
        <div className="row g-3 text-center">
          {[
            { icon:'bi-people-fill', val:'50,000+', lbl:'Learners', c:'#0d6efd' },
            { icon:'bi-collection-fill', val:'500+', lbl:'Courses', c:'#f0a500' },
            { icon:'bi-star-fill', val:'4.9/5', lbl:'Avg Rating', c:'#e91e63' },
            { icon:'bi-award-fill', val:'12,000+', lbl:'Certificates Issued', c:'#00c9a7' },
          ].map((s,i) => (
            <div key={i} className={`col-md-3 col-6 ${vis ? `el-bounce-in el-d${i+1}` : ''}`}>
              <i className={`bi ${s.icon} d-block mb-2`} style={{ fontSize:'1.8rem', color:s.c }}></i>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--el-primary)' }}>{s.val}</div>
              <div style={{ fontSize:'.82rem', color:'var(--el-muted)', fontWeight:500 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Categories ──────────────────────────────────────────── */
const CategoriesSection = () => {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} style={{ background:'var(--el-bg)', padding:'72px 0' }}>
      <div className="container">
        <div className="sec-header">
          <h2>Browse by Category</h2>
          <div className="sec-divider"></div>
          <p>Find the perfect course in your area of interest</p>
        </div>
        <div className="row g-3">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className={`col-lg-2 col-md-4 col-6 ${vis ? `el-fade-in-up el-d${Math.min(i+1,5)}` : ''}`}>
              <Link to={`/courses?category=${encodeURIComponent(cat.name)}`} style={{ textDecoration:'none' }}>
                <div className="text-center p-4 rounded-3 h-100 el-hover" style={{ border:`2px solid ${cat.color}20`, background:`${cat.color}08`, cursor:'pointer' }}>
                  <i className={`bi ${cat.icon} d-block mb-3`} style={{ fontSize:'2rem', color:cat.color }}></i>
                  <div style={{ fontWeight:600, color:'var(--el-primary)', fontSize:'.84rem', lineHeight:1.3 }}>{cat.name}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── Featured Courses ────────────────────────────────────── */
const CoursesSection = ({ courses, loading }) => {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} style={{ background:'#fff', padding:'72px 0' }}>
      <div className="container">
        <div className="sec-header">
          <h2>Featured Courses</h2>
          <div className="sec-divider"></div>
          <p>Handpicked by our experts — start learning today</p>
        </div>
        {loading ? (
          <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-collection d-block mb-3" style={{ fontSize:'3rem', color:'#ddd' }}></i>
            <p className="text-muted">No courses yet. Check back soon!</p>
          </div>
        ) : (
          <div className="row g-4">
            {courses.map((course, i) => (
              <div key={course._id} className={`col-lg-4 col-md-6 ${vis ? `el-fade-in-up el-d${Math.min(i+1,5)}` : ''}`}>
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-5">
          <Link to="/courses" className="btn-gold btn-lg px-5">
            View All Courses <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ── Why Choose Us ───────────────────────────────────────── */
const FeaturesSection = () => {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} style={{ background:'var(--el-bg)', padding:'72px 0' }}>
      <div className="container">
        <div className="sec-header">
          <h2>Why Choose EduLearn?</h2>
          <div className="sec-divider"></div>
          <p>Everything you need to succeed in your learning journey</p>
        </div>
        <div className="row g-4">
          {FEATURES.map((f, i) => (
            <div key={i} className={`col-lg-4 col-md-6 ${vis ? `el-fade-in-up el-d${Math.min(i+1,5)}` : ''}`}>
              <div className="el-card h-100 el-hover d-flex gap-4">
                <div style={{ width:55,height:55,borderRadius:'14px',background:`${f.color}14`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'var(--tr)' }}>
                  <i className={`bi ${f.icon}`} style={{ fontSize:'1.5rem', color:f.color }}></i>
                </div>
                <div>
                  <h5 style={{ color:'var(--el-primary)', fontWeight:700, marginBottom:8 }}>{f.title}</h5>
                  <p className="mb-0" style={{ color:'var(--el-muted)', fontSize:'.9rem', lineHeight:1.7 }}>{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── Testimonials ────────────────────────────────────────── */
const TestimonialsSection = () => {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} style={{ background:'var(--g-primary)', padding:'72px 0' }}>
      <div className="container">
        <div className="sec-header">
          <h2 style={{ color:'#fff' }}>What Students Say</h2>
          <div className="sec-divider"></div>
          <p style={{ color:'rgba(255,255,255,.7)' }}>Real success stories from our learners</p>
        </div>
        <div className="row g-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={`col-lg-4 ${vis ? `el-fade-in-up el-d${i+1}` : ''}`}>
              <div className="h-100 p-4 rounded-4" style={{ background:'rgba(255,255,255,.09)', border:'1px solid rgba(255,255,255,.15)', backdropFilter:'blur(10px)' }}>
                {/* Stars */}
                <div className="mb-3">
                  {Array.from({length:t.rating}).map((_,j)=><i key={j} className="bi bi-star-fill" style={{ color:'#f0a500', fontSize:'.9rem' }}></i>)}
                </div>
                <p style={{ color:'rgba(255,255,255,.88)', fontStyle:'italic', lineHeight:1.75 }}>"{t.text}"</p>
                <div className="d-flex align-items-center gap-3 mt-4">
                  <div style={{ width:44,height:44,borderRadius:'50%',background:'var(--g-accent)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'1.1rem' }}>{t.avatar}</div>
                  <div>
                    <div style={{ color:'#fff', fontWeight:600 }}>{t.name}</div>
                    <div style={{ color:'var(--el-accent)', fontSize:'.82rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── CTA Banner ──────────────────────────────────────────── */
const CtaSection = ({ isAuthenticated }) => (
  <section style={{ background:'#fff', padding:'72px 0' }}>
    <div className="container">
      <div className="text-center p-5 rounded-4" style={{ background:'var(--g-primary)' }}>
        <div style={{ fontSize:'3rem', marginBottom:12 }}>🎓</div>
        <h2 style={{ color:'#fff', fontSize:'2.1rem', fontWeight:800 }}>Ready to Start Learning?</h2>
        <p style={{ color:'rgba(255,255,255,.75)', fontSize:'1.05rem', maxWidth:480, margin:'16px auto' }}>
          Join 50,000+ learners transforming their careers with EduLearn.
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="btn-gold btn-lg px-5">Get Started Free</Link>
              <Link to="/courses" className="btn-outline-gold btn-lg px-5">Browse Courses</Link>
            </>
          ) : (
            <Link to="/courses" className="btn-gold btn-lg px-5">Browse All Courses</Link>
          )}
        </div>
        <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.82rem', marginTop:16 }}>
          📞 +91 000000000  |  ✉️ yourgmail@gmail.com
        </p>
      </div>
    </div>
  </section>
);

export default HomePage;
