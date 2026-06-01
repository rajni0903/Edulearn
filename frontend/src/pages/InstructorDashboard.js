/**
 * InstructorDashboard — Updated with:
 *   1. Assignment creation with PDF/Drive link attachment
 *   2. DOCX Quiz Import (mammoth.js parsed on frontend)
 *   3. Student Submissions panel with download + student name/time
 *   4. Category support (dynamic from admin panel)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar  from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  getInstructorCourses, createCourse, addVideo, updateVideo, deleteVideo,
  getInstructorReceived, markSubmissionSeen, gradeSubmission,
  getCourseQuizzes, createQuiz, deleteQuiz, createAssignment,
  getCourseAssignments, deleteAssignment,
  getPublicCategories,
} from '../services/api';

const LEVELS   = ['Beginner','Intermediate','Advanced'];
const errMsg   = (e, fb='Something went wrong') => e?.isNetworkError ? 'Network error — backend connect nahi ho pa raha' : (e?.response?.data?.message || e?.message || fb);

/* ─────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────── */
const InstructorDashboard = () => {
  const { user }    = useAuth();
  const [section, setSection]   = useState('');
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await getInstructorCourses();
      setCourses(res.data?.courses || []);
    } catch (e) {
      const msg = e?.isNetworkError
        ? 'Network error — server se connect nahi ho pa raha. Try again.'
        : 'Failed to load courses: ' + errMsg(e);
      toast.error(msg);
      // Network error pe setCourses([]) NAHI karenge — existing data safe rahe
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const totalStudents = courses.reduce((a, c) => a + (c.enrolledStudents || 0), 0);
  const avgRating = courses.length
    ? (courses.reduce((a, c) => a + (c.rating || 0), 0) / courses.length).toFixed(1)
    : '0.0';

  const widgets = [
    { label:'My Courses',     value:courses.length,                               icon:'bi-collection-fill', cls:'sw-blue'   },
    { label:'Total Students', value:totalStudents,                                 icon:'bi-people-fill',     cls:'sw-orange' },
    { label:'Published',      value:courses.filter(c => c.isPublished).length,    icon:'bi-check-circle-fill',cls:'sw-green' },
    { label:'Avg Rating',     value:avgRating,                                    icon:'bi-star-fill',       cls:'sw-purple' },
  ];

  const renderSection = () => {
    switch (section) {
      case 'create':      return <CreateCourseSection user={user} onSuccess={c => { setCourses(p => [c,...p]); setSection('courses'); toast.success('Course created!'); }} />;
      case 'courses':     return <MyCourses courses={courses} onRefresh={fetchCourses} />;
      case 'videos':      return <ManageVideos courses={courses} onRefresh={fetchCourses} />;
      case 'assignments': return <AssignmentSection courses={courses} />;
      case 'submissions': return <SubmissionsSection />;
      case 'quizzes':     return <QuizSection courses={courses} />;
      case 'analytics':   return <Analytics courses={courses} totalStudents={totalStudents} />;
      case 'profile':     return <InstructorProfile user={user} />;
      default:            return <Overview widgets={widgets} courses={courses} user={user} loading={loading} setSection={setSection} />;
    }
  };

  return (
    <div style={{ background:'var(--el-bg)', minHeight:'100vh' }}>
      <Navbar />
      <Sidebar activeSection={section} setActiveSection={s => { setSection(s); setSidebarOpen(false); }} sidebarOpen={sidebarOpen} />
      <button className="d-lg-none sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="dashboard-content">
        {loading
          ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div>
          : renderSection()
        }
      </div>
    </div>
  );
};

