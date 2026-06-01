/**
 * StudentDashboard - Fixed CSS + Video Progress tracking + Certificate download
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar  from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  getMyCourses, getMySubmissions, getMyQuizResults,
  getCourseAssignments, submitAssignment, getCourseQuizzes,
  markVideoComplete,
} from '../services/api';

const em = (e, fb='Something went wrong') => e?.isNetworkError ? 'Network error — backend connect nahi ho pa raha' : (e?.response?.data?.message || e?.message || fb);

const StudentDashboard = () => {
  const { user }    = useAuth();
  const [section, setSection]       = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eR, sR, qR] = await Promise.all([getMyCourses(), getMySubmissions(), getMyQuizResults()]);
      setEnrollments(eR.data?.enrollments || []);
      setSubmissions(sR.data?.submissions || []);
      setQuizResults(qR.data?.results     || []);
    } catch (e) {
      const msg = e?.isNetworkError
        ? 'Network error — server se connect nahi ho pa raha. Check your connection.'
        : 'Failed to load: ' + em(e);
      toast.error(msg);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const completed = enrollments.filter(e => e.progress >= 100).length;
  const avgProg   = enrollments.length ? Math.round(enrollments.reduce((a,b)=>a+(b.progress||0),0)/enrollments.length) : 0;

  const widgets = [
    { label:'Enrolled', value:enrollments.length, icon:'bi-book-fill',         cls:'sw-blue'   },
    { label:'Completed',value:completed,          icon:'bi-patch-check-fill',  cls:'sw-green'  },
    { label:'Progress', value:`${avgProg}%`,      icon:'bi-graph-up-arrow',    cls:'sw-orange' },
    { label:'Quizzes',  value:quizResults.length, icon:'bi-clipboard-check-fill',cls:'sw-purple'},
  ];

  const renderSection = () => {
    switch(section) {
      case 'courses':      return <CoursesSection enrollments={enrollments} />;
      case 'videos':       return <VideosSection  enrollments={enrollments} onRefresh={loadAll} />;
      case 'assignments':  return <AssignmentsSection enrollments={enrollments} submissions={submissions} onRefresh={loadAll} />;
      case 'quizzes':      return <QuizzesSection enrollments={enrollments} results={quizResults} />;
      case 'exam':         return <ExamSection    enrollments={enrollments} />;
      case 'certificates': return <CertsSection   enrollments={enrollments} />;
      case 'profile':      return <ProfileSection user={user} />;
      default:             return <Overview widgets={widgets} enrollments={enrollments} user={user} loading={loading} setSection={setSection} />;
    }
  };

  return (
    <div style={{ background:'var(--el-bg)', minHeight:'100vh' }}>
      <Navbar />
      <Sidebar activeSection={section} setActiveSection={s=>{setSection(s);setSidebarOpen(false);}} sidebarOpen={sidebarOpen} />
      <button className="d-lg-none sidebar-toggle-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>
        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
      </button>
      {sidebarOpen&&<div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} />}
      <div className="dashboard-content">
        {loading ? <div className="text-center py-5"><div className="el-spinner mx-auto mb-3"></div><p style={{ color:'var(--el-muted)' }}>Loading…</p></div> : renderSection()}
      </div>
    </div>
  );
};

const Overview = ({ widgets, enrollments, user, setSection }) => (
  <div className="el-fade-in-up">
    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
      <div><h2 className="fw-800 mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2><p style={{ color:'var(--el-muted)',marginBottom:0 }}>Continue your learning journey</p></div>
      <Link to="/courses" className="btn-gold"><i className="bi bi-plus-circle"></i> Explore</Link>
    </div>
    <div className="row g-4 mb-5">
      {widgets.map((w,i)=>(
        <div key={i} className={`col-6 col-md-6 col-xl-3 el-fade-in-up el-d${i+1}`}>
          <div className={`stat-widget ${w.cls}`}><div className="sw-icon"><i className={`bi ${w.icon}`}></i></div><div className="sw-num">{w.value}</div><div className="sw-label">{w.label}</div></div>
        </div>
      ))}
    </div>
    <h5 className="fw-700 mb-4">My Courses</h5>
    {enrollments.length===0 ? (
      <div className="el-card text-center py-5 el-bounce-in"><div style={{ fontSize:'3rem',marginBottom:12 }}>📚</div><h5 className="fw-700">No courses yet</h5><Link to="/courses" className="btn-gold mt-2">Browse Courses</Link></div>
    ) : (
      <div className="row g-4">
        {enrollments.slice(0,4).map((e,i)=>(
          <div key={e._id} className={`col-lg-6 el-fade-in-up el-d${i+1}`}>
            <CourseProgressCard enroll={e} setSection={setSection} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const CourseProgressCard = ({ enroll, setSection }) => {
  const c = enroll.courseId;
  if (!c) return null;
  return (
    <div className="el-card d-flex gap-3 el-hover" style={{ alignItems:'flex-start' }}>
      <img src={c.thumbnail||'https://via.placeholder.com/90x65/0a1628/f0a500?text=EL'} alt="" style={{ width:90,height:65,borderRadius:'var(--r-md)',objectFit:'cover',flexShrink:0 }} onError={e=>{e.target.src='https://via.placeholder.com/90x65/0a1628/f0a500?text=EL';}} />
      <div style={{ flex:1,minWidth:0 }}>
        <div className="fw-700 mb-1" style={{ color:'var(--el-primary)',fontSize:'.93rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.title}</div>
        <small style={{ color:'var(--el-muted)' }}>By {c.instructorId?.name||'Instructor'}</small>
        <div className="el-prog-track mt-2 mb-1"><div className="el-prog-bar" style={{ width:`${enroll.progress||0}%` }}></div></div>
        <div className="d-flex justify-content-between align-items-center">
          <small style={{ color:'var(--el-muted)' }}>{enroll.progress||0}% complete</small>
          {enroll.progress>=100
            ? <span style={{ color:'#00c9a7',fontSize:'.78rem',fontWeight:700 }}><i className="bi bi-patch-check-fill me-1"></i>Done</span>
            : <button onClick={()=>setSection('videos')} style={{ fontSize:'.78rem',color:'var(--el-accent)',fontWeight:600,background:'none',border:'none',cursor:'pointer',padding:0 }}>Continue →</button>
          }
        </div>
      </div>
    </div>
  );
};

const CoursesSection = ({ enrollments }) => (
  <div className="el-fade-in-up">
    <h3 className="fw-800 mb-4">My Enrolled Courses ({enrollments.length})</h3>
    {enrollments.length===0 ? <div className="el-card text-center py-5"><p style={{ color:'var(--el-muted)' }}>No courses. <Link to="/courses" style={{ color:'var(--el-accent)' }}>Browse</Link></p></div>
    : <div className="row g-4">
        {enrollments.map((e,i)=>{
          const c=e.courseId; if(!c)return null;
          return (
            <div key={e._id} className={`col-lg-6 el-fade-in-up el-d${Math.min(i+1,5)}`}>
              <div className="el-card el-hover">
                <div className="d-flex gap-3">
                  <img src={c.thumbnail||'https://via.placeholder.com/100x70'} alt="" style={{ width:100,height:70,borderRadius:'var(--r-md)',objectFit:'cover',flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div className="fw-700 mb-1">{c.title}</div>
                    <small style={{ color:'var(--el-muted)' }}>{c.category} · {c.level}</small>
                    <div className="el-prog-track mt-2 mb-1"><div className="el-prog-bar" style={{ width:`${e.progress||0}%` }}></div></div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small style={{ color:'var(--el-muted)' }}>{e.progress||0}% · {c.videos?.length||0} videos</small>
                      <Link to={`/courses/${c._id}`} className="btn-gold" style={{ padding:'4px 12px',fontSize:'.78rem' }}>View</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    }
  </div>
);

/* ── Videos + Progress Tracking ── */
const VideosSection = ({ enrollments, onRefresh }) => {
  const [selEnroll, setSelEnroll] = useState(enrollments[0]||null);
  const [activeVid, setActiveVid] = useState(null);
  const [marking, setMarking]     = useState(false);

  useEffect(()=>{
    if(selEnroll?.courseId?.videos?.length>0) setActiveVid(selEnroll.courseId.videos[0]);
  },[selEnroll]);

  const course = selEnroll?.courseId;
  const videos = course?.videos||[];
  const embedUrl = v => v?.youtubeId ? `https://www.youtube.com/embed/${v.youtubeId}?rel=0` : '';

  // Check if a video is completed in this enrollment
  const isVideoDone = (vid) => selEnroll?.videoProgress?.some(vp => vp.videoId === vid._id?.toString() && vp.completed) || false;
  const completedCount = videos.filter(v => isVideoDone(v)).length;

  const handleMarkDone = async () => {
    if (!activeVid || !selEnroll) return;
    setMarking(true);
    try {
      await markVideoComplete(selEnroll._id, activeVid._id?.toString());
      toast.success('Video marked as completed! ✅');
      await onRefresh(); // Refresh enrollments to get updated progress
    } catch(e) { toast.error(em(e)); }
    finally { setMarking(false); }
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-4">📺 Course Videos</h3>
      {enrollments.length===0 && (
        <div className="el-card text-center py-5"><p style={{ color:'var(--el-muted)' }}>Enroll in a course to watch videos.</p><Link to="/courses" className="btn-gold">Browse Courses</Link></div>
      )}
      {enrollments.length>1 && (
        <div className="mb-4 d-flex gap-2 flex-wrap">
          {enrollments.filter(e=>e.courseId).map(e=>(
            <button key={e._id} onClick={()=>setSelEnroll(e)}
              style={{ border:`2px solid ${selEnroll?._id===e._id?'var(--el-accent)':'#e9ecef'}`,background:selEnroll?._id===e._id?'rgba(240,165,0,.1)':'#fff',color:selEnroll?._id===e._id?'var(--el-accent)':'#555',borderRadius:'var(--r-md)',padding:'7px 16px',fontWeight:600,cursor:'pointer',transition:'var(--tr)',fontFamily:'Poppins,sans-serif',fontSize:'.85rem' }}>
              {e.courseId.title}
            </button>
          ))}
        </div>
      )}

      {course && (
        <>
          {/* Progress summary */}
          <div className="el-card mb-4" style={{ background:'rgba(240,165,0,.06)',border:'1px solid rgba(240,165,0,.2)' }}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <div className="fw-700" style={{ color:'var(--el-primary)' }}>{course.title}</div>
                <small style={{ color:'var(--el-muted)' }}>{completedCount}/{videos.length} videos completed · {selEnroll?.progress||0}% overall</small>
              </div>
              <div className="el-prog-track" style={{ width:180 }}>
                <div className="el-prog-bar" style={{ width:`${selEnroll?.progress||0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Video Player */}
            <div className="col-lg-8">
              <div className="el-card p-0 overflow-hidden" style={{ boxShadow:'var(--sh-md)' }}>
                {activeVid && embedUrl(activeVid) ? (
                  <div style={{ position:'relative',paddingBottom:'56.25%',height:0 }}>
                    <iframe src={embedUrl(activeVid)} title={activeVid.title}
                      style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <div style={{ height:280,background:'#000',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10 }}>
                    <i className="bi bi-play-circle" style={{ fontSize:'3rem',color:'var(--el-accent)' }}></i>
                    <span style={{ color:'#fff',fontSize:'.9rem' }}>Select a video to play</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                    <div>
                      <h5 className="fw-700 mb-1">{activeVid?.title||course.title}</h5>
                      {activeVid?.titleHindi && <p style={{ color:'var(--el-muted)',fontSize:'.88rem',marginBottom:0 }}>{activeVid.titleHindi}</p>}
                    </div>
                    {activeVid && (
                      isVideoDone(activeVid) ? (
                        <div className="btn-mark-done done" style={{ cursor:'default' }}>
                          <i className="bi bi-check-circle-fill"></i> Completed
                        </div>
                      ) : (
                        <button onClick={handleMarkDone} disabled={marking} className="btn-mark-done">
                          {marking ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-circle"></i> Mark as Done</>}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist */}
            <div className="col-lg-4">
              <div className="el-card h-100" style={{ maxHeight:540,overflowY:'auto' }}>
                <h6 className="fw-700 mb-3"><i className="bi bi-list-ul me-2" style={{ color:'var(--el-accent)' }}></i>Playlist ({videos.length})</h6>
                {videos.sort((a,b)=>a.order-b.order).map((v,i)=>{
                  const done = isVideoDone(v);
                  return (
                    <div key={v._id} onClick={()=>setActiveVid(v)}
                      className={`video-item ${activeVid?._id===v._id?'active':''} ${done?'done':''}`}>
                      <i className={`bi ${done?'bi-check-circle-fill':'bi-circle'} video-check`} style={{ color:done?'#00c9a7':'#ddd' }}></i>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div className="fw-600" style={{ fontSize:'.83rem',lineHeight:1.3 }}>Part {i+1} — {v.title}</div>
                        {v.duration && <small style={{ color:'var(--el-muted)' }}><i className="bi bi-clock me-1"></i>{v.duration}</small>}
                      </div>
                      {activeVid?._id===v._id && <i className="bi bi-play-fill" style={{ color:'var(--el-accent)',fontSize:'.9rem' }}></i>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Assignments ── */
const AssignmentsSection = ({ enrollments, submissions, onRefresh }) => {
  const [assignments, setAssignments] = useState([]);
  const [selCourse, setSelCourse]     = useState('');
  const [loadingA, setLoadingA]       = useState(false);
  const [form, setForm] = useState({ assignmentId:'', submissionLink:'', content:'' });
  const [submitting, setSub] = useState(false);

  // Check if student has watched at least 1 video in a course
  const hasWatchedVideo = (enrollId) => {
    const enroll = enrollments.find(e => e._id === enrollId || e.courseId?._id === enrollId || e.courseId === enrollId);
    return enroll?.videoProgress?.some(vp => vp.completed) || (enroll?.progress || 0) > 0;
  };

  // Only show courses where student has watched at least 1 video
  const eligibleEnrollments = enrollments.filter(e => e.courseId && hasWatchedVideo(e.courseId?._id || e.courseId));

  useEffect(() => {
    if (!selCourse) return;
    setLoadingA(true);
    getCourseAssignments(selCourse)
      .then(r => setAssignments(r.data?.assignments || []))
      .catch(e => {
        const msg = e?.isNetworkError
          ? 'Network error — assignments load nahi ho sake'
          : em(e);
        toast.error(msg);
      })
      .finally(() => setLoadingA(false));
  }, [selCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignmentId) return toast.error('Select an assignment');
    if (!form.submissionLink) return toast.error('Submission link or PDF URL required');
    setSub(true);
    try {
      await submitAssignment(form);
      toast.success('✅ Submitted to instructor!');
      setForm({ assignmentId:'', submissionLink:'', content:'' });
      onRefresh();
    } catch(e) { toast.error(em(e)); } finally { setSub(false); }
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-2">📝 Assignments</h3>
      <p style={{ color:'var(--el-muted)', marginBottom:24 }}>Assignments unlock after watching at least 1 video.</p>

      {enrollments.length > 0 && eligibleEnrollments.length === 0 && (
        <div className="el-card" style={{ border:'2px dashed #e9ecef', textAlign:'center', padding:40 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🎬</div>
          <h5 className="fw-700">Watch a video first</h5>
          <p style={{ color:'var(--el-muted)' }}>Go to the Videos tab and watch at least one lesson to unlock assignments.</p>
        </div>
      )}

      {eligibleEnrollments.length > 0 && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="el-card">
              <h5 className="fw-700 mb-4">Submit Assignment</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Select Course</label>
                  <select className="el-input" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                    <option value="">-- Select a course --</option>
                    {eligibleEnrollments.map(e => (
                      <option key={e._id} value={e.courseId._id}>{e.courseId.title}</option>
                    ))}
                  </select>
                </div>
                {selCourse && (
                  <>
                    <div className="mb-3">
                      <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Assignment</label>
                      <select className="el-input" value={form.assignmentId} onChange={e => setForm({...form, assignmentId:e.target.value})} disabled={loadingA}>
                        <option value="">-- Select --</option>
                        {assignments.map(a => (
                          <option key={a._id} value={a._id}>{a.title}</option>
                        ))}
                      </select>
                      {!loadingA && assignments.length === 0 && selCourse && (
                        <small style={{ color:'var(--el-muted)' }}>No assignments posted for this course yet.</small>
                      )}
                    </div>
                    {/* Show assignment attachment if any */}
                    {form.assignmentId && (() => {
                      const asgn = assignments.find(a => a._id === form.assignmentId);
                      if (!asgn || !asgn.attachmentUrl) return null;
                      return (
                        <div className="mb-3 p-3 rounded-3" style={{ background:'rgba(52,152,219,.07)', border:'1px solid rgba(52,152,219,.2)' }}>
                          <small className="fw-600" style={{ color:'#3498db' }}>
                            <i className="bi bi-paperclip me-2"></i>Assignment File:&nbsp;
                            <a href={asgn.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ color:'#3498db' }}>
                              View / Download
                            </a>
                          </small>
                        </div>
                      );
                    })()}
                    <div className="mb-3">
                      <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>
                        Submission <span style={{ color:'#999', fontWeight:400 }}>(PDF link, Google Drive, GitHub…)</span>
                      </label>
                      <div className="input-wrap">
                        <i className="bi bi-link-45deg icon-l"></i>
                        <input type="url" className="el-input" placeholder="https://drive.google.com/…"
                          value={form.submissionLink} onChange={e => setForm({...form, submissionLink:e.target.value})}
                          required style={{ paddingLeft:40 }} />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Notes (optional)</label>
                      <textarea className="el-input" rows="3" value={form.content}
                        onChange={e => setForm({...form, content:e.target.value})} style={{ resize:'none' }}></textarea>
                    </div>
                    <button type="submit" disabled={submitting} className="btn-gold" style={{ padding:'11px 32px' }}>
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
                        : <><i className="bi bi-send-fill"></i> Submit to Instructor</>
                      }
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="el-card h-100">
              <h5 className="fw-700 mb-4">My Submissions ({submissions.length})</h5>
              {submissions.length === 0
                ? <p style={{ color:'var(--el-muted)' }}>No submissions yet.</p>
                : submissions.map(s => (
                    <div key={s._id} className="submission-card mb-3">
                      <div className="fw-700" style={{ fontSize:'.88rem' }}>{s.assignmentId?.title}</div>
                      <div style={{ color:'var(--el-muted)', fontSize:'.78rem' }}>{s.courseId?.title}</div>
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <span className={`submission-status-badge ${s.status}`}>{s.status}</span>
                        {s.grade != null && <span className="fw-700" style={{ fontSize:'.83rem' }}>{s.grade}/100</span>}
                      </div>
                      {s.feedback && <p style={{ fontSize:'.78rem', color:'#555', marginTop:6, marginBottom:0 }}>{s.feedback}</p>}
                      {s.submissionLink && (
                        <a href={s.submissionLink} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:'.78rem', color:'var(--el-accent)', display:'block', marginTop:4 }}>
                          <i className="bi bi-link-45deg me-1"></i>View Submission
                        </a>
                      )}
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Quizzes ── */
const QuizzesSection = ({ enrollments, results }) => {
  const [selCourse, setSelCourse] = useState('');
  const [quizzes, setQuizzes]     = useState([]);
  const [loading, setLoading]     = useState(false);

  const load = async cid => {
    setSelCourse(cid); if(!cid)return;
    setLoading(true);
    try { const r=await getCourseQuizzes(cid,'practice'); setQuizzes(r.data?.quizzes||[]); }
    catch(e){toast.error(em(e));} finally{setLoading(false);}
  };
  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-4">🧠 Practice Quizzes</h3>
      <select className="el-input mb-4" style={{ maxWidth:420 }} value={selCourse} onChange={e=>load(e.target.value)}>
        <option value="">-- Select a course --</option>
        {enrollments.filter(e=>e.courseId).map(e=><option key={e._id} value={e.courseId._id}>{e.courseId.title}</option>)}
      </select>
      {loading && <div className="text-center py-4"><div className="el-spinner mx-auto"></div></div>}
      {!loading&&selCourse&&quizzes.length===0&&<p style={{ color:'var(--el-muted)' }}>No practice quizzes yet.</p>}
      <div className="row g-4">
        {quizzes.map((q,i)=>(
          <div key={q._id} className={`col-md-6 col-lg-4 el-fade-in-up el-d${Math.min(i+1,5)}`}>
            <div className="el-card el-hover">
              <div style={{ width:50,height:50,borderRadius:14,background:'rgba(52,152,219,.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
                <i className="bi bi-question-circle-fill" style={{ fontSize:'1.4rem',color:'#3498db' }}></i>
              </div>
              <h6 className="fw-700 mb-1">{q.title}</h6>
              <div className="d-flex gap-3 mb-3" style={{ fontSize:'.8rem',color:'#888' }}>
                <span><i className="bi bi-list-ol me-1"></i>{q.questions?.length} Qs</span>
                <span><i className="bi bi-clock me-1"></i>{q.duration} min</span>
              </div>
              <Link to={`/quiz/${q._id}`} className="btn-gold w-100" style={{ justifyContent:'center',padding:'9px' }}>
                <i className="bi bi-play-circle-fill"></i> Start Quiz
              </Link>
            </div>
          </div>
        ))}
      </div>
      {results.length>0&&(
        <div className="mt-5">
          <h5 className="fw-700 mb-3">My Results</h5>
          <div className="row g-3">
            {results.map(r=>(
              <div key={r._id} className="col-md-4">
                <div className="el-card text-center el-hover">
                  <div style={{ fontSize:'1.5rem',fontWeight:800,color:r.passed?'#00c9a7':'#e74c3c' }}>{r.percentage}%</div>
                  <div className="fw-600" style={{ fontSize:'.85rem' }}>{r.quizId?.title}</div>
                  <span className={`el-pill ${r.passed?'pill-green':'pill-red'} mt-1 d-inline-block`}>{r.passed?'✅ Passed':'❌ Failed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Final Exam ── */
const ExamSection = ({ enrollments }) => {
  const [selCourse, setSelCourse] = useState('');
  const [exam, setExam]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const completed = enrollments.filter(e=>(e.progress||0)>=100&&e.courseId);

  const load = async cid => {
    setSelCourse(cid); if(!cid)return;
    setLoading(true);
    try { const r=await getCourseQuizzes(cid,'exam'); setExam(r.data?.quizzes?.[0]||null); }
    catch(e){toast.error(em(e));} finally{setLoading(false);}
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-2">🎓 Final Exam</h3>
      <p style={{ color:'var(--el-muted)',marginBottom:24 }}>Score 75+ to earn your certificate.</p>
      {completed.length===0 ? (
        <div className="el-card text-center py-5 el-bounce-in"><div style={{ fontSize:'3rem',marginBottom:12 }}>🏆</div><h5 className="fw-700">Complete a course first</h5><p style={{ color:'var(--el-muted)' }}>Finish 100% of a course to unlock the final exam.</p></div>
      ) : (
        <>
          <select className="el-input mb-4" style={{ maxWidth:420 }} value={selCourse} onChange={e=>load(e.target.value)}>
            <option value="">-- Select completed course --</option>
            {completed.map(e=><option key={e._id} value={e.courseId._id}>{e.courseId.title}</option>)}
          </select>
          {loading&&<div className="text-center py-4"><div className="el-spinner mx-auto"></div></div>}
          {!loading&&selCourse&&!exam&&<div className="el-card" style={{ borderLeft:'4px solid var(--el-accent)',maxWidth:500 }}><p style={{ color:'#856404',marginBottom:0 }}><i className="bi bi-info-circle me-2"></i>No exam available yet. Contact your instructor.</p></div>}
          {exam&&(
            <div className="el-card el-scale-in" style={{ maxWidth:500,boxShadow:'var(--sh-md)' }}>
              <div style={{ width:56,height:56,borderRadius:16,background:'rgba(240,165,0,.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
                <i className="bi bi-mortarboard-fill" style={{ fontSize:'1.7rem',color:'var(--el-accent)' }}></i>
              </div>
              <h5 className="fw-700 mb-1">{exam.title}</h5>
              <div className="row g-2 mb-4">
                {[['bi-list-ol','Questions','20'],['bi-clock','Duration',`${exam.duration} min`],['bi-trophy','Passing','75/100'],['bi-star','Marks','100 total']].map(([ic,lb,vl],i)=>(
                  <div key={i} className="col-6"><div className="p-3 rounded-3 text-center" style={{ background:'#f8f9fa',border:'1px solid #e9ecef' }}><i className={`bi ${ic} d-block mb-1`} style={{ color:'var(--el-accent)',fontSize:'1.1rem' }}></i><div className="fw-700">{vl}</div><div style={{ fontSize:'.74rem',color:'#888' }}>{lb}</div></div></div>
                ))}
              </div>
              <div className="p-3 rounded-3 mb-4" style={{ background:'rgba(231,76,60,.05)',border:'1px solid rgba(231,76,60,.18)',fontSize:'.82rem',color:'#721c24' }}>
                <i className="bi bi-exclamation-triangle me-2"></i>Score &lt;75% → No certificate. You may retake.
              </div>
              <Link to={`/quiz/${exam._id}`} className="btn-gold w-100" style={{ justifyContent:'center',padding:'12px' }}>
                <i className="bi bi-play-circle-fill"></i> Start Final Exam
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── Certificates ── */
const CertsSection = ({ enrollments }) => {
  const earned = enrollments.filter(e => e.certificateIssued);
  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

  const downloadCert = (enrollId) => {
    // Pass JWT token as query param so direct URL download works
    const token = localStorage.getItem('edulearn_token');
    if (!token) { toast.error('Please login to download'); return; }
    const url = `${API_BASE}/api/certificate/${enrollId}?token=${encodeURIComponent(token)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EduLearn-Certificate.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="el-fade-in-up">
      <h3 className="fw-800 mb-4">🏆 My Certificates ({earned.length})</h3>
      {earned.length === 0 ? (
        <div className="el-card text-center py-5 el-bounce-in">
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🏆</div>
          <h5 className="fw-700">No certificates yet</h5>
          <p style={{ color:'var(--el-muted)' }}>Pass the final exam (75%+) to earn your certificate.</p>
        </div>
      ) : (
        <div className="row g-4">
          {earned.map((e, i) => (
            <div key={e._id} className={`col-md-6 col-lg-4 el-fade-in-up el-d${Math.min(i+1,5)}`}>
              <div className="cert-card">
                <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🏆</div>
                <div style={{ color:'var(--el-accent)', fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:700, marginBottom:8 }}>
                  Certificate of Completion
                </div>
                <div style={{ color:'#fff', fontWeight:700, marginBottom:4 }}>{e.courseId?.title}</div>
                <div style={{ color:'rgba(255,255,255,.6)', fontSize:'.82rem', marginBottom:18 }}>
                  {e.completedAt ? new Date(e.completedAt).toLocaleDateString('en-IN') : 'Completed'}
                </div>
                <button onClick={() => downloadCert(e._id)} className="cert-btn">
                  <i className="bi bi-download"></i> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileSection = ({ user }) => (
  <div className="el-fade-in-up" style={{ maxWidth:600 }}>
    <h3 className="fw-800 mb-4">My Profile</h3>
    <div className="el-card" style={{ boxShadow:'var(--sh-md)' }}>
      <div className="d-flex align-items-center gap-4 mb-4">
        <div style={{ width:76,height:76,borderRadius:'50%',background:'var(--g-accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',fontWeight:800,color:'#fff',boxShadow:'0 4px 16px rgba(240,165,0,.40)' }}>{user?.name?.charAt(0).toUpperCase()}</div>
        <div><h4 className="fw-700 mb-1">{user?.name}</h4><span className="el-pill pill-green">Student</span></div>
      </div>
      <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Email</label><input className="el-input" value={user?.email||''} disabled /></div>
      <div className="mb-3"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Name</label><input className="el-input" defaultValue={user?.name||''} /></div>
      <div className="mb-4"><label className="fw-600 d-block mb-2" style={{ fontSize:'.88rem' }}>Bio</label><textarea className="el-input" rows="3" defaultValue={user?.bio||''} style={{ resize:'none' }}></textarea></div>
      <button className="btn-gold"><i className="bi bi-check-circle-fill"></i> Save Changes</button>
    </div>
  </div>
);

export default StudentDashboard;
