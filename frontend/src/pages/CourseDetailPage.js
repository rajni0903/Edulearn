import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getCourse, checkEnrollment, enrollCourse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCourse(id);
        setCourse(res.data.course);
        setLessons(res.data.course.lessons || []);
        if (isAuthenticated) {
          const eRes = await checkEnrollment(id);
          setIsEnrolled(eRes.data.isEnrolled);
        }
      } catch { toast.error('Course not found'); navigate('/courses'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, isAuthenticated, navigate]);

  const handleEnroll = async () => {
    if (!isAuthenticated) { toast.info('Please login to enroll'); return navigate('/login'); }
    setEnrolling(true);
    try {
      await enrollCourse(id);
      setIsEnrolled(true);
      toast.success('🎉 Successfully enrolled!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally { setEnrolling(false); }
  };

  if (loading) return (
    <div><Navbar />
      <div className="text-center py-5"><div className="spinner-custom mx-auto"></div></div>
    </div>
  );

  if (!course) return null;

  const levelColor = { Beginner: '#00c9a7', Intermediate: '#f0a500', Advanced: '#dc3545' };

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'var(--gradient-main)', padding: '50px 0' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                <span className="cat-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{course.category}</span>
                <span style={{ background: `${levelColor[course.level]}25`, color: levelColor[course.level], padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600 }}>{course.level}</span>
              </div>
              <h1 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', lineHeight: 1.3 }}>{course.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginTop: '16px', fontSize: '1.05rem' }}>{course.description}</p>
              <div className="d-flex flex-wrap gap-4 mt-4" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                <span><i className="bi bi-people me-2" style={{ color: '#f0a500' }}></i>{course.totalStudents?.toLocaleString() || 0} students</span>
                <span><i className="bi bi-clock me-2" style={{ color: '#f0a500' }}></i>{course.duration}</span>
                <span><i className="bi bi-collection me-2" style={{ color: '#f0a500' }}></i>{lessons.length} lessons</span>
                <span><i className="bi bi-star-fill me-2" style={{ color: '#f0a500' }}></i>{course.rating || 4.5} rating</span>
              </div>
              <div className="d-flex align-items-center gap-3 mt-4">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                  {(course.instructorId?.name || course.instructorName || 'I')?.charAt(0)}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{course.instructorId?.name || course.instructorName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Course Instructor</div>
                </div>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="col-lg-5">
              <div className="p-4 rounded-4" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <img src={course.thumbnail} alt={course.title} className="img-fluid rounded-3 mb-4"
                  onError={e => { e.target.src = 'https://via.placeholder.com/400x220/0a1628/f0a500?text=EduLearn'; }} />
                <div className="text-center mb-3">
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {course.price === 0 ? <span style={{ color: '#00c9a7' }}>FREE</span> : `₹${course.price?.toLocaleString()}`}
                  </div>
                </div>
                {isEnrolled ? (
                  <div>
                    <div className="alert" style={{ background: 'rgba(0,201,167,0.1)', border: '1px solid #00c9a7', color: '#00c9a7', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}>
                      <i className="bi bi-check-circle-fill me-2"></i>You're enrolled!
                    </div>
                    <Link to="/student" className="btn btn-primary-custom w-100 py-3">
                      <i className="bi bi-play-circle me-2"></i>Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary-custom w-100 py-3" style={{ fontSize: '1.1rem' }}>
                    {enrolling ? <><span className="spinner-border spinner-border-sm me-2"></span>Enrolling...</> : <><i className="bi bi-lightning-fill me-2"></i>Enroll Now</>}
                  </button>
                )}
                <div className="mt-3 text-center" style={{ fontSize: '0.85rem', color: '#999' }}>
                  <i className="bi bi-shield-check me-1 text-success"></i>30-day money-back guarantee
                </div>
                <hr />
                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                  {[['bi-infinity', 'Lifetime access'], ['bi-phone', 'Mobile friendly'], ['bi-award', 'Certificate of completion'], ['bi-translate', 'Hindi & English']].map(([icon, text], i) => (
                    <div key={i} className="d-flex align-items-center gap-2">
                      <i className={`bi ${icon}`} style={{ color: 'var(--accent)' }}></i>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: '0px', zIndex: 100 }}>
        <div className="container">
          <div className="d-flex gap-0">
            {[['overview', 'Overview'], ['curriculum', 'Curriculum'], ['instructor', 'Instructor']].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '16px 24px', border: 'none', background: 'none', fontWeight: 600, color: activeTab === tab ? 'var(--accent)' : '#666', borderBottom: `3px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.3s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-5">
        {activeTab === 'overview' && (
          <div className="row g-5">
            <div className="col-lg-8">
              <h3 className="fw-700 mb-4">What You'll Learn</h3>
              <div className="row g-3">
                {['Complete understanding of the subject', 'Hands-on projects and assignments', 'Real-world problem solving skills', 'Industry best practices', 'Certificate of completion', 'Lifetime access to content'].map((item, i) => (
                  <div key={i} className="col-md-6">
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill mt-1" style={{ color: '#00c9a7', flexShrink: 0 }}></i>
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="fw-700 mt-5 mb-3">Course Description</h3>
              <p style={{ color: '#555', lineHeight: 1.9 }}>{course.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div style={{ maxWidth: '780px' }}>
            <h3 className="fw-700 mb-4">Course Curriculum — {lessons.length} Lessons</h3>
            <div className="d-flex flex-column gap-2">
              {lessons.length === 0 && <p className="text-muted">No lessons added yet.</p>}
              {lessons.map((lesson, i) => (
                <div key={lesson._id} className="d-flex align-items-center gap-3 p-4 rounded-3"
                  style={{ border: '1px solid #f0f0f0', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(0,201,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="bi bi-play-circle-fill" style={{ color: '#00c9a7' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-600">{i + 1}. {lesson.title}</div>
                    {lesson.notes && <small className="text-muted">{lesson.notes?.substring(0, 80)}...</small>}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted"><i className="bi bi-clock me-1"></i>{lesson.duration}</small>
                    {lesson.isFree && <span style={{ background: 'rgba(0,201,167,0.1)', color: '#00c9a7', padding: '2px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600 }}>Free</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'instructor' && (
          <div className="p-4 rounded-4" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)', maxWidth: '600px' }}>
            <div className="d-flex align-items-center gap-4 mb-4">
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(course.instructorId?.name || 'I')?.charAt(0)}
              </div>
              <div>
                <h4 className="fw-700 mb-1">{course.instructorId?.name || course.instructorName}</h4>
                <p className="text-muted mb-0">Expert Instructor at EduLearn</p>
              </div>
            </div>
            <p style={{ color: '#555', lineHeight: 1.8 }}>{course.instructorId?.bio || 'Experienced industry professional with deep expertise in the field. Passionate about teaching and helping students achieve their learning goals.'}</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetailPage;