/* ─── Overview ─────────────────────────────────────────────── */
const Overview = ({ widgets, courses, user, setSection }) => (
  <div className="el-fade-in-up">
    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
      <div>
        <h2 className="fw-800 mb-1">Instructor Dashboard 👨‍🏫</h2>
        <p style={{ color:'var(--el-muted)', marginBottom:0 }}>Welcome, {user?.name}</p>
      </div>
      <div className="d-flex gap-2 flex-wrap">
        <button onClick={() => setSection('create')} className="btn-gold">
          <i className="bi bi-plus-circle"></i> Create Course
        </button>
      </div>
    </div>

    <div className="row g-4 mb-5">
      {widgets.map((w, i) => (
        <div key={i} className={`col-6 col-md-6 col-xl-3 el-fade-in-up el-d${i+1}`}>
          <div className={`stat-widget ${w.cls}`}>
            <div className="sw-icon"><i className={`bi ${w.icon}`}></i></div>
            <div className="sw-num">{w.value}</div>
            <div className="sw-label">{w.label}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Quick action buttons */}
    <div className="d-flex gap-3 flex-wrap mb-4">
      {[
        ['videos','bi-camera-video','Manage Videos'],
        ['assignments','bi-file-earmark-text','Create Assignments'],
        ['submissions','bi-inbox','Student Submissions'],
        ['quizzes','bi-question-circle','Manage Quizzes'],
      ].map(([s,ic,lbl]) => (
        <button key={s} onClick={() => setSection(s)} className="btn-outline-gold" style={{ padding:'9px 20px' }}>
          <i className={`bi ${ic} me-2`}></i>{lbl}
        </button>
      ))}
    </div>

    <h4 className="fw-700 mb-4">My Courses</h4>
    {courses.length === 0
      ? <div className="el-card text-center py-5 el-bounce-in">
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🎓</div>
          <h5 className="fw-700">No courses yet</h5>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <button onClick={() => setSection('create')} className="btn-gold">Create First Course</button>
          </div>
        </div>
      : <div className="row g-4">
          {courses.map((c, i) => (
            <div key={c._id} className={`col-lg-6 el-fade-in-up el-d${Math.min(i+1,5)}`}>
              <div className="el-card d-flex gap-3 el-hover" style={{ alignItems:'flex-start' }}>
                <img src={c.thumbnail || 'https://via.placeholder.com/90x65/0a1628/f0a500?text=EL'} alt={c.title}
                  style={{ width:90,height:65,borderRadius:10,objectFit:'cover',flexShrink:0 }}
                  onError={e => { e.target.src='https://via.placeholder.com/90x65/0a1628/f0a500?text=EL'; }} />
                <div style={{ flex:1 }}>
                  <div className="fw-700" style={{ color:'var(--el-primary)',fontSize:'.93rem' }}>{c.title}</div>
                  <div className="d-flex gap-3 mt-1" style={{ fontSize:'.80rem',color:'#777' }}>
                    <span><i className="bi bi-people me-1"></i>{c.enrolledStudents || 0}</span>
                    <span><i className="bi bi-camera-video me-1"></i>{c.videos?.length || 0} videos</span>
                    <span style={{ color:c.isPublished?'#00c9a7':'#e74c3c',fontWeight:700 }}>
                      {c.isPublished ? '● Live' : '○ Draft'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
    }
  </div>
);

/* ─── Create Course (Manual) ────────────────────────────────── */
const CreateCourseSection = ({ user, onSuccess }) => {
  const [form, setForm] = useState({ title:'',description:'',category:'Web Development',level:'Beginner',duration:'',price:0,thumbnail:'' });
  const [videos, setVideos]   = useState([{ title:'',titleHindi:'',youtubeUrl:'',duration:'' }]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getPublicCategories().then(r => {
      const cats = r.data?.categories || [];
      if (cats.length) setCategories(cats.map(c => c.name));
    }).catch(() => {});
  }, []);

  const catList = categories.length
    ? categories
    : ['Web Development','Data Science','Mobile Development','DevOps','Design','Marketing','Business','Other'];

  const addRow    = () => setVideos(v => [...v, { title:'',titleHindi:'',youtubeUrl:'',duration:'' }]);
  const removeRow = i  => setVideos(v => v.filter((_,idx) => idx !== i));
  const updateRow = (i,f,v) => setVideos(prev => { const a=[...prev]; a[i]={...a[i],[f]:v}; return a; });
  const ytId = url => { const m=url.match(/(?:watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m?m[1]:''; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description required');
    setLoading(true);
    try {
      const cleanVids = videos.filter(v => v.title && v.youtubeUrl).map((v,i) => ({...v, order:i+1}));
      const res = await createCourse({...form, videos:cleanVids});
      if (!res.data?.success) throw new Error(res.data?.message);
      onSuccess(res.data.course);
    } catch (e) { toast.error(errMsg(e,'Failed to create course')); }
    finally { setLoading(false); }
  };

  return (
    <div className="el-fade-in-up" style={{ maxWidth:800 }}>
      <h3 className="fw-800 mb-4">Create New Course</h3>
      <div className="el-card" style={{ boxShadow:'var(--sh-md)' }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Course Title *</label>
            <input className="el-input" placeholder="Enter compelling course title" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required />
          </div>
          <div className="mb-3">
            <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Description *</label>
            <textarea className="el-input" rows="4" placeholder="Describe what students will learn…" value={form.description} onChange={e => setForm({...form,description:e.target.value})} style={{ resize:'vertical' }} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Category</label>
              <select className="el-input" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                {catList.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Level</label>
              <select className="el-input" value={form.level} onChange={e => setForm({...form,level:e.target.value})}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Duration</label>
              <input className="el-input" placeholder="e.g. 40 hours" value={form.duration} onChange={e => setForm({...form,duration:e.target.value})} />
            </div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Price (₹) — 0 = Free</label>
              <input type="number" min="0" className="el-input" value={form.price} onChange={e => setForm({...form,price:+e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Thumbnail URL <span style={{ color:'#999',fontWeight:400 }}>(auto from 1st video)</span></label>
              <input className="el-input" placeholder="Leave blank for auto" value={form.thumbnail} onChange={e => setForm({...form,thumbnail:e.target.value})} />
            </div>
          </div>

          {/* Videos */}
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <label className="fw-700" style={{ fontSize:'.95rem' }}>
                <i className="bi bi-camera-video me-2" style={{ color:'var(--el-accent)' }}></i>Course Videos
              </label>
              <button type="button" onClick={addRow} className="btn-outline-gold" style={{ padding:'6px 14px',fontSize:'.82rem' }}>
                <i className="bi bi-plus me-1"></i>Add Part
              </button>
            </div>
            <div className="d-flex flex-column gap-3">
              {videos.map((v,i) => (
                <div key={i} className="p-3 rounded-3 el-scale-in" style={{ background:'#f8f9fa',border:'1px solid #e9ecef' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-700" style={{ color:'var(--el-primary)',fontSize:'.88rem' }}>Part {i+1}</span>
                    {videos.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} style={{ background:'none',border:'none',color:'#e74c3c',cursor:'pointer',fontSize:'1rem' }}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    )}
                  </div>
                  <div className="row g-2">
                    <div className="col-md-5"><input className="el-input" placeholder="Title (English)*" value={v.title} onChange={e => updateRow(i,'title',e.target.value)} /></div>
                    <div className="col-md-4"><input className="el-input" placeholder="शीर्षक (Hindi)" value={v.titleHindi} onChange={e => updateRow(i,'titleHindi',e.target.value)} /></div>
                    <div className="col-md-3"><input className="el-input" placeholder="Duration" value={v.duration} onChange={e => updateRow(i,'duration',e.target.value)} /></div>
                    <div className="col-12">
                      <input className="el-input" placeholder="YouTube URL*" value={v.youtubeUrl} onChange={e => updateRow(i,'youtubeUrl',e.target.value)} />
                      {v.youtubeUrl && ytId(v.youtubeUrl) && (
                        <img src={`https://img.youtube.com/vi/${ytId(v.youtubeUrl)}/default.jpg`} alt="" className="mt-1 rounded-2" style={{ height:36 }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gold" style={{ padding:'11px 36px' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating…</>
              : <><i className="bi bi-plus-circle me-2"></i>Create Course</>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── My Courses List ───────────────────────────────────────── */
const MyCourses = ({ courses, onRefresh }) => (
  <div className="el-fade-in-up">
    <h3 className="fw-800 mb-4">My Courses ({courses.length})</h3>
    <div className="el-card p-0 overflow-hidden">
      <div style={{ overflowX:'auto' }}>
        <table className="w-100" style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--el-primary)',color:'#fff' }}>
              {['Course','Category','Level','Students','Videos','Price','Status'].map(h => (
                <th key={h} style={{ padding:'12px 16px',fontWeight:600,fontSize:'.83rem',whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.length === 0
              ? <tr><td colSpan="7" style={{ textAlign:'center',padding:'40px',color:'var(--el-muted)' }}>No courses yet.</td></tr>
              : courses.map((c,i) => (
                <tr key={c._id} style={{ borderBottom:'1px solid #f0f0f0',transition:'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{ padding:'12px 16px' }}>
                    <div className="d-flex align-items-center gap-2">
                      <img src={c.thumbnail||''} alt="" style={{ width:48,height:34,borderRadius:6,objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                      <span className="fw-600" style={{ fontSize:'.86rem' }}>{c.title}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}><small style={{ color:'var(--el-muted)' }}>{c.category}</small></td>
                  <td style={{ padding:'12px 16px' }}><span className={`badge-${c.level?.toLowerCase()}`}>{c.level}</span></td>
                  <td style={{ padding:'12px 16px' }}><i className="bi bi-people me-1" style={{ color:'var(--el-muted)' }}></i>{c.enrolledStudents||0}</td>
                  <td style={{ padding:'12px 16px' }}><i className="bi bi-camera-video me-1" style={{ color:'var(--el-accent)' }}></i>{c.videos?.length||0}</td>
                  <td style={{ padding:'12px 16px',fontWeight:700,color:c.price===0?'#00c9a7':'var(--el-primary)' }}>{c.price===0?'Free':`₹${c.price}`}</td>
                  <td style={{ padding:'12px 16px' }}><span style={{ color:c.isPublished?'#00c9a7':'#f0a500',fontWeight:700,fontSize:'.82rem' }}>{c.isPublished?'● Live':'○ Draft'}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* ─── Manage Videos ─────────────────────────────────────────── */
const ManageVideos = ({ courses, onRefresh }) => {
  const [selCourse, setSelCourse] = useState(null);
  const [newVid, setNewVid] = useState({ title:'',titleHindi:'',youtubeUrl:'',duration:'' });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const course = courses.find(c => c._id === selCourse);
  const videos = course?.videos || [];
  const ytId = url => { const m=url.match(/(?:watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m?m[1]:''; };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newVid.title || !newVid.youtubeUrl) return toast.error('Title and URL required');
    setAdding(true);
    try {
      const res = await addVideo(selCourse, newVid);
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Video added!'); onRefresh();
      setNewVid({ title:'',titleHindi:'',youtubeUrl:'',duration:'' });
    } catch (e) { toast.error(errMsg(e,'Add failed')); } finally { setAdding(false); }
  };
  const handleUpdate = async (vid) => {
    try {
      const res = await updateVideo(selCourse, vid, editData);
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Updated!'); onRefresh(); setEditId(null);
    } catch (e) { toast.error(errMsg(e,'Update failed')); }
  };
  const handleDel = async (vid) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      const res = await deleteVideo(selCourse, vid);
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Deleted!'); onRefresh();
    } catch (e) { toast.error(errMsg(e,'Delete failed')); }
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-4">📹 Manage Videos</h3>
      <select className="el-input mb-4" style={{ maxWidth:440 }} value={selCourse||''} onChange={e => setSelCourse(e.target.value)}>
        <option value="">-- Select a course --</option>
        {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
      </select>

      {course && (
        <>
          <div className="el-card mb-4">
            <h5 className="fw-700 mb-3"><i className="bi bi-plus-circle me-2" style={{ color:'var(--el-accent)' }}></i>Add New Video</h5>
            <form onSubmit={handleAdd}>
              <div className="row g-3 mb-3">
                <div className="col-md-4"><input className="el-input" placeholder="Title (EN)*" value={newVid.title} onChange={e => setNewVid({...newVid,title:e.target.value})} required /></div>
                <div className="col-md-4"><input className="el-input" placeholder="शीर्षक (HI)" value={newVid.titleHindi} onChange={e => setNewVid({...newVid,titleHindi:e.target.value})} /></div>
                <div className="col-md-4"><input className="el-input" placeholder="Duration (45 min)" value={newVid.duration} onChange={e => setNewVid({...newVid,duration:e.target.value})} /></div>
                <div className="col-12"><input className="el-input" placeholder="YouTube URL*" value={newVid.youtubeUrl} onChange={e => setNewVid({...newVid,youtubeUrl:e.target.value})} required /></div>
              </div>
              <button type="submit" disabled={adding} className="btn-gold" style={{ padding:'9px 24px' }}>
                {adding ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-plus me-2"></i>Add Video</>}
              </button>
            </form>
          </div>

          <div className="el-card">
            <h5 className="fw-700 mb-3">All Videos ({videos.length})</h5>
            {videos.length === 0 && <p style={{ color:'var(--el-muted)' }}>No videos yet.</p>}
            <div className="d-flex flex-column gap-3">
              {videos.sort((a,b) => a.order-b.order).map((v,i) => (
                <div key={v._id} className="p-3 rounded-3" style={{ background:'#f8f9fa',border:'1px solid #e9ecef',transition:'all .22s' }}>
                  {editId === v._id ? (
                    <div className="row g-2">
                      <div className="col-md-4"><input className="el-input" placeholder="Title" value={editData.title||''} onChange={e => setEditData({...editData,title:e.target.value})} /></div>
                      <div className="col-md-4"><input className="el-input" placeholder="Hindi title" value={editData.titleHindi||''} onChange={e => setEditData({...editData,titleHindi:e.target.value})} /></div>
                      <div className="col-md-4"><input className="el-input" placeholder="Duration" value={editData.duration||''} onChange={e => setEditData({...editData,duration:e.target.value})} /></div>
                      <div className="col-9"><input className="el-input" placeholder="YouTube URL" value={editData.youtubeUrl||''} onChange={e => setEditData({...editData,youtubeUrl:e.target.value})} /></div>
                      <div className="col-3 d-flex gap-1">
                        <button onClick={() => handleUpdate(v._id)} className="btn-gold flex-fill" style={{ padding:'9px 0',justifyContent:'center' }}><i className="bi bi-check"></i></button>
                        <button onClick={() => setEditId(null)} style={{ border:'1px solid #ccc',borderRadius:8,background:'#fff',cursor:'pointer',padding:'0 10px' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width:68,height:48,borderRadius:8,overflow:'hidden',flexShrink:0 }}>
                        {v.thumbnail
                          ? <img src={v.thumbnail} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          : <div style={{ width:'100%',height:'100%',background:'#1a1a2e',display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-play-circle" style={{ color:'var(--el-accent)' }}></i></div>
                        }
                      </div>
                      <div style={{ flex:1 }}>
                        <div className="fw-600" style={{ fontSize:'.86rem' }}>Part {i+1} — {v.title}</div>
                        {v.titleHindi && <div style={{ fontSize:'.76rem',color:'#888' }}>{v.titleHindi}</div>}
                        {v.duration && <small style={{ color:'var(--el-muted)' }}><i className="bi bi-clock me-1"></i>{v.duration}</small>}
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn-act edit" onClick={() => { setEditId(v._id); setEditData({title:v.title,titleHindi:v.titleHindi,youtubeUrl:v.youtubeUrl,duration:v.duration}); }}><i className="bi bi-pencil-fill"></i></button>
                        <button className="btn-act" style={{ color:'#e74c3c',background:'rgba(231,76,60,.1)' }} onClick={() => handleDel(v._id)}><i className="bi bi-trash3-fill"></i></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Assignment Creation ───────────────────────────────────── */
const AssignmentSection = ({ courses }) => {
  const [selCourse, setSelCourse] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', attachmentUrl:'', attachmentType:'none', dueDate:'', maxMarks:100 });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('create'); // 'create' | 'list'

  const loadAssignments = async (cid) => {
    setSelCourse(cid);
    if (!cid) return;
    setLoadingA(true);
    try {
      const res = await getCourseAssignments(cid);
      setAssignments(res.data?.assignments || []);
    } catch (e) { toast.error(errMsg(e)); } finally { setLoadingA(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selCourse) return toast.error('Select a course first');
    if (!form.title.trim()) return toast.error('Title required');
    setSaving(true);
    try {
      const res = await createAssignment({ ...form, courseId:selCourse });
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Assignment created!');
      setForm({ title:'',description:'',attachmentUrl:'',attachmentType:'none',dueDate:'',maxMarks:100 });
      loadAssignments(selCourse);
      setTab('list');
    } catch (e) { toast.error(errMsg(e,'Create failed')); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      toast.success('Deleted!');
      setAssignments(a => a.filter(x => x._id !== id));
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-4">📋 Assignments</h3>

      {/* Course selector */}
      <div className="el-card mb-4">
        <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Select Course</label>
        <select className="el-input" style={{ maxWidth:440 }} value={selCourse} onChange={e => loadAssignments(e.target.value)}>
          <option value="">-- Select a course --</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {selCourse && (
        <>
          {/* Tab toggle */}
          <div className="d-flex gap-2 mb-4">
            <button onClick={() => setTab('create')} className={tab==='create' ? 'btn-gold' : 'btn-outline-gold'} style={{ padding:'8px 20px' }}>
              <i className="bi bi-plus me-1"></i> Create
            </button>
            <button onClick={() => setTab('list')} className={tab==='list' ? 'btn-gold' : 'btn-outline-gold'} style={{ padding:'8px 20px' }}>
              <i className="bi bi-list-ul me-1"></i> View ({assignments.length})
            </button>
          </div>

          {tab === 'create' && (
            <div className="el-card el-fade-in-up">
              <h5 className="fw-700 mb-4">New Assignment</h5>
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Title *</label>
                  <input className="el-input" placeholder="Assignment title" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required />
                </div>
                <div className="mb-3">
                  <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Description / Instructions</label>
                  <textarea className="el-input" rows="4" placeholder="Describe the assignment task…" value={form.description} onChange={e => setForm({...form,description:e.target.value})} style={{ resize:'vertical' }} />
                </div>

                {/* Attachment options */}
                <div className="mb-3">
                  <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Attachment (optional)</label>
                  <select className="el-input mb-2" style={{ maxWidth:300 }} value={form.attachmentType} onChange={e => setForm({...form,attachmentType:e.target.value,attachmentUrl:''})}>
                    <option value="none">No attachment</option>
                    <option value="pdf">PDF File URL</option>
                    <option value="link">External Link (Drive/Notion…)</option>
                  </select>
                  {form.attachmentType !== 'none' && (
                    <div className="input-wrap">
                      <i className="bi bi-paperclip icon-l"></i>
                      <input type="url" className="el-input" style={{ paddingLeft:40 }}
                        placeholder={form.attachmentType === 'pdf' ? 'https://…/assignment.pdf' : 'https://drive.google.com/…'}
                        value={form.attachmentUrl} onChange={e => setForm({...form,attachmentUrl:e.target.value})} />
                    </div>
                  )}
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Due Date *</label>
                    <input type="datetime-local" className="el-input" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Max Marks</label>
                    <input type="number" min="1" max="1000" className="el-input" value={form.maxMarks} onChange={e => setForm({...form,maxMarks:+e.target.value})} />
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-gold" style={{ padding:'11px 32px' }}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating…</>
                    : <><i className="bi bi-check-circle me-2"></i>Create Assignment</>
                  }
                </button>
              </form>
            </div>
          )}

          {tab === 'list' && (
            <div className="el-fade-in-up">
              {loadingA && <div className="text-center py-4"><div className="el-spinner mx-auto"></div></div>}
              {!loadingA && assignments.length === 0 && (
                <div className="el-card text-center py-4">
                  <p style={{ color:'var(--el-muted)',marginBottom:0 }}>No assignments yet for this course.</p>
                </div>
              )}
              <div className="d-flex flex-column gap-3">
                {assignments.map(a => (
                  <div key={a._id} className="submission-card">
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                      <div>
                        <div className="fw-700">{a.title}</div>
                        <div style={{ color:'var(--el-muted)',fontSize:'.82rem',marginTop:2 }}>{a.description?.substring(0,100)}</div>
                        <div className="d-flex gap-3 mt-2" style={{ fontSize:'.78rem',color:'#888' }}>
                          <span><i className="bi bi-calendar me-1"></i>Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</span>
                          <span><i className="bi bi-star me-1"></i>{a.maxMarks} marks</span>
                          {a.attachmentUrl && (
                            <a href={a.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--el-accent)' }}>
                              <i className="bi bi-paperclip me-1"></i>Attachment
                            </a>
                          )}
                        </div>
                      </div>
                      <button className="btn-act" style={{ color:'#e74c3c',background:'rgba(231,76,60,.1)' }} onClick={() => handleDelete(a._id)}>
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Student Submissions Panel ─────────────────────────────── */
const SubmissionsSection = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [grading, setGrading]         = useState(null);
  const [gradeForm, setGradeForm]     = useState({ grade:'', feedback:'' });

  useEffect(() => {
    getInstructorReceived()
      .then(r => setSubmissions(r.data?.submissions || []))
      .catch(e => {
        const msg = e?.isNetworkError
          ? 'Network error — submissions load nahi ho sake. Try again.'
          : errMsg(e);
        toast.error(msg);
        // setSubmissions([]) nahi karenge — existing data safe rahe
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGrade = async (id) => {
    if (!gradeForm.grade) return toast.error('Enter a grade (0-100)');
    try {
      const res = await gradeSubmission(id, gradeForm);
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Graded!');
      setSubmissions(p => p.map(s => s._id===id ? {...s,grade:+gradeForm.grade,feedback:gradeForm.feedback,status:'graded'} : s));
      setGrading(null); setGradeForm({ grade:'',feedback:'' });
    } catch (e) { toast.error(errMsg(e)); }
  };
  const handleSeen = async (id) => {
    await markSubmissionSeen(id);
    setSubmissions(p => p.map(s => s._id===id ? {...s,seenByInstructor:true} : s));
  };

  const unseen = submissions.filter(s => !s.seenByInstructor).length;

  return (
    <div className="el-fade-in-up">
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <h3 className="fw-800 mb-0">📥 Student Submissions</h3>
        {unseen > 0 && <span className="el-pill pill-red">{unseen} new</span>}
      </div>

      {loading
        ? <div className="text-center py-5"><div className="el-spinner mx-auto"></div></div>
        : submissions.length === 0
          ? <div className="el-card text-center py-5 el-bounce-in"><div style={{ fontSize:'3rem',marginBottom:12 }}>📭</div><p style={{ color:'var(--el-muted)' }}>No submissions yet.</p></div>
          : <div className="d-flex flex-column gap-3">
              {submissions.map((s,i) => (
                <div key={s._id} className={`submission-card el-fade-in-up el-d${Math.min(i+1,5)}`}
                  style={{ borderLeft:`4px solid ${!s.seenByInstructor ? '#e74c3c' : '#e9ecef'}` }}>
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                    {/* Student info */}
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width:44,height:44,borderRadius:'50%',background:'var(--g-accent)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'1rem',flexShrink:0 }}>
                        {s.studentId?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="fw-700">
                          {s.studentId?.name}
                          <span style={{ color:'#888',fontWeight:400,fontSize:'.82rem' }}> — {s.studentId?.email}</span>
                        </div>
                        <div style={{ fontSize:'.83rem',color:'#555' }}><strong>{s.assignmentId?.title}</strong></div>
                        <div style={{ fontSize:'.78rem',color:'#888' }}>{s.courseId?.title}</div>
                        {/* Submission time */}
                        <div style={{ fontSize:'.76rem',color:'#aaa',marginTop:2 }}>
                          <i className="bi bi-clock me-1"></i>
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN') : 'Unknown time'}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <span className={`submission-status-badge ${s.status}`}>{s.status}</span>
                      {!s.seenByInstructor && (
                        <button className="btn-act" style={{ color:'#3498db',background:'rgba(52,152,219,.1)',width:'auto',padding:'0 10px',fontSize:'.76rem' }} onClick={() => handleSeen(s._id)}>
                          Mark seen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submission link — Download button */}
                  {s.submissionLink && (
                    <div className="mt-3 p-2 rounded-3 d-flex align-items-center gap-3" style={{ background:'#f8f9fa',border:'1px solid #e9ecef' }}>
                      <i className="bi bi-link-45deg" style={{ color:'var(--el-accent)',fontSize:'1.1rem' }}></i>
                      <a href={s.submissionLink} target="_blank" rel="noopener noreferrer"
                        style={{ color:'var(--el-accent)',fontWeight:600,wordBreak:'break-all',fontSize:'.86rem',flex:1 }}>
                        {s.submissionLink}
                      </a>
                      {/* Download button if it looks like a direct PDF */}
                      {s.submissionLink.match(/\.(pdf)$/i) && (
                        <a href={s.submissionLink} download className="btn-gold" style={{ padding:'5px 12px',fontSize:'.78rem',whiteSpace:'nowrap' }}>
                          <i className="bi bi-download me-1"></i>Download
                        </a>
                      )}
                    </div>
                  )}
                  {s.content && <p className="mt-2 mb-0" style={{ fontSize:'.84rem',color:'#555' }}>{s.content}</p>}

                  {/* Grade form */}
                  {grading === s._id ? (
                    <div className="mt-3 p-3 rounded-3" style={{ background:'#f0f9ff',border:'1px solid #b3d9f5' }}>
                      <div className="row g-2">
                        <div className="col-md-3">
                          <input type="number" min="0" max="100" className="el-input" placeholder="Grade (0-100)" value={gradeForm.grade} onChange={e => setGradeForm({...gradeForm,grade:e.target.value})} />
                        </div>
                        <div className="col-md-7">
                          <input className="el-input" placeholder="Feedback for student…" value={gradeForm.feedback} onChange={e => setGradeForm({...gradeForm,feedback:e.target.value})} />
                        </div>
                        <div className="col-md-2 d-flex gap-1">
                          <button onClick={() => handleGrade(s._id)} className="btn-gold flex-fill" style={{ padding:'9px 0',justifyContent:'center' }}>Save</button>
                          <button onClick={() => setGrading(null)} style={{ border:'1px solid #ccc',borderRadius:8,background:'#fff',cursor:'pointer',padding:'0 10px' }}>✕</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 d-flex align-items-center gap-3">
                      {s.grade != null && (
                        <span className="fw-700" style={{ color:'var(--el-primary)',fontSize:'.86rem' }}>
                          Grade: {s.grade}/100
                          {s.feedback && <span className="fw-400" style={{ color:'var(--el-muted)' }}> — "{s.feedback}"</span>}
                        </span>
                      )}
                      <button onClick={() => { setGrading(s._id); setGradeForm({grade:s.grade||'',feedback:s.feedback||''}); }}
                        className="btn-outline-gold" style={{ marginLeft:'auto',padding:'6px 16px',fontSize:'.82rem' }}>
                        <i className="bi bi-pencil me-1"></i>{s.grade != null ? 'Update' : 'Grade'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
      }
    </div>
  );
};

/* ─── Quiz Management + DOCX Import ────────────────────────── */
const QuizSection = ({ courses }) => {
  const [tab, setTab] = useState('list');
  const [selCourse, setSelCourse] = useState('');
  const [quizzes, setQuizzes]     = useState([]);
  const [loadingQ, setLoadingQ]   = useState(false);
  const [form, setForm] = useState({ courseId:'',title:'',titleHindi:'',type:'practice',duration:30,passingScore:60 });
  const [questions, setQuestions] = useState([{ question:'',questionHindi:'',options:['','','',''],optionsHindi:['','','',''],correctAnswer:0,marks:2 }]);
  const [saving, setSaving] = useState(false);
  // DOCX import state
  const [importing, setImporting] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const fileRef = useRef();

  const loadQuizzes = async (cid) => {
    setSelCourse(cid); if (!cid) return;
    setLoadingQ(true);
    try { const r = await getCourseQuizzes(cid); setQuizzes(r.data?.quizzes||[]); }
    catch (e) { toast.error(errMsg(e)); } finally { setLoadingQ(false); }
  };

  const addQ = () => setQuestions(q => [...q, { question:'',questionHindi:'',options:['','','',''],optionsHindi:['','','',''],correctAnswer:0,marks:form.type==='exam'?5:2 }]);
  const removeQ = i => setQuestions(q => q.filter((_,idx) => idx!==i));
  const updQ = (i,f,v) => { const a=[...questions]; a[i]={...a[i],[f]:v}; setQuestions(a); };
  const updOpt = (qi,oi,v,hi=false) => { const a=[...questions]; const fl=hi?'optionsHindi':'options'; a[qi]={...a[qi],[fl]:a[qi][fl].map((o,idx)=>idx===oi?v:o)}; setQuestions(a); };

  /* Parse DOCX file using mammoth loaded from CDN */
  const handleDocxImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setParsedQuestions([]);
    try {
      // Dynamically load mammoth from CDN (no install needed on frontend)
      if (!window.mammoth) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      const text   = result.value;
      const parsed = parseDocxQuiz(text);
      if (parsed.length === 0) {
        toast.error('No questions found. Check format: Q1. ... A. ... Answer: A');
        return;
      }
      setParsedQuestions(parsed);
      // Merge into questions list
      setQuestions(parsed);
      toast.success(`Parsed ${parsed.length} questions from DOCX!`);
      setTab('create');
    } catch (err) {
      toast.error('Failed to parse DOCX: ' + err.message);
    } finally { setImporting(false); if (fileRef.current) fileRef.current.value=''; }
  };

  /**
   * Parse DOCX text in format:
   *   Q1. Question text
   *   A. Option 1
   *   B. Option 2
   *   C. Option 3
   *   D. Option 4
   *   Answer: A
   */
  const parseDocxQuiz = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];
    let current = null;
    const answerMap = { A:0, B:1, C:2, D:3, a:0, b:1, c:2, d:3 };

    for (const line of lines) {
      // New question: Q1. / 1. / Q1) etc.
      if (/^Q?\d+[\.\)]\s+/i.test(line)) {
        if (current) parsed.push(current);
        current = {
          question: line.replace(/^Q?\d+[\.\)]\s+/i,'').trim(),
          questionHindi: '',
          options: ['','','',''],
          optionsHindi: ['','','',''],
          correctAnswer: 0,
          marks: 2,
        };
      }
      // Options A. / B. / a) etc.
      else if (/^([A-Da-d])[\.\)]\s+/.test(line) && current) {
        const match = line.match(/^([A-Da-d])[\.\)]\s+(.*)/);
        if (match) {
          const idx = answerMap[match[1]] ?? 0;
          if (idx < 4) current.options[idx] = match[2].trim();
        }
      }
      // Answer: A
      else if (/^answer\s*:\s*([A-Da-d])/i.test(line) && current) {
        const match = line.match(/^answer\s*:\s*([A-Da-d])/i);
        if (match) current.correctAnswer = answerMap[match[1]] ?? 0;
      }
    }
    if (current) parsed.push(current);
    return parsed.filter(q => q.question && q.options.some(o => o));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.courseId || !form.title) return toast.error('Course and title required');
    setSaving(true);
    try {
      const res = await createQuiz({...form, questions});
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Quiz created!');
      setTab('list'); loadQuizzes(form.courseId);
      setQuestions([{ question:'',questionHindi:'',options:['','','',''],optionsHindi:['','','',''],correctAnswer:0,marks:2 }]);
    } catch (e) { toast.error(errMsg(e,'Create failed')); } finally { setSaving(false); }
  };

  const handleDel = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      const res = await deleteQuiz(id);
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success('Deleted!'); setQuizzes(q => q.filter(x => x._id!==id));
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="el-fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <h3 className="fw-800 mb-0">🧠 Manage Quizzes</h3>
        <div className="d-flex gap-2 flex-wrap">
          <button onClick={() => setTab('list')}   className={tab==='list'   ? 'btn-gold' : 'btn-outline-gold'} style={{ padding:'8px 18px',fontSize:'.85rem' }}>View</button>
          <button onClick={() => setTab('create')} className={tab==='create' ? 'btn-gold' : 'btn-outline-gold'} style={{ padding:'8px 18px',fontSize:'.85rem' }}>+ Create</button>
          <label className="btn-outline-gold" style={{ padding:'8px 18px',fontSize:'.85rem',cursor:'pointer',margin:0 }}>
            {importing
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Parsing…</>
              : <><i className="bi bi-file-earmark-word me-1"></i>Import DOCX</>
            }
            <input ref={fileRef} type="file" accept=".docx" style={{ display:'none' }} onChange={handleDocxImport} />
          </label>
        </div>
      </div>

      {/* DOCX format hint */}
      <div className="el-card mb-4" style={{ background:'rgba(52,152,219,.06)',border:'1px solid rgba(52,152,219,.2)',padding:'14px 20px' }}>
        <small style={{ color:'#3498db' }}>
          <i className="bi bi-file-earmark-word me-2"></i>
          <strong>DOCX Format:</strong>&nbsp;
          Q1. Question text | A. Option | B. Option | C. Option | D. Option | Answer: A
        </small>
      </div>

      {tab === 'list' && (
        <>
          <select className="el-input mb-4" style={{ maxWidth:440 }} value={selCourse} onChange={e => loadQuizzes(e.target.value)}>
            <option value="">-- Select a course --</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          {loadingQ && <div className="text-center py-4"><div className="el-spinner mx-auto"></div></div>}
          {!loadingQ && selCourse && quizzes.length === 0 && <p style={{ color:'var(--el-muted)' }}>No quizzes yet.</p>}
          <div className="row g-3">
            {quizzes.map((q,i) => (
              <div key={q._id} className={`col-md-6 col-lg-4 el-fade-in-up el-d${Math.min(i+1,5)}`}>
                <div className="el-card el-hover">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`el-pill ${q.type==='exam'?'pill-red':'pill-blue'}`}>{q.type}</span>
                    <button className="btn-act" style={{ color:'#e74c3c',background:'rgba(231,76,60,.1)' }} onClick={() => handleDel(q._id)}>
                      <i className="bi bi-trash3-fill"></i>
                    </button>
                  </div>
                  <h6 className="fw-700 mb-1">{q.title}</h6>
                  <div className="d-flex gap-3" style={{ fontSize:'.8rem',color:'var(--el-muted)' }}>
                    <span><i className="bi bi-list-ol me-1"></i>{q.questions?.length} Qs</span>
                    <span><i className="bi bi-clock me-1"></i>{q.duration} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'create' && (
        <div className="el-card el-fade-in-up">
          <h5 className="fw-700 mb-4">
            New Quiz
            {parsedQuestions.length > 0 && <span className="el-pill pill-blue ms-2">{parsedQuestions.length} from DOCX</span>}
          </h5>
          <form onSubmit={handleCreate}>
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Course *</label>
                <select className="el-input" value={form.courseId} onChange={e => setForm({...form,courseId:e.target.value})} required>
                  <option value="">-- Select course --</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Quiz Title *</label>
                <input className="el-input" placeholder="e.g. Chapter 3 Practice" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required />
              </div>
              <div className="col-md-3">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Type</label>
                <select className="el-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                  <option value="practice">Practice</option>
                  <option value="exam">Final Exam</option>
                </select>
              </div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Duration (min)</label>
                <input type="number" min="5" className="el-input" value={form.duration} onChange={e => setForm({...form,duration:+e.target.value})} />
              </div>
              <div className="col-md-4">
                <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Passing Score (%)</label>
                <input type="number" min="1" max="100" className="el-input" value={form.passingScore} onChange={e => setForm({...form,passingScore:+e.target.value})} />
              </div>
            </div>

            {/* Questions */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-700 mb-0">Questions ({questions.length})</h6>
              <button type="button" onClick={addQ} className="btn-outline-gold" style={{ padding:'6px 14px',fontSize:'.82rem' }}>
                <i className="bi bi-plus me-1"></i>Add Question
              </button>
            </div>
            <div className="d-flex flex-column gap-4" style={{ maxHeight:480,overflowY:'auto',paddingRight:4 }}>
              {questions.map((q, qi) => (
                <div key={qi} className="p-3 rounded-3" style={{ background:'#f8f9fa',border:'1px solid #e9ecef' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-700" style={{ color:'var(--el-primary)',fontSize:'.88rem' }}>Q{qi+1}</span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQ(qi)} style={{ background:'none',border:'none',color:'#e74c3c',cursor:'pointer' }}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    )}
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6"><input className="el-input" placeholder="Question (English)*" value={q.question} onChange={e => updQ(qi,'question',e.target.value)} required /></div>
                    <div className="col-md-6"><input className="el-input" placeholder="प्रश्न (Hindi)" value={q.questionHindi} onChange={e => updQ(qi,'questionHindi',e.target.value)} /></div>
                  </div>
                  <div className="row g-2">
                    {[0,1,2,3].map(oi => (
                      <div key={oi} className="col-md-6">
                        <div className="d-flex gap-1 align-items-center">
                          <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer===oi} onChange={() => updQ(qi,'correctAnswer',oi)}
                            style={{ accentColor:'var(--el-accent)',cursor:'pointer',flexShrink:0 }} title="Mark as correct" />
                          <input className="el-input" placeholder={`Option ${oi+1} EN`} value={q.options[oi]} onChange={e => updOpt(qi,oi,e.target.value)} style={{ flex:1 }} />
                          <input className="el-input" placeholder={`विकल्प ${oi+1} HI`} value={q.optionsHindi[oi]} onChange={e => updOpt(qi,oi,e.target.value,true)} style={{ flex:1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <small style={{ color:'var(--el-muted)' }}>Marks:</small>
                    <input type="number" min="1" max="10" className="el-input" style={{ width:68 }} value={q.marks} onChange={e => updQ(qi,'marks',+e.target.value)} />
                    <small style={{ color:'#00c9a7',fontSize:'.76rem' }}>✓ = Option {q.correctAnswer+1}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button type="submit" disabled={saving} className="btn-gold" style={{ padding:'11px 36px' }}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                  : <><i className="bi bi-check-circle me-2"></i>Create Quiz ({questions.length} questions)</>
                }
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ─── Analytics ─────────────────────────────────────────────── */
const Analytics = ({ courses, totalStudents }) => (
  <div className="el-fade-in-up">
    <h3 className="fw-800 mb-4">Analytics 📊</h3>
    <div className="el-card" style={{ boxShadow:'var(--sh-md)' }}>
      {courses.length === 0 ? <p style={{ color:'var(--el-muted)' }}>No courses yet.</p> : (
        <div className="d-flex flex-column gap-4">
          {courses.map((c,i) => (
            <div key={c._id} className={`el-fade-in-up el-d${Math.min(i+1,5)}`}>
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-600" style={{ fontSize:'.9rem' }}>{c.title}</span>
                <span className="fw-700" style={{ color:'var(--el-accent)' }}>{c.enrolledStudents||0} students</span>
              </div>
              <div className="el-prog-track">
                <div className="el-prog-bar" style={{ width:`${Math.min(100,((c.enrolledStudents||0)/Math.max(1,...courses.map(x=>x.enrolledStudents||0)))*100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

/* ─── Profile ────────────────────────────────────────────────── */
const InstructorProfile = ({ user }) => (
  <div className="el-fade-in-up" style={{ maxWidth:600 }}>
    <h3 className="fw-800 mb-4">My Profile</h3>
    <div className="el-card" style={{ boxShadow:'var(--sh-md)' }}>
      <div className="d-flex align-items-center gap-4 mb-4">
        <div style={{ width:76,height:76,borderRadius:'50%',background:'var(--g-accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',fontWeight:800,color:'#fff',boxShadow:'0 4px 16px rgba(240,165,0,.40)' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div><h4 className="fw-700 mb-1">{user?.name}</h4><span className="el-pill pill-blue">Instructor</span></div>
      </div>
      <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Email</label><input className="el-input" value={user?.email||''} disabled /></div>
      <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Full Name</label><input className="el-input" defaultValue={user?.name||''} /></div>
      <div className="mb-4"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Bio</label><textarea className="el-input" rows="3" defaultValue={user?.bio||''} style={{ resize:'none' }} /></div>
      <button className="btn-gold"><i className="bi bi-check-circle me-2"></i>Save Changes</button>
    </div>
  </div>
);

export default InstructorDashboard;
