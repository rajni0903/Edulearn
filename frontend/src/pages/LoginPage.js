/**
 * LoginPage — Fixed CSS, uses el-* classes from index.css
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setL]     = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');
    setL(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin')      navigate('/admin');
      else if (user.role === 'instructor') navigate('/instructor');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setL(false); }
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Brand */}
        <div className="text-center mb-4 el-fade-in-down">
          <Link to="/" style={{ textDecoration:'none' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:800, color:'#f0a500' }}>
              <i className="bi bi-mortarboard-fill me-2"></i>EduLearn
            </div>
          </Link>
          <p style={{ color:'rgba(255,255,255,.6)', marginTop:4, fontSize:'.9rem' }}>Online Learning Platform</p>
        </div>

        <div className="auth-card el-scale-in">
          <h2 className="auth-title mb-1">Welcome Back! 👋</h2>
          <p style={{ color:'var(--el-muted)', marginBottom:28, fontSize:'.9rem' }}>Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Email Address</label>
              <div className="input-wrap">
                <i className="bi bi-envelope icon-l"></i>
                <input type="email" className="el-input" placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required
                  style={{ paddingLeft: 40 }} />
              </div>
            </div>
            <div className="mb-4">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Password</label>
              <div className="input-wrap position-relative">
                <i className="bi bi-lock icon-l"></i>
                <input type={showPw ? 'text' : 'password'} className="el-input" placeholder="Enter password"
                  value={form.password} onChange={e => set('password', e.target.value)} required
                  style={{ paddingLeft: 40, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#adb5bd', cursor:'pointer' }}>
                  <i className={`bi bi-eye${showPw ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-100" style={{ justifyContent:'center', padding:'12px' }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
                : <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
              }
            </button>
          </form>

          <div className="text-center mt-4">
            <span style={{ color:'var(--el-muted)', fontSize:'.9rem' }}>Don't have an account? </span>
            <Link to="/register" style={{ color:'var(--el-accent)', fontWeight:600 }}>Create Account</Link>
          </div>
        </div>

        <p className="text-center mt-3" style={{ color:'rgba(255,255,255,.35)', fontSize:'.78rem' }}>
          © 2024 EduLearn | +91 000000000 | yourgmail@gmail.com
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
