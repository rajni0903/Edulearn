/**
 * API Service - Axios instance with JWT + all endpoints
 * 
 * IMPORTANT: Frontend package.json me "proxy": "http://localhost:5000" set hai
 * Isliye baseURL relative rakha hai — /api/... 
 * Yeh CORS problem solve karta hai kyunki browser same-origin se request karta hai
 * aur CRA dev server usse backend pe forward karta hai.
 * 
 * Production me REACT_APP_API_URL .env se set karo.
 */
import axios from 'axios';

// Development: proxy use karo (no CORS)
// Production: REACT_APP_API_URL set karo
const BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : '/api';

const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: false,
});

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('edulearn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Handle responses globally
API.interceptors.response.use(
  res => res,
  err => {
    // Only logout on actual 401 auth error, NOT on network errors
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('edulearn_token');
      localStorage.removeItem('edulearn_user');
      window.location.href = '/login';
    }
    // Network error (no response from server)
    if (!err.response) {
      err.isNetworkError = true;
      err.message = 'Server se connect nahi ho pa raha — please check backend is running.';
    }
    return Promise.reject(err);
  }
);

// ── Auth
export const register      = d => API.post('/auth/register', d);
export const login         = d => API.post('/auth/login', d);
export const getProfile    = () => API.get('/auth/profile');
export const updateProfile = d => API.put('/auth/profile', d);

// ── Courses
export const getCourses           = p           => API.get('/courses', { params: p });
export const getCourse            = id          => API.get(`/courses/${id}`);
export const createCourse         = d           => API.post('/courses', d);
export const updateCourse         = (id, d)     => API.put(`/courses/${id}`, d);
export const deleteCourse         = id          => API.delete(`/courses/${id}`);
export const getInstructorCourses = ()          => API.get('/courses/instructor/my-courses');
export const addVideo             = (cid, d)    => API.post(`/courses/${cid}/videos`, d);
export const updateVideo          = (cid,vid,d) => API.put(`/courses/${cid}/videos/${vid}`, d);
export const deleteVideo          = (cid, vid)  => API.delete(`/courses/${cid}/videos/${vid}`);

// ── Enrollments
export const enrollCourse      = courseId       => API.post('/enrollments', { courseId });
export const getMyCourses      = ()             => API.get('/enrollments/my-courses');
export const checkEnrollment   = courseId       => API.get(`/enrollments/check/${courseId}`);
export const updateProgress    = (id, d)        => API.put(`/enrollments/${id}/progress`, d);
export const markVideoComplete = (id, videoId)  => API.put(`/enrollments/${id}/video-progress`, { videoId });
export const getAllEnrollments = ()             => API.get('/enrollments/all');

// ── Quizzes
export const getCourseQuizzes = (cid, type) => API.get(`/quizzes/course/${cid}`, { params: type ? { type } : {} });
export const getQuiz          = id          => API.get(`/quizzes/${id}`);
export const createQuiz       = d           => API.post('/quizzes', d);
export const updateQuiz       = (id, d)     => API.put(`/quizzes/${id}`, d);
export const deleteQuiz       = id          => API.delete(`/quizzes/${id}`);
export const submitQuiz       = d           => API.post('/quizzes/submit', d);
export const getMyQuizResults = ()          => API.get('/quizzes/results/my');

// ── Assignments
export const getCourseAssignments  = cid       => API.get(`/assignments/course/${cid}`);
export const createAssignment      = d         => API.post('/assignments', d);
export const updateAssignment      = (id, d)   => API.put(`/assignments/${id}`, d);
export const deleteAssignment      = id        => API.delete(`/assignments/${id}`);
export const submitAssignment      = d         => API.post('/assignments/submit', d);
export const getMySubmissions      = ()        => API.get('/assignments/my-submissions');
export const getInstructorReceived = ()        => API.get('/assignments/instructor/received');
export const markSubmissionSeen    = id        => API.put(`/assignments/${id}/seen`);
export const gradeSubmission       = (id, d)   => API.put(`/assignments/grade/${id}`, d);
export const getAssignment         = id        => API.get(`/assignments/${id}`);

// ── Admin
export const getAdminStats         = ()           => API.get('/admin/stats');
export const getAdminUsers         = p            => API.get('/admin/users', { params: p });
export const adminCreateUser       = d            => API.post('/admin/users', d);
export const adminUpdateUser       = (id, d)      => API.put(`/admin/users/${id}`, d);
export const toggleUserStatus      = id           => API.put(`/admin/users/${id}/toggle`);
export const deleteUser            = id           => API.delete(`/admin/users/${id}`);
export const getPendingInstructors = ()           => API.get('/admin/instructors/pending');
export const approveInstructor     = (id, action) => API.put(`/admin/instructors/${id}/approve`, { action });
export const getAdminCourses       = p            => API.get('/admin/courses', { params: p });
export const adminDeleteCourse     = id           => API.delete(`/admin/courses/${id}`);
export const getAdminEnrollments   = p            => API.get('/admin/enrollments', { params: p });

// Admin Quiz CRUD
export const getAdminQuizzes     = p       => API.get('/admin/quizzes', { params: p });
export const getAdminQuiz        = id      => API.get(`/admin/quizzes/${id}`);
export const adminUpdateQuiz     = (id, d) => API.put(`/admin/quizzes/${id}`, d);
export const adminDeleteQuiz     = id      => API.delete(`/admin/quizzes/${id}`);
export const adminAddQuestion    = (id, d) => API.post(`/admin/quizzes/${id}/questions`, d);
export const adminRemoveQuestion = (id,qi) => API.delete(`/admin/quizzes/${id}/questions/${qi}`);

// Admin Assignment CRUD
export const getAdminAssignments   = p       => API.get('/admin/assignments', { params: p });
export const adminUpdateAssignment = (id, d) => API.put(`/admin/assignments/${id}`, d);
export const adminDeleteAssignment = id      => API.delete(`/admin/assignments/${id}`);

// Admin quiz results
export const getAdminQuizResults = () => API.get('/admin/quiz-results');

// ── Admin Categories
export const getAdminCategories  = ()       => API.get('/admin/categories');
export const getPublicCategories = ()       => API.get('/admin/categories/public');
export const createCategory      = d        => API.post('/admin/categories', d);
export const updateCategory      = (id, d)  => API.put(`/admin/categories/${id}`, d);
export const deleteCategory      = id       => API.delete(`/admin/categories/${id}`);

export default API;
