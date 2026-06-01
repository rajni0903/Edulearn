import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { submitAssignment, getAssignment } from '../services/api';
import { toast } from 'react-toastify';

const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ submissionLink: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await getAssignment(assignmentId);
        setAssignment(res.data.assignment);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Assignment load nahi hua');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.submissionLink) return toast.error('Submission link required hai');
    setSubmitting(true);
    try {
      await submitAssignment({ assignmentId, submissionLink: form.submissionLink, content: form.content });
      setSubmitted(true);
      toast.success('✅ Assignment submitted to your Instructor!');
    } catch (err) {
      const msg = err?.isNetworkError
        ? 'Network error — backend se connect nahi ho pa raha'
        : (err?.response?.data?.message || 'Submission failed');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers
  const isOverdue = assignment?.dueDate && new Date() > new Date(assignment.dueDate);
  const fmtDate   = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'No deadline';

  if (loading) return (
    <div><Navbar />
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color:'var(--accent)' }} role="status"></div>
        <p className="mt-3 text-muted">Loading assignment...</p>
      </div>
    </div>
  );

  if (!assignment) return (
    <div><Navbar />
      <div className="container py-5 text-center">
        <div style={{ fontSize:'3rem' }}>📭</div>
        <h4 className="mt-3">Assignment not found</h4>
        <Link to="/student" className="btn btn-primary-custom mt-3">Back to Dashboard</Link>
      </div>
    </div>
  );

  if (submitted) return (
    <div><Navbar />
      <div className="container py-5" style={{ maxWidth: 600 }}>
        <div className="widget-card text-center fade-in">
          <div style={{ fontSize:'4rem', marginBottom:16 }}>✅</div>
          <h3 className="fw-800 mb-2" style={{ color:'#00c9a7' }}>Submitted!</h3>
          <p className="text-muted mb-1">
            <strong>{assignment.title}</strong> successfully submitted.
          </p>
          <p className="text-muted mb-4">Instructor review karega aur grade dega.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/student" className="btn btn-primary-custom"><i className="bi bi-speedometer2 me-2"></i>Dashboard</Link>
            <button onClick={() => setSubmitted(false)} className="btn btn-outline-custom"><i className="bi bi-pencil me-2"></i>Edit Submission</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div><Navbar />
      <div className="container py-5" style={{ maxWidth: 760 }}>
        {/* Back button */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)}
            style={{ width:40, height:40, borderRadius:10, border:'2px solid #e9ecef', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="bi bi-arrow-left" style={{ color:'#555' }}></i>
          </button>
          <h2 className="fw-800 mb-0">Submit Assignment</h2>
        </div>

        {/* Assignment Details Card */}
        <div className="widget-card mb-4">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
            <h4 className="fw-800 mb-0" style={{ color:'var(--primary)' }}>
              <i className="bi bi-file-earmark-text me-2" style={{ color:'var(--accent)' }}></i>
              {assignment.title}
            </h4>
            {isOverdue && (
              <span className="badge" style={{ background:'#ff6b6b', color:'#fff', borderRadius:8, padding:'4px 12px' }}>
                ⚠️ Overdue
              </span>
            )}
          </div>

          {assignment.description && (
            <p className="text-muted mb-3" style={{ lineHeight:1.7 }}>{assignment.description}</p>
          )}

          <div className="row g-3">
            <div className="col-sm-6">
              <div className="p-3 rounded-3" style={{ background:'#f8f9fa', border:'1px solid #e9ecef' }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-event" style={{ color:'var(--accent)', fontSize:'1.1rem' }}></i>
                  <div>
                    <div style={{ fontSize:'.75rem', color:'#999', fontWeight:600, textTransform:'uppercase' }}>Due Date</div>
                    <div className="fw-600" style={{ color: isOverdue ? '#ff6b6b' : 'var(--primary)', fontSize:'.9rem' }}>
                      {fmtDate(assignment.dueDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="p-3 rounded-3" style={{ background:'#f8f9fa', border:'1px solid #e9ecef' }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-trophy" style={{ color:'var(--accent)', fontSize:'1.1rem' }}></i>
                  <div>
                    <div style={{ fontSize:'.75rem', color:'#999', fontWeight:600, textTransform:'uppercase' }}>Max Marks</div>
                    <div className="fw-600" style={{ color:'var(--primary)', fontSize:'.9rem' }}>
                      {assignment.maxMarks || 100} marks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {assignment.attachmentUrl && (
            <div className="mt-3">
              <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer"
                className="btn btn-outline-custom btn-sm">
                <i className="bi bi-paperclip me-2"></i>View Assignment File
              </a>
            </div>
          )}
        </div>

        {/* Submission Form */}
        <div className="widget-card">
          <h5 className="fw-700 mb-4">
            <i className="bi bi-upload me-2" style={{ color:'var(--accent)' }}></i>Your Submission
          </h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="fw-600 mb-2">
                Submission Link *
                <span style={{ color:'#999', fontWeight:400, fontSize:'.85rem' }}> (GitHub / Google Drive / Replit / any URL)</span>
              </label>
              <div className="position-relative">
                <i className="bi bi-link-45deg position-absolute"
                  style={{ left:14, top:'50%', transform:'translateY(-50%)', color:'#adb5bd', fontSize:'1.1rem' }}></i>
                <input type="url" className="form-control-custom"
                  placeholder="https://github.com/yourusername/project"
                  value={form.submissionLink}
                  onChange={e => setForm({ ...form, submissionLink: e.target.value })}
                  style={{ paddingLeft:44 }} required />
              </div>
              <small className="text-muted">Yeh link automatically instructor ke dashboard me jayega.</small>
            </div>

            <div className="mb-4">
              <label className="fw-600 mb-2">
                Additional Notes
                <span style={{ color:'#999', fontWeight:400, fontSize:'.85rem' }}> (Optional)</span>
              </label>
              <textarea className="form-control-custom" rows="4"
                placeholder="Apna approach describe karo, key features, challenges faced..."
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                style={{ resize:'vertical' }} />
            </div>

            <div className="p-3 rounded-3 mb-4"
              style={{ background:'rgba(0,201,167,.06)', border:'1px solid rgba(0,201,167,.2)', fontSize:'.85rem', color:'#155724' }}>
              <i className="bi bi-info-circle me-2" style={{ color:'#00c9a7' }}></i>
              Submission link <strong>automatically instructor ko send</strong> hogi review aur grading ke liye.
            </div>

            <div className="d-flex gap-3 flex-wrap">
              <button type="submit" disabled={submitting} className="btn btn-primary-custom px-5 py-3" style={{ fontSize:'1rem' }}>
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                  : <><i className="bi bi-send me-2"></i>Submit to Instructor</>}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-custom py-3 px-4">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
