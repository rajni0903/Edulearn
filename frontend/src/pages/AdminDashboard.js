/**
 * AdminDashboard - Full CRUD: Users, Instructors, Quizzes, Assignments, Courses
 * Real MongoDB data — no static content
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar  from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  getAdminStats, getAdminUsers, adminCreateUser, adminUpdateUser,
  toggleUserStatus, deleteUser, getPendingInstructors, approveInstructor,
  getAdminCourses, adminDeleteCourse, getAdminEnrollments,
  getAdminQuizzes, adminUpdateQuiz, adminDeleteQuiz,
  getAdminAssignments, adminUpdateAssignment, adminDeleteAssignment,
  getAdminCategories, createCategory, updateCategory, deleteCategory,
} from '../services/api';

const em = (e, fb='Failed') => e?.isNetworkError ? 'Network error — backend connect nahi ho pa raha' : (e?.response?.data?.message || e?.message || fb);

const RoleChip = ({ role }) => {
  const m = { admin:['pill-red','Admin'], instructor:['pill-blue','Instructor'], student:['pill-green','Student'] };
  const [cls, lbl] = m[role] || ['pill-gray', role];
  return <span className={`el-pill ${cls}`}>{lbl}</span>;
};
const StatusChip = ({ status }) => {
  const m = { approved:['pill-green','Approved'], pending:['pill-orange','Pending'], rejected:['pill-red','Rejected'] };
  const [cls, lbl] = m[status] || ['pill-gray', status || '—'];
  return <span className={`el-pill ${cls}`}>{lbl}</span>;
};
const Av = ({ name, role, size = 36 }) => {
  const bg = { admin:'linear-gradient(135deg,#e74c3c,#c0392b)', instructor:'linear-gradient(135deg,#3498db,#2980b9)', student:'linear-gradient(135deg,#f0a500,#e67e22)' }[role] || 'var(--g-accent)';
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:size*.36, flexShrink:0 }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user }  = useAuth();
  const [section, setSection] = useState('');
  const [stats, setStats]     = useState(null);
  const [loadingStats, setLS] = useState(true);
  const [sidebarOpen, setSBO] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const r = await getAdminStats();
      if (r.data?.success) setStats(r.data);
    } catch (e) {
      const msg = e?.isNetworkError
        ? 'Network error — server se connect nahi ho pa raha. Check your connection.'
        : 'Stats error: ' + em(e);
      toast.error(msg);
      // Network error pe stats null nahi karenge — existing data safe rahe
    }
    finally { setLS(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const renderSection = () => {
    switch (section) {
      case 'users':       return <UsersSection onMutation={fetchStats} />;
      case 'approvals':   return <ApprovalsSection onMutation={fetchStats} />;
      case 'courses':     return <CoursesSection />;
      case 'enrollments': return <EnrollmentsSection />;
      case 'quizzes':     return <QuizzesSection />;
      case 'assignments': return <AssignmentsSection />;
      case 'categories':  return <CategoriesSection />;
      case 'analytics':   return <AnalyticsSection stats={stats} />;
      default:            return <Overview stats={stats} loading={loadingStats} user={user} setSection={setSection} />;
    }
  };

  return (
    <div style={{ background:'var(--el-bg)', minHeight:'100vh' }}>
      <Navbar />
      <Sidebar activeSection={section} setActiveSection={s => { setSection(s); setSBO(false); }} sidebarOpen={sidebarOpen} />
      <button className="d-lg-none sidebar-toggle-btn" onClick={() => setSBO(!sidebarOpen)}>
        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSBO(false)} />}
      <div className="dashboard-content">{renderSection()}</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════════════════════ */
