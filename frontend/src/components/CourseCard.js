/**
 * CourseCard - Course listing card with hover animations
 * Updated: dark gradient overlay, rounded corners, hover zoom, soft shadow
 * Uses ONLY CSS classes (no inline styles for image fixes)
 */
import React from 'react';
import { Link } from 'react-router-dom';

const Stars = ({ rating = 0 }) => Array.from({ length:5 }, (_,i) => (
  <i key={i} className={`bi bi-star${i < Math.floor(rating) ? '-fill' : i < rating ? '-half' : ''}`} style={{ color:'#f0a500', fontSize:'.8rem' }}></i>
));

const CourseCard = ({ course }) => (
  <div className="course-card card h-100">
    {/* Image wrapper — CSS handles overlay, zoom, rounded corners */}
    <div className="course-card__img-wrap">
      <img
        src={course.thumbnail || 'https://via.placeholder.com/400x200/0a1628/f0a500?text=EduLearn'}
        alt={course.title}
        className="course-card__img"
        onError={e => { e.target.src='https://via.placeholder.com/400x200/0a1628/f0a500?text=EduLearn'; }}
      />
      {/* Dark gradient overlay */}
      <div className="course-card__overlay"></div>
      <div className="course-card__badge-wrap">
        <span className="course-card__cat-badge">{course.category}</span>
      </div>
    </div>

    <div className="card-body d-flex flex-column p-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className={`badge-${course.level?.toLowerCase() || 'beginner'}`}>{course.level}</span>
      </div>
      <h5 className="course-card__title">{course.title}</h5>
      <p className="course-card__desc">{course.description}</p>
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="course-card__avatar">
          {(course.instructorId?.name || course.instructorName || 'I')?.charAt(0)}
        </div>
        <small style={{ color:'var(--el-muted)' }}>{course.instructorId?.name || course.instructorName || 'Instructor'}</small>
      </div>
      <div className="d-flex align-items-center gap-1 mb-3">
        <Stars rating={course.rating} />
        <small style={{ color:'var(--el-muted)', marginLeft:3 }}>({course.rating || 0})</small>
        <small style={{ color:'var(--el-muted)', marginLeft:'auto' }}>
          <i className="bi bi-people me-1"></i>{(course.totalStudents || 0).toLocaleString()}
        </small>
      </div>
      <div className="d-flex gap-3 mb-3 course-card__meta">
        <span><i className="bi bi-clock me-1"></i>{course.duration}</span>
        <span><i className="bi bi-camera-video me-1"></i>{course.videos?.length || 0} videos</span>
      </div>
      <div className="mt-auto d-flex align-items-center justify-content-between">
        <div>
          {course.price === 0
            ? <span className="course-card__price-free">FREE</span>
            : <span className="course-card__price">₹{course.price?.toLocaleString()}</span>
          }
        </div>
        <Link to={`/courses/${course._id}`} className="btn-gold" style={{ padding:'7px 18px', fontSize:'.82rem' }}>
          View Course <i className="bi bi-arrow-right ms-1"></i>
        </Link>
      </div>
    </div>
  </div>
);

export default CourseCard;
