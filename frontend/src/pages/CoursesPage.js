import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import { getCourses } from '../services/api';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const categories = ['All', 'Web Development', 'Data Science', 'Mobile Development', 'DevOps', 'Design', 'Marketing', 'Business', 'Other'];
const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCat(cat);
  }, [searchParams]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (selectedCat !== 'All') params.category = selectedCat;
      if (selectedLevel !== 'All') params.level = selectedLevel;
      if (search.trim()) params.search = search.trim();
      const res = await getCourses(params);
      setCourses(res.data.courses);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      // Network error pe existing data mat clear karo — setCourses([]) NAHI karenge
      const msg = err?.isNetworkError
        ? 'Network error — check your connection and try again.'
        : (err?.response?.data?.message || 'Failed to load courses.');
      toast.error(msg);
    }
    finally { setLoading(false); }
  }, [page, selectedCat, selectedLevel, search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { setPage(1); }, [selectedCat, selectedLevel]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchCourses(); };

  return (
    <div>
      <Navbar />

      {/* Page Header */}
      <div style={{ background: 'var(--gradient-main)', padding: '60px 0 40px' }}>
        <div className="container">
          <div className="text-center mb-4">
            <h1 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '2.5rem' }}>Explore All Courses</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Discover {total}+ courses to level up your skills</p>
          </div>
          <form onSubmit={handleSearch} className="d-flex justify-content-center">
            <div className="d-flex w-100" style={{ maxWidth: '600px', background: '#fff', borderRadius: '50px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', padding: '6px' }}>
              <i className="bi bi-search d-flex align-items-center px-3" style={{ color: '#adb5bd', fontSize: '1.1rem' }}></i>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses, topics, skills..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', background: 'transparent' }} />
              <button type="submit" className="btn btn-primary-custom" style={{ borderRadius: '50px', padding: '8px 24px' }}>Search</button>
            </div>
          </form>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          {/* Sidebar Filter */}
          <div className="col-lg-3">
            <div className="widget-card sticky-top" style={{ top: '80px' }}>
              <h5 className="fw-700 mb-4" style={{ color: 'var(--primary)' }}>
                <i className="bi bi-funnel me-2" style={{ color: 'var(--accent)' }}></i>Filters
              </h5>
              <div className="mb-4">
                <h6 className="fw-600 mb-3 text-muted text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '1px' }}>Category</h6>
                {categories.map(cat => (
                  <button key={cat} onClick={() => { setSelectedCat(cat); setPage(1); }}
                    className="d-flex align-items-center justify-content-between w-100 mb-2 px-3 py-2 rounded-2"
                    style={{ border: `1px solid ${selectedCat === cat ? 'var(--accent)' : '#e9ecef'}`, background: selectedCat === cat ? 'rgba(240,165,0,0.1)' : '#fff', color: selectedCat === cat ? 'var(--accent)' : '#555', fontWeight: selectedCat === cat ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>
                    {cat}
                    {selectedCat === cat && <i className="bi bi-check-circle-fill" style={{ color: 'var(--accent)' }}></i>}
                  </button>
                ))}
              </div>
              <div>
                <h6 className="fw-600 mb-3 text-muted text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '1px' }}>Level</h6>
                {levels.map(lvl => (
                  <button key={lvl} onClick={() => { setSelectedLevel(lvl); setPage(1); }}
                    className="d-flex align-items-center justify-content-between w-100 mb-2 px-3 py-2 rounded-2"
                    style={{ border: `1px solid ${selectedLevel === lvl ? 'var(--accent)' : '#e9ecef'}`, background: selectedLevel === lvl ? 'rgba(240,165,0,0.1)' : '#fff', color: selectedLevel === lvl ? 'var(--accent)' : '#555', fontWeight: selectedLevel === lvl ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>
                    {lvl}
                    {selectedLevel === lvl && <i className="bi bi-check-circle-fill" style={{ color: 'var(--accent)' }}></i>}
                  </button>
                ))}
              </div>
              {(selectedCat !== 'All' || selectedLevel !== 'All' || search) && (
                <button onClick={() => { setSelectedCat('All'); setSelectedLevel('All'); setSearch(''); setPage(1); }}
                  className="btn w-100 mt-3" style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', fontWeight: 600 }}>
                  <i className="bi bi-x-circle me-2"></i>Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Course Grid */}
          <div className="col-lg-9">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <span className="fw-600" style={{ color: 'var(--primary)' }}>{total} courses found</span>
                {selectedCat !== 'All' && <span className="ms-2 cat-badge">{selectedCat}</span>}
              </div>
              <small className="text-muted">Page {page} of {pages}</small>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-custom mx-auto mb-3"></div>
                <p className="text-muted">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '4rem' }}>🔍</div>
                <h4 className="mt-3">No courses found</h4>
                <p className="text-muted">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className="row g-4">
                {courses.map((course, i) => (
                  <div key={course._id} className="col-md-6 col-lg-4 fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn" style={{ border: '2px solid #e9ecef', borderRadius: '10px', padding: '8px 16px' }}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="btn" style={{ border: `2px solid ${page === p ? 'var(--accent)' : '#e9ecef'}`, background: page === p ? 'var(--accent)' : '#fff', color: page === p ? '#fff' : '#333', borderRadius: '10px', padding: '8px 16px', fontWeight: 600 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="btn" style={{ border: '2px solid #e9ecef', borderRadius: '10px', padding: '8px 16px' }}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CoursesPage;
