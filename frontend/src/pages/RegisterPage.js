/**
 * RegisterPage — Fixed CSS, uses el-* classes
 * Admin role removed from UI, instructor shows pending note
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'student' });
  const [loading, setL]   = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password min 6 characters');
    setL(true);
    try {
      const result = await register(form.name, form.email, form.password, form.role);
      if (result?.pending) { setPending(true); return; }
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setL(false); }
  };

  // Instructor pending state
  if (pending) return (
    <div className="auth-page">
      <div style={{ maxWidth:480, width:'100%' }}>
        <div className="auth-card el-bounce-in text-center">
          <div style={{ fontSize:'3.5rem', marginBottom:16 }}>⏳</div>
          <h3 className="fw-700 mb-2" style={{ color:'var(--el-primary)' }}>Approval Pending!</h3>
          <p style={{ color:'var(--el-muted)', marginBottom:20 }}>
            Your instructor account is pending admin approval.<br />
            You will be able to login after approval.
          </p>
          <div className="p-3 rounded-3 mb-4" style={{ background:'rgba(240,165,0,.08)', border:'1px solid rgba(240,165,0,.25)', fontSize:'.85rem', color:'#856404' }}>
            <i className="bi bi-envelope-check me-2"></i>
            Contact admin: <strong>rajni9496@gmail.com</strong>
          </div>
          <Link to="/login" className="btn-gold w-100" style={{ justifyContent:'center', padding:'12px' }}>
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div style={{ width:'100%', maxWidth:520 }}>
        <div className="text-center mb-4 el-fade-in-down">
          <Link to="/" style={{ textDecoration:'none' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:800, color:'#f0a500' }}>
              <i className="bi bi-mortarboard-fill me-2"></i>EduLearn
            </div>
          </Link>
          <p style={{ color:'rgba(255,255,255,.6)', marginTop:4, fontSize:'.9rem' }}>Create your free account today</p>
        </div>

        <div className="auth-card el-scale-in">
          <h2 className="auth-title mb-1">Join EduLearn 🚀</h2>
          <p style={{ color:'var(--el-muted)', marginBottom:24, fontSize:'.9rem' }}>Start your learning journey</p>

          <form onSubmit={handleSubmit}>
            {/* Role selector */}
            <div className="mb-4">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>I am a…</label>
              <div className="d-flex gap-2">
                {[['student','🎓','Student','I want to learn'],['instructor','👨‍🏫','Instructor','I want to teach']].map(([val,ico,lbl,sub]) => (
                  <label key={val} style={{ flex:1, textAlign:'center', border:`2px solid ${form.role===val?'var(--el-accent)':'#e9ecef'}`, borderRadius:'var(--r-md)', padding:'10px 6px', cursor:'pointer', background:form.role===val?'rgba(240,165,0,.08)':'#fff', transition:'var(--tr)' }}>
                    <input type="radio" name="role" value={val} checked={form.role===val} onChange={e=>set('role',e.target.value)} className="d-none" />
                    <div style={{ fontSize:'1.4rem' }}>{ico}</div>
                    <div style={{ fontWeight:700, fontSize:'.82rem', color:form.role===val?'var(--el-accent)':'#333' }}>{lbl}</div>
                    <div style={{ fontSize:'.72rem', color:'#999' }}>{sub}</div>
                  </label>
                ))}
              </div>
              {form.role === 'instructor' && (
                <div className="mt-2 p-2 rounded-2" style={{ background:'rgba(240,165,0,.08)', border:'1px solid rgba(240,165,0,.25)', fontSize:'.8rem', color:'#856404' }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Instructor accounts require <strong>Admin approval</strong> before you can login.
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Full Name</label>
              <div className="input-wrap">
                <i className="bi bi-person icon-l"></i>
                <input type="text" className="el-input" placeholder="Enter full name" value={form.name} onChange={e=>set('name',e.target.value)} required style={{ paddingLeft:40 }} />
              </div>
            </div>
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Email Address</label>
              <div className="input-wrap">
                <i className="bi bi-envelope icon-l"></i>
                <input type="email" className="el-input" placeholder="your@email.com" value={form.email} onChange={e=>set('email',e.target.value)} required style={{ paddingLeft:40 }} />
              </div>
            </div>
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Password</label>
              <div className="input-wrap position-relative">
                <i className="bi bi-lock icon-l"></i>
                <input type={showPw?'text':'password'} className="el-input" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} required style={{ paddingLeft:40, paddingRight:44 }} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#adb5bd',cursor:'pointer' }}>
                  <i className={`bi bi-eye${showPw?'-slash':''}`}></i>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Confirm Password</label>
              <div className="input-wrap">
                <i className="bi bi-shield-lock icon-l"></i>
                <input type="password" className="el-input" placeholder="Repeat password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} required
                  style={{ paddingLeft:40, borderColor: form.confirmPassword&&form.confirmPassword!==form.password?'#e74c3c':'' }} />
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <small style={{ color:'#e74c3c' }}>Passwords do not match</small>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-100" style={{ justifyContent:'center', padding:'12px' }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating account…</>
                : <><i className="bi bi-person-check-fill"></i> Create Account</>
              }
            </button>
          </form>

          <div className="text-center mt-4">
            <span style={{ color:'var(--el-muted)', fontSize:'.9rem' }}>Already have an account? </span>
            <Link to="/login" style={{ color:'var(--el-accent)', fontWeight:600 }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