const Overview = ({ stats, loading, user, setSection }) => {
  if (loading) return (
    <div className="text-center py-5">
      <div className="el-spinner mx-auto mb-3"></div>
      <p style={{ color:'var(--el-muted)' }}>Loading dashboard…</p>
    </div>
  );
  const s = stats?.stats || {};
  const widgets = [
    { l:'Total Users',       v:s.totalUsers||0,           i:'bi-people-fill',        c:'sw-blue',   sec:'users'       },
    { l:'Total Courses',     v:s.totalCourses||0,          i:'bi-collection-fill',    c:'sw-orange', sec:'courses'     },
    { l:'Enrollments',       v:s.totalEnrollments||0,      i:'bi-journal-check',      c:'sw-green',  sec:'enrollments' },
    { l:'Pending Approvals', v:s.pendingInstructors||0,    i:'bi-person-exclamation', c:'sw-red',    sec:'approvals'   },
  ];

  return (
    <div className="el-fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-800 mb-1">Admin Dashboard 🛡️</h2>
          <p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.88rem' }}>Logged as <strong>{user?.email}</strong></p>
        </div>
        {s.pendingInstructors > 0 && (
          <button onClick={() => setSection('approvals')} className="btn-gold"
            style={{ background:'var(--g-danger)', animation:'pulse 2s infinite' }}>
            <i className="bi bi-bell-fill"></i> {s.pendingInstructors} Pending Approvals
          </button>
        )}
      </div>

      {/* Main widgets */}
      <div className="row g-4 mb-4">
        {widgets.map((w, i) => (
          <div key={i} className={`col-6 col-md-6 col-xl-3 el-fade-in-up el-d${i+1}`}>
            <div className={`stat-widget ${w.c}`} onClick={() => setSection(w.sec)} style={{ cursor:'pointer' }}>
              <div className="sw-icon"><i className={`bi ${w.i}`}></i></div>
              <div className="sw-num">{w.v.toLocaleString()}</div>
              <div className="sw-label">{w.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="row g-3 mb-4">
        {[
          { l:'Students',       v:s.totalStudents||0,      c:'#00c9a7', i:'bi-mortarboard'       },
          { l:'Instructors',    v:s.totalInstructors||0,   c:'#3498db', i:'bi-person-badge'      },
          { l:'Quizzes',        v:s.totalQuizzes||0,       c:'#f0a500', i:'bi-question-circle'   },
          { l:'Assignments',    v:s.totalAssignments||0,   c:'#9b59b6', i:'bi-file-earmark-text' },
        ].map((m, i) => (
          <div key={i} className={`col-md-3 col-6 el-scale-in el-d${i+1}`}>
            <div className="el-card text-center py-3 el-hover">
              <i className={`bi ${m.i}`} style={{ fontSize:'1.55rem', color:m.c }}></i>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--el-primary)', marginTop:6 }}>{m.v.toLocaleString()}</div>
              <div style={{ fontSize:'.76rem', color:'var(--el-muted)', fontWeight:500 }}>{m.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent tables */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6 el-fade-in-left">
          <div className="el-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-700 mb-0"><i className="bi bi-people me-2" style={{ color:'var(--el-accent)' }}></i>Recent Users</h5>
              <button onClick={() => setSection('users')} className="btn-outline-gold" style={{ padding:'5px 14px', fontSize:'.78rem' }}>View All</button>
            </div>
            {!stats?.recentUsers?.length ? <p style={{ color:'var(--el-muted)' }}>No users yet</p> :
              stats.recentUsers.map((u, i) => (
                <div key={u._id} className={`d-flex align-items-center gap-3 mb-3 pb-3 el-fade-in el-d${i+1}`} style={{ borderBottom:'1px solid #f0f0f0' }}>
                  <Av name={u.name} role={u.role} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="fw-600" style={{ fontSize:'.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize:'.76rem', color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <RoleChip role={u.role} />
                    {u.role === 'instructor' && u.status !== 'approved' && <StatusChip status={u.status} />}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <div className="col-lg-6 el-fade-in-right">
          <div className="el-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-700 mb-0"><i className="bi bi-collection me-2" style={{ color:'var(--el-accent)' }}></i>Recent Courses</h5>
              <button onClick={() => setSection('courses')} className="btn-outline-gold" style={{ padding:'5px 14px', fontSize:'.78rem' }}>View All</button>
            </div>
            {!stats?.recentCourses?.length ? <p style={{ color:'var(--el-muted)' }}>No courses yet</p> :
              stats.recentCourses.map((c, i) => (
                <div key={c._id} className={`d-flex align-items-center gap-3 mb-3 pb-3 el-fade-in el-d${i+1}`} style={{ borderBottom:'1px solid #f0f0f0' }}>
                  {c.thumbnail
                    ? <img src={c.thumbnail} alt="" style={{ width:52, height:38, borderRadius:8, objectFit:'cover', flexShrink:0 }} onError={e => e.target.style.display='none'} />
                    : <div style={{ width:52, height:38, borderRadius:8, background:'var(--g-primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><i className="bi bi-book" style={{ color:'var(--el-accent)' }}></i></div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="fw-600" style={{ fontSize:'.86rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize:'.76rem', color:'#888' }}>{c.instructorId?.name || '—'}</div>
                  </div>
                  <span className={`badge-${c.level?.toLowerCase()}`}>{c.level}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="el-card">
        <h5 className="fw-700 mb-3"><i className="bi bi-lightning-charge-fill me-2" style={{ color:'var(--el-accent)' }}></i>Quick Actions</h5>
        <div className="d-flex gap-3 flex-wrap">
          {[
            { l:'Add User',       i:'bi-person-plus',     s:'users',       c:'#3498db' },
            { l:'Approvals',      i:'bi-person-check',    s:'approvals',   c:'#00c9a7' },
            { l:'Courses',        i:'bi-collection',      s:'courses',     c:'#f0a500' },
            { l:'Categories',     i:'bi-grid-3x3-gap',    s:'categories',  c:'#8e44ad' },
            { l:'Quizzes',        i:'bi-question-circle', s:'quizzes',     c:'#9b59b6' },
            { l:'Assignments',    i:'bi-file-earmark',    s:'assignments', c:'#e74c3c' },
            { l:'Enrollments',    i:'bi-journal-check',   s:'enrollments', c:'#e91e63' },
            { l:'Analytics',      i:'bi-bar-chart-fill',  s:'analytics',   c:'#ff5722' },
          ].map((b, i) => (
            <button key={i} onClick={() => setSection(b.s)}
              style={{ border:`2px solid ${b.c}28`, background:`${b.c}0a`, color:b.c, borderRadius:'var(--r-md)', padding:'8px 18px', fontWeight:600, fontSize:'.85rem', fontFamily:'Poppins,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', gap:7, transition:'var(--tr)' }}
              onMouseOver={e => { e.currentTarget.style.background=`${b.c}1a`; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseOut={e  => { e.currentTarget.style.background=`${b.c}0a`; e.currentTarget.style.transform='translateY(0)'; }}>
              <i className={`bi ${b.i}`}></i>{b.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   USERS SECTION — full CRUD
═══════════════════════════════════════════════════════════ */
const UsersSection = ({ onMutation }) => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleF, setRoleF]     = useState('');
  const [statusF, setStatusF] = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleting, setDel]    = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, limit:15 };
      if (search)  p.search = search;
      if (roleF)   p.role   = roleF;
      if (statusF) p.status = statusF;
      const r = await getAdminUsers(p);
      setUsers(r.data?.users || []);
      setTotal(r.data?.total || 0);
      setPages(r.data?.pages || 1);
    } catch (e) { toast.error(em(e)); }
    finally { setLoading(false); }
  }, [page, search, roleF, statusF]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleF, statusF]);

  const handleToggle = async u => {
    try {
      await toggleUserStatus(u._id);
      setUsers(p => p.map(x => x._id === u._id ? { ...x, isActive:!x.isActive } : x));
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
    } catch (e) { toast.error(em(e)); }
  };

  const handleDelete = async u => {
    if (!window.confirm(`Delete "${u.name}" permanently?`)) return;
    setDel(u._id);
    try {
      await deleteUser(u._id);
      setUsers(p => p.filter(x => x._id !== u._id));
      setTotal(p => p - 1);
      toast.success('User deleted');
      onMutation();
    } catch (e) { toast.error(em(e)); }
    finally { setDel(null); }
  };

  return (
    <div className="el-fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-800 mb-1">Manage Users</h3>
          <p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.85rem' }}>{total.toLocaleString()} accounts</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}><i className="bi bi-person-plus-fill"></i> Add User</button>
      </div>

      {/* Filters */}
      <div className="el-card mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <div className="input-wrap">
              <i className="bi bi-search icon-l"></i>
              <input className="el-input" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:40 }} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="el-input" value={roleF} onChange={e => setRoleF(e.target.value)}>
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="el-input" value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-2">
            <button onClick={() => { setSearch(''); setRoleF(''); setStatusF(''); }} className="btn-outline-gold w-100" style={{ padding:'11px 0', justifyContent:'center' }}>
              <i className="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div> : (
        <>
          <div className="el-table">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Approval</th><th>Account</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0
                  ? <tr><td colSpan="7" className="text-center py-5" style={{ color:'var(--el-muted)' }}>No users found</td></tr>
                  : users.map((u, i) => (
                    <tr key={u._id} className={`el-fade-in el-d${Math.min(i+1,5)}`}>
                      <td><div className="d-flex align-items-center gap-2"><Av name={u.name} role={u.role} size={34} /><span className="fw-600" style={{ fontSize:'.86rem' }}>{u.name}</span></div></td>
                      <td style={{ color:'#666', fontSize:'.83rem' }}>{u.email}</td>
                      <td><RoleChip role={u.role} /></td>
                      <td>{u.role === 'instructor' ? <StatusChip status={u.status} /> : <span style={{ color:'#bbb' }}>—</span>}</td>
                      <td><span style={{ color:u.isActive?'#00b894':'#e74c3c', fontWeight:700, fontSize:'.82rem' }}>{u.isActive ? '● Active' : '○ Inactive'}</span></td>
                      <td style={{ fontSize:'.81rem', color:'#888' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="d-flex gap-1 align-items-center">
                          <button className="btn-act edit" title="Edit" onClick={() => setEditRow(u)}><i className="bi bi-pencil-fill"></i></button>
                          <button title={u.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(u)}
                            style={{ height:34, borderRadius:'var(--r-sm)', border:'none', cursor:'pointer', padding:'0 10px', fontWeight:700, fontSize:'.76rem', fontFamily:'Poppins,sans-serif', transition:'var(--tr)',
                              color:u.isActive?'#e74c3c':'#00c9a7', background:u.isActive?'rgba(231,76,60,.1)':'rgba(0,201,167,.1)' }}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn-act del" title="Delete" onClick={() => handleDelete(u)} disabled={deleting === u._id}>
                            {deleting === u._id ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-trash3-fill"></i>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                style={{ border:'2px solid #e9ecef', borderRadius:'var(--r-md)', padding:'7px 16px', background:'#fff', cursor:page===1?'not-allowed':'pointer' }}>
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length:Math.min(pages,7) }, (_, i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ border:`2px solid ${page===p?'var(--el-accent)':'#e9ecef'}`, background:page===p?'var(--el-accent)':'#fff', color:page===p?'#fff':'#333', borderRadius:'var(--r-md)', padding:'7px 14px', fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
                style={{ border:'2px solid #e9ecef', borderRadius:'var(--r-md)', padding:'7px 16px', background:'#fff', cursor:page===pages?'not-allowed':'pointer' }}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {showAdd && <UserModal onClose={() => setShowAdd(false)} onSuccess={u => { setUsers(p=>[u,...p]); setTotal(p=>p+1); setShowAdd(false); onMutation(); }} />}
      {editRow  && <UserModal initial={editRow} onClose={() => setEditRow(null)} onSuccess={u => { setUsers(p=>p.map(x=>x._id===u._id?u:x)); setEditRow(null); }} />}
    </div>
  );
};

/* ── User Add/Edit Modal ─────────────────────────────────── */
const UserModal = ({ initial, onClose, onSuccess }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:     initial?.name     || '',
    email:    initial?.email    || '',
    password: '',
    role:     initial?.role     || 'student',
    status:   initial?.status   || 'approved',
    isActive: initial?.isActive !== undefined ? initial.isActive : true,
  });
  const [saving, setSaving] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]:v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    if (!isEdit && !form.password) return toast.error('Password required for new users');
    if (form.password && form.password.length < 6) return toast.error('Password min 6 chars');
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        const p = { name:form.name, email:form.email, role:form.role, status:form.status, isActive:form.isActive };
        if (form.password) p.password = form.password;
        res = await adminUpdateUser(initial._id, p);
      } else {
        res = await adminCreateUser(form);
      }
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success(res.data.message || (isEdit ? 'Updated!' : 'Created!'));
      onSuccess(res.data.user);
    } catch (e) { toast.error(em(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="el-modal-overlay">
      <div className="el-modal-box el-scale-in">
        <div className="el-modal-hdr">
          <h5><i className={`bi ${isEdit?'bi-pencil-fill':'bi-person-plus-fill'} me-2`}></i>{isEdit ? 'Edit User' : 'Add New User'}</h5>
          <button className="el-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="el-modal-body">
            {/* Role */}
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Role</label>
              <div className="d-flex gap-2">
                {[['student','🎓','Student'],['instructor','👨‍🏫','Instructor'],['admin','🛡️','Admin']].map(([val,ico,lbl]) => (
                  <label key={val} style={{ flex:1, textAlign:'center', border:`2px solid ${form.role===val?'var(--el-accent)':'#e9ecef'}`, borderRadius:'var(--r-md)', padding:'10px 6px', cursor:'pointer', background:form.role===val?'rgba(240,165,0,.08)':'#fff', transition:'var(--tr)' }}>
                    <input type="radio" name="modal-role" value={val} checked={form.role===val} onChange={e => set('role',e.target.value)} className="d-none" />
                    <div style={{ fontSize:'1.3rem' }}>{ico}</div>
                    <div style={{ fontWeight:700, fontSize:'.78rem', color:form.role===val?'var(--el-accent)':'#333' }}>{lbl}</div>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Full Name *</label>
              <input className="el-input" value={form.name} onChange={e => set('name',e.target.value)} required placeholder="Enter full name" />
            </div>
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Email *</label>
              <input type="email" className="el-input" value={form.email} onChange={e => set('email',e.target.value)} required placeholder="Enter email" />
            </div>
            <div className="mb-3">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>
                Password {isEdit && <span style={{ color:'#999', fontWeight:400 }}>(leave blank to keep)</span>}
              </label>
              <input type="password" className="el-input" value={form.password} onChange={e => set('password',e.target.value)} placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'} {...(!isEdit && { required:true, minLength:6 })} />
            </div>
            <div className="row g-3">
              <div className="col-6">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Status</label>
                <select className="el-input" value={form.status} onChange={e => set('status',e.target.value)}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="col-6">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Account</label>
                <select className="el-input" value={String(form.isActive)} onChange={e => set('isActive', e.target.value==='true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="el-modal-footer">
            <button type="button" onClick={onClose} className="btn-outline-gold" style={{ padding:'9px 22px' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-gold" style={{ padding:'9px 28px' }}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : <><i className={`bi ${isEdit?'bi-check-circle':'bi-person-check'} me-2`}></i>{isEdit?'Save Changes':'Create User'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   APPROVALS
═══════════════════════════════════════════════════════════ */
const ApprovalsSection = ({ onMutation }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proc, setProc]       = useState(null);

  useEffect(() => {
    getPendingInstructors()
      .then(r => setPending(r.data?.instructors || []))
      .catch(e => toast.error(em(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action, name) => {
    setProc(id);
    try {
      const r = await approveInstructor(id, action);
      setPending(p => p.filter(u => u._id !== id));
      toast.success(r.data?.message || `${name} ${action}d`);
      onMutation();
    } catch (e) { toast.error(em(e)); }
    finally { setProc(null); }
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-4">Instructor Approvals ({pending.length})</h3>
      {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div>
        : pending.length === 0
          ? <div className="el-card text-center py-5 el-bounce-in"><div style={{ fontSize:'3.5rem', marginBottom:12 }}>✅</div><h4 className="fw-700">All Clear!</h4><p style={{ color:'var(--el-muted)' }}>No pending requests.</p></div>
          : <div className="d-flex flex-column gap-3">
              {pending.map((inst, i) => (
                <div key={inst._id} className={`el-card el-fade-in-up el-d${Math.min(i+1,5)}`} style={{ borderLeft:'4px solid var(--el-accent)', boxShadow:'var(--sh-md)' }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <Av name={inst.name} role="instructor" size={52} />
                      <div>
                        <h5 className="fw-700 mb-1">{inst.name}</h5>
                        <div style={{ color:'#666', fontSize:'.86rem' }}><i className="bi bi-envelope me-1"></i>{inst.email}</div>
                        <div style={{ color:'#999', fontSize:'.8rem' }}>Registered {new Date(inst.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button onClick={() => handleAction(inst._id,'approve',inst.name)} disabled={proc===inst._id}
                        className="btn-gold" style={{ background:'var(--g-success)', padding:'10px 22px' }}>
                        {proc===inst._id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-circle"></i> Approve</>}
                      </button>
                      <button onClick={() => handleAction(inst._id,'reject',inst.name)} disabled={proc===inst._id}
                        style={{ border:'2px solid #e74c3c', color:'#e74c3c', borderRadius:'var(--r-md)', padding:'10px 22px', background:'rgba(231,76,60,.06)', cursor:'pointer', fontWeight:600, fontFamily:'Poppins,sans-serif', fontSize:'.93rem', transition:'var(--tr)' }}
                        onMouseOver={e => e.currentTarget.style.background='rgba(231,76,60,.16)'}
                        onMouseOut={e  => e.currentTarget.style.background='rgba(231,76,60,.06)'}>
                        <i className="bi bi-x-circle me-2"></i>Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COURSES
═══════════════════════════════════════════════════════════ */
const CoursesSection = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [total, setTotal]     = useState(0);
  const [deleting, setDel]    = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAdminCourses({ search, page:1, limit:20 });
      setCourses(r.data?.courses || []);
      setTotal(r.data?.total || 0);
    } catch (e) { toast.error(em(e)); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleDelete = async c => {
    if (!window.confirm(`Delete "${c.title}" and all its enrollments?`)) return;
    setDel(c._id);
    try {
      await adminDeleteCourse(c._id);
      setCourses(p => p.filter(x => x._id !== c._id));
      setTotal(p => p - 1);
      toast.success('Course deleted');
    } catch (e) { toast.error(em(e)); }
    finally { setDel(null); }
  };

  return (
    <div className="el-fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div><h3 className="fw-800 mb-1">Manage Courses</h3><p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.85rem' }}>{total} courses</p></div>
      </div>
      <div className="el-card mb-4">
        <div className="input-wrap" style={{ maxWidth:400 }}>
          <i className="bi bi-search icon-l"></i>
          <input className="el-input" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:40 }} />
        </div>
      </div>
      {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div> : (
        <div className="el-table">
          <table>
            <thead><tr><th>Course</th><th>Instructor</th><th>Level</th><th>Videos</th><th>Students</th><th>Price</th><th>Actions</th></tr></thead>
            <tbody>
              {courses.length===0
                ? <tr><td colSpan="7" className="text-center py-5" style={{ color:'var(--el-muted)' }}>No courses</td></tr>
                : courses.map((c,i) => (
                  <tr key={c._id} className={`el-fade-in el-d${Math.min(i+1,5)}`}>
                    <td><div className="d-flex align-items-center gap-2">
                      {c.thumbnail ? <img src={c.thumbnail} alt="" style={{ width:52,height:36,borderRadius:7,objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                        : <div style={{ width:52,height:36,borderRadius:7,background:'var(--g-primary)',display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-book" style={{ color:'var(--el-accent)' }}></i></div>}
                      <span className="fw-600" style={{ fontSize:'.84rem',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block' }}>{c.title}</span>
                    </div></td>
                    <td style={{ fontSize:'.83rem' }}>{c.instructorId?.name||'—'}</td>
                    <td><span className={`badge-${c.level?.toLowerCase()}`}>{c.level}</span></td>
                    <td><i className="bi bi-camera-video me-1" style={{ color:'var(--el-accent)' }}></i>{c.videos?.length||0}</td>
                    <td><i className="bi bi-people me-1" style={{ color:'#3498db' }}></i>{(c.enrolledStudents||0).toLocaleString()}</td>
                    <td className="fw-700" style={{ color:c.price===0?'#00c9a7':'var(--el-primary)' }}>{c.price===0?'FREE':`₹${c.price?.toLocaleString()}`}</td>
                    <td><div className="d-flex gap-1">
                      <Link to={`/courses/${c._id}`} target="_blank" className="btn-act edit" title="View"><i className="bi bi-eye-fill"></i></Link>
                      <button className="btn-act del" onClick={() => handleDelete(c)} disabled={deleting===c._id}>{deleting===c._id?<span className="spinner-border spinner-border-sm"></span>:<i className="bi bi-trash3-fill"></i>}</button>
                    </div></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   QUIZZES — Edit title/duration, delete
═══════════════════════════════════════════════════════════ */
const QuizzesSection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editQ, setEditQ]     = useState(null);
  const [deleting, setDel]    = useState(null);

  const fetchQ = async () => {
    setLoading(true);
    try { const r = await getAdminQuizzes({ limit:50 }); setQuizzes(r.data?.quizzes||[]); }
    catch (e) { toast.error(em(e)); } finally { setLoading(false); }
  };
  useEffect(() => { fetchQ(); }, []);

  const handleDelete = async q => {
    if (!window.confirm(`Delete quiz "${q.title}"?`)) return;
    setDel(q._id);
    try { await adminDeleteQuiz(q._id); setQuizzes(p => p.filter(x => x._id!==q._id)); toast.success('Quiz deleted'); }
    catch (e) { toast.error(em(e)); } finally { setDel(null); }
  };

  return (
    <div className="el-fade-in-up">
      <div className="mb-4"><h3 className="fw-800 mb-1">Manage Quizzes</h3><p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.85rem' }}>{quizzes.length} quizzes in database</p></div>
      {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div> : (
        <div className="el-table">
          <table>
            <thead><tr><th>Quiz Title</th><th>Course</th><th>Type</th><th>Questions</th><th>Duration</th><th>Pass%</th><th>Actions</th></tr></thead>
            <tbody>
              {quizzes.length===0
                ? <tr><td colSpan="7" className="text-center py-5" style={{ color:'var(--el-muted)' }}>No quizzes yet</td></tr>
                : quizzes.map((q,i) => (
                  <tr key={q._id} className={`el-fade-in el-d${Math.min(i+1,5)}`}>
                    <td>
                      <div className="fw-600" style={{ fontSize:'.86rem' }}>{q.title}</div>
                      {q.titleHindi && <div style={{ fontSize:'.76rem', color:'#888' }}>{q.titleHindi}</div>}
                    </td>
                    <td style={{ fontSize:'.83rem' }}>{q.courseId?.title||'—'}</td>
                    <td><span className={`el-pill ${q.type==='exam'?'pill-red':'pill-blue'}`} style={{ textTransform:'uppercase', fontSize:'.7rem' }}>{q.type}</span></td>
                    <td>{q.questions?.length||0}</td>
                    <td>{q.duration} min</td>
                    <td>{q.type==='exam'?'75':q.passingScore}%</td>
                    <td><div className="d-flex gap-1">
                      <button className="btn-act edit" title="Edit" onClick={() => setEditQ(q)}><i className="bi bi-pencil-fill"></i></button>
                      <button className="btn-act del" title="Delete" onClick={() => handleDelete(q)} disabled={deleting===q._id}>
                        {deleting===q._id?<span className="spinner-border spinner-border-sm"></span>:<i className="bi bi-trash3-fill"></i>}
                      </button>
                    </div></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
      {editQ && (
        <QuizEditModal quiz={editQ} onClose={() => setEditQ(null)}
          onSuccess={updated => { setQuizzes(p => p.map(x=>x._id===updated._id?updated:x)); setEditQ(null); }} />
      )}
    </div>
  );
};

const QuizEditModal = ({ quiz, onClose, onSuccess }) => {
  const [form, setForm] = useState({ title:quiz.title, titleHindi:quiz.titleHindi||'', duration:quiz.duration, passingScore:quiz.passingScore });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await adminUpdateQuiz(quiz._id, form);
      if (!r.data?.success) throw new Error(r.data?.message);
      toast.success('Quiz updated!');
      onSuccess(r.data.quiz);
    } catch (e) { toast.error(em(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="el-modal-overlay">
      <div className="el-modal-box el-scale-in">
        <div className="el-modal-hdr"><h5><i className="bi bi-pencil-fill me-2"></i>Edit Quiz</h5><button className="el-modal-close" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="el-modal-body">
            <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Title (English)</label><input className="el-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></div>
            <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Title (Hindi)</label><input className="el-input" value={form.titleHindi} onChange={e=>setForm({...form,titleHindi:e.target.value})} /></div>
            <div className="row g-3">
              <div className="col-6"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Duration (min)</label><input type="number" className="el-input" value={form.duration} onChange={e=>setForm({...form,duration:+e.target.value})} /></div>
              {quiz.type!=='exam' && <div className="col-6"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Pass %</label><input type="number" className="el-input" value={form.passingScore} onChange={e=>setForm({...form,passingScore:+e.target.value})} /></div>}
            </div>
            <div className="mt-3 p-3 rounded-3" style={{ background:'rgba(240,165,0,.06)', border:'1px solid rgba(240,165,0,.2)', fontSize:'.82rem', color:'#856404' }}>
              <i className="bi bi-info-circle me-2"></i>To edit questions, use the Instructor Dashboard Quiz Builder.
            </div>
          </div>
          <div className="el-modal-footer">
            <button type="button" onClick={onClose} className="btn-outline-gold" style={{ padding:'9px 22px' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-gold" style={{ padding:'9px 28px' }}>
              {saving?<><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>:<><i className="bi bi-check-circle me-2"></i>Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ASSIGNMENTS — Edit title/desc/deadline, delete
═══════════════════════════════════════════════════════════ */
const AssignmentsSection = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editA, setEditA]             = useState(null);
  const [deleting, setDel]            = useState(null);

  const fetchA = async () => {
    setLoading(true);
    try { const r = await getAdminAssignments({ limit:50 }); setAssignments(r.data?.assignments||[]); }
    catch (e) { toast.error(em(e)); } finally { setLoading(false); }
  };
  useEffect(() => { fetchA(); }, []);

  const handleDelete = async a => {
    if (!window.confirm(`Delete assignment "${a.title}"?`)) return;
    setDel(a._id);
    try { await adminDeleteAssignment(a._id); setAssignments(p=>p.filter(x=>x._id!==a._id)); toast.success('Assignment deleted'); }
    catch (e) { toast.error(em(e)); } finally { setDel(null); }
  };

  return (
    <div className="el-fade-in-up">
      <div className="mb-4"><h3 className="fw-800 mb-1">Manage Assignments</h3><p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.85rem' }}>{assignments.length} assignments in database</p></div>
      {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div> : (
        <div className="el-table">
          <table>
            <thead><tr><th>Title</th><th>Course</th><th>Due Date</th><th>Max Marks</th><th>Created By</th><th>Actions</th></tr></thead>
            <tbody>
              {assignments.length===0
                ? <tr><td colSpan="6" className="text-center py-5" style={{ color:'var(--el-muted)' }}>No assignments yet</td></tr>
                : assignments.map((a,i) => (
                  <tr key={a._id} className={`el-fade-in el-d${Math.min(i+1,5)}`}>
                    <td><div className="fw-600" style={{ fontSize:'.86rem' }}>{a.title}</div></td>
                    <td style={{ fontSize:'.83rem' }}>{a.courseId?.title||'—'}</td>
                    <td style={{ fontSize:'.83rem' }}>{new Date(a.dueDate).toLocaleDateString('en-IN')}</td>
                    <td><span className="el-pill pill-blue">{a.maxMarks} pts</span></td>
                    <td style={{ fontSize:'.82rem' }}>{a.createdBy?.name||'—'}</td>
                    <td><div className="d-flex gap-1">
                      <button className="btn-act edit" title="Edit" onClick={() => setEditA(a)}><i className="bi bi-pencil-fill"></i></button>
                      <button className="btn-act del" title="Delete" onClick={() => handleDelete(a)} disabled={deleting===a._id}>
                        {deleting===a._id?<span className="spinner-border spinner-border-sm"></span>:<i className="bi bi-trash3-fill"></i>}
                      </button>
                    </div></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
      {editA && (
        <AssignmentEditModal assignment={editA} onClose={() => setEditA(null)}
          onSuccess={updated => { setAssignments(p=>p.map(x=>x._id===updated._id?updated:x)); setEditA(null); }} />
      )}
    </div>
  );
};

const AssignmentEditModal = ({ assignment, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title:       assignment.title,
    description: assignment.description,
    dueDate:     assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0,16) : '',
    maxMarks:    assignment.maxMarks,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await adminUpdateAssignment(assignment._id, form);
      if (!r.data?.success) throw new Error(r.data?.message);
      toast.success('Assignment updated!');
      onSuccess(r.data.assignment);
    } catch (e) { toast.error(em(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="el-modal-overlay">
      <div className="el-modal-box el-scale-in" style={{ maxWidth:540 }}>
        <div className="el-modal-hdr"><h5><i className="bi bi-pencil-fill me-2"></i>Edit Assignment</h5><button className="el-modal-close" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="el-modal-body">
            <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Title *</label><input className="el-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></div>
            <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Description *</label><textarea className="el-input" rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ resize:'vertical' }} required></textarea></div>
            <div className="row g-3">
              <div className="col-7"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Due Date *</label><input type="datetime-local" className="el-input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} required /></div>
              <div className="col-5"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Max Marks</label><input type="number" className="el-input" value={form.maxMarks} onChange={e=>setForm({...form,maxMarks:+e.target.value})} /></div>
            </div>
          </div>
          <div className="el-modal-footer">
            <button type="button" onClick={onClose} className="btn-outline-gold" style={{ padding:'9px 22px' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-gold" style={{ padding:'9px 28px' }}>
              {saving?<><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>:<><i className="bi bi-check-circle me-2"></i>Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ENROLLMENTS
═══════════════════════════════════════════════════════════ */
const EnrollmentsSection = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);

  useEffect(() => {
    getAdminEnrollments({ limit:50 })
      .then(r => { setEnrollments(r.data?.enrollments||[]); setTotal(r.data?.total||0); })
      .catch(e => toast.error(em(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="el-fade-in-up">
      <div className="mb-4"><h3 className="fw-800 mb-1">All Enrollments</h3><p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.85rem' }}>{total.toLocaleString()} total enrollments</p></div>
      {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div> : (
        <div className="el-table">
          <table>
            <thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Certificate</th><th>Enrolled On</th></tr></thead>
            <tbody>
              {enrollments.length===0
                ? <tr><td colSpan="5" className="text-center py-5" style={{ color:'var(--el-muted)' }}>No enrollments yet</td></tr>
                : enrollments.map((e,i) => (
                  <tr key={e._id} className={`el-fade-in el-d${Math.min(i+1,5)}`}>
                    <td>
                      <div className="fw-600" style={{ fontSize:'.86rem' }}>{e.studentId?.name||'—'}</div>
                      <div style={{ fontSize:'.76rem', color:'#888' }}>{e.studentId?.email||''}</div>
                    </td>
                    <td className="fw-600" style={{ fontSize:'.84rem', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.courseId?.title||'—'}</td>
                    <td style={{ minWidth:120 }}>
                      <div className="d-flex justify-content-between mb-1">
                        <small style={{ fontWeight:700, color:e.progress>=100?'#00c9a7':'var(--el-primary)', fontSize:'.78rem' }}>{e.progress||0}%</small>
                      </div>
                      <div className="el-prog-track"><div className="el-prog-bar" style={{ width:`${e.progress||0}%` }}></div></div>
                    </td>
                    <td>
                      {e.certificateIssued
                        ? <span style={{ color:'#00c9a7', fontWeight:700, fontSize:'.82rem' }}><i className="bi bi-award-fill me-1"></i>Issued</span>
                        : <span style={{ color:'#bbb', fontSize:'.82rem' }}>—</span>}
                    </td>
                    <td style={{ fontSize:'.80rem', color:'#888' }}>{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════════════════ */
const AnalyticsSection = ({ stats }) => {
  const s = stats?.stats || {};
  const cards = [
    { l:'Total Users',          v:s.totalUsers||0,           i:'bi-people-fill',          c:'#3498db'  },
    { l:'Students',             v:s.totalStudents||0,         i:'bi-mortarboard-fill',     c:'#00c9a7'  },
    { l:'Approved Instructors', v:s.totalInstructors||0,      i:'bi-person-badge-fill',    c:'#f0a500'  },
    { l:'Courses',              v:s.totalCourses||0,          i:'bi-collection-fill',      c:'#9b59b6'  },
    { l:'Enrollments',          v:s.totalEnrollments||0,      i:'bi-journal-check',        c:'#e74c3c'  },
    { l:'Submissions',          v:s.totalSubmissions||0,      i:'bi-file-earmark-check',   c:'#e67e22'  },
    { l:'Quizzes',              v:s.totalQuizzes||0,          i:'bi-question-circle-fill', c:'#2980b9'  },
    { l:'Pending Approvals',    v:s.pendingInstructors||0,    i:'bi-person-exclamation',   c:'#f39c12'  },
  ];

  return (
    <div className="el-fade-in-up">
      <div className="mb-4"><h3 className="fw-800 mb-1">Platform Analytics</h3><p style={{ color:'var(--el-muted)', marginBottom:0, fontSize:'.85rem' }}>Real-time data from MongoDB</p></div>
      <div className="row g-4">
        {cards.map((c, i) => (
          <div key={i} className={`col-6 col-md-6 col-lg-3 el-scale-in el-d${Math.min(i+1,5)}`}>
            <div className="el-card text-center el-hover">
              <div style={{ width:62, height:62, borderRadius:18, background:`${c.c}14`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', transition:'var(--tr)' }}
                onMouseOver={e => { e.currentTarget.style.background=`${c.c}28`; e.currentTarget.style.transform='scale(1.12) rotate(-5deg)'; }}
                onMouseOut={e  => { e.currentTarget.style.background=`${c.c}14`; e.currentTarget.style.transform='scale(1)'; }}>
                <i className={`bi ${c.i}`} style={{ fontSize:'1.65rem', color:c.c }}></i>
              </div>
              <div style={{ fontSize:'2rem', fontWeight:800, color:'var(--el-primary)' }}>{c.v.toLocaleString()}</div>
              <div className="fw-600" style={{ color:'var(--el-primary)', fontSize:'.88rem', marginTop:2 }}>{c.l}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CATEGORIES SECTION
   Add / Edit / Delete categories — stored in MongoDB
   Gradient dark-blue/purple card UI with hover effects
═══════════════════════════════════════════════════════════ */
const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm] = useState({ name:'', description:'', color:'#0d6efd', icon:'bi-grid' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const ICON_OPTIONS = ['bi-grid','bi-code-slash','bi-bar-chart-fill','bi-phone','bi-cloud','bi-palette','bi-megaphone','bi-briefcase','bi-camera-video','bi-book'];
  const COLOR_OPTIONS = ['#0d6efd','#6610f2','#d63384','#fd7e14','#198754','#0dcaf0','#e74c3c','#f0a500'];

  const load = async () => {
    setLoading(true);
    try { const r = await getAdminCategories(); setCategories(r.data?.categories || []); }
    catch (e) { toast.error(em(e)); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name required');
    setSaving(true);
    try {
      if (editId) {
        const r = await updateCategory(editId, form);
        if (!r.data?.success) throw new Error(r.data?.message);
        toast.success('Category updated!');
        setCategories(cats => cats.map(c => c._id===editId ? r.data.category : c));
      } else {
        const r = await createCategory(form);
        if (!r.data?.success) throw new Error(r.data?.message);
        toast.success('Category created!');
        setCategories(cats => [r.data.category, ...cats]);
      }
      setForm({ name:'', description:'', color:'#0d6efd', icon:'bi-grid' });
      setEditId(null);
    } catch (e) { toast.error(em(e, 'Save failed')); } finally { setSaving(false); }
  };

  const handleEdit = (cat) => {
    setEditId(cat._id);
    setForm({ name:cat.name, description:cat.description||'', color:cat.color||'#0d6efd', icon:cat.icon||'bi-grid' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Courses using it will keep their category name.')) return;
    try {
      const r = await deleteCategory(id);
      if (!r.data?.success) throw new Error(r.data?.message);
      toast.success('Deleted!');
      setCategories(cats => cats.filter(c => c._id!==id));
    } catch (e) { toast.error(em(e)); }
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-2">🗂️ Category Management</h3>
      <p style={{ color:'var(--el-muted)', marginBottom:28 }}>Categories are linked to courses. Dynamic — no code changes needed.</p>

      <div className="row g-4">
        {/* Create / Edit Form */}
        <div className="col-lg-4">
          <div className="el-card" style={{ background:'linear-gradient(135deg,#1a2744 0%,#2d1b69 100%)',border:'1px solid rgba(240,165,0,.2)',boxShadow:'var(--sh-md)' }}>
            <h5 className="fw-700 mb-4" style={{ color:'#fff' }}>
              {editId ? '✏️ Edit Category' : '➕ New Category'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.85rem',color:'rgba(255,255,255,.75)' }}>Name *</label>
                <input className="el-input" placeholder="e.g. Cybersecurity" value={form.name}
                  onChange={e => setForm({...form,name:e.target.value})} required
                  style={{ background:'rgba(255,255,255,.1)',color:'#fff',border:'1px solid rgba(255,255,255,.2)' }} />
              </div>
              <div className="mb-3">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.85rem',color:'rgba(255,255,255,.75)' }}>Description</label>
                <textarea className="el-input" rows="2" placeholder="Short description…" value={form.description}
                  onChange={e => setForm({...form,description:e.target.value})} style={{ resize:'none',background:'rgba(255,255,255,.1)',color:'#fff',border:'1px solid rgba(255,255,255,.2)' }} />
              </div>
              {/* Color picker */}
              <div className="mb-3">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.85rem',color:'rgba(255,255,255,.75)' }}>Color</label>
                <div className="d-flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form,color:c})}
                      style={{ width:28,height:28,borderRadius:'50%',background:c,border:form.color===c?'3px solid #fff':'2px solid transparent',cursor:'pointer',transition:'all .2s',transform:form.color===c?'scale(1.2)':'scale(1)' }} />
                  ))}
                </div>
              </div>
              {/* Icon picker */}
              <div className="mb-4">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.85rem',color:'rgba(255,255,255,.75)' }}>Icon</label>
                <div className="d-flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm({...form,icon:ic})}
                      style={{ width:36,height:36,borderRadius:8,background:form.icon===ic?'var(--el-accent)':'rgba(255,255,255,.1)',border:'none',color:form.icon===ic?'#fff':'rgba(255,255,255,.7)',cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <i className={`bi ${ic}`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" disabled={saving} className="btn-gold flex-fill" style={{ justifyContent:'center' }}>
                  {saving ? <span className="spinner-border spinner-border-sm"></span> : editId ? 'Update' : 'Create'}
                </button>
                {editId && (
                  <button type="button" onClick={() => { setEditId(null); setForm({name:'',description:'',color:'#0d6efd',icon:'bi-grid'}); }}
                    style={{ border:'1px solid rgba(255,255,255,.3)',borderRadius:'var(--r-md)',background:'transparent',color:'#fff',padding:'0 16px',cursor:'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="col-lg-8">
          {loading ? (
            <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div>
          ) : categories.length === 0 ? (
            <div className="el-card text-center py-5">
              <div style={{ fontSize:'3rem',marginBottom:12 }}>🗂️</div>
              <p style={{ color:'var(--el-muted)' }}>No categories yet. Create the first one!</p>
            </div>
          ) : (
            <div className="row g-3">
              {categories.map((cat,i) => (
                <div key={cat._id} className={`col-md-6 el-fade-in-up el-d${Math.min(i+1,5)}`}>
                  <div className="admin-cat-card">
                    <div className="d-flex align-items-start justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width:42,height:42,borderRadius:12,background:cat.color||'#0d6efd',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          <i className={`bi ${cat.icon||'bi-grid'}`} style={{ fontSize:'1.1rem',color:'#fff' }}></i>
                        </div>
                        <div>
                          <div className="admin-cat-card__name">{cat.name}</div>
                          {cat.description && <div className="admin-cat-card__count">{cat.description}</div>}
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <button className="btn-act edit" onClick={() => handleEdit(cat)} style={{ color:'#f0a500',background:'rgba(240,165,0,.15)' }}>
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button className="btn-act" onClick={() => handleDelete(cat._id)} style={{ color:'#e74c3c',background:'rgba(231,76,60,.15)' }}>
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-3">
                      <span style={{ background:'rgba(255,255,255,.1)',padding:'2px 10px',borderRadius:50,fontSize:'.72rem',color:'rgba(255,255,255,.7)' }}>
                        {cat.isActive ? '● Active' : '○ Inactive'}
                      </span>
                      <small style={{ color:'rgba(255,255,255,.4)',fontSize:'.72rem' }}>
                        {new Date(cat.createdAt).toLocaleDateString('en-IN')}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
