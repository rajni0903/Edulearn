/**
 * Sidebar - Role-aware navigation with animated active state
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';

const STUDENT_LINKS = [
  { s:'',             i:'bi-speedometer2',         l:'Dashboard'         },
  { s:'courses',      i:'bi-book-fill',             l:'My Courses'        },
  { s:'videos',       i:'bi-play-circle-fill',      l:'Course Videos'     },
  { s:'quizzes',      i:'bi-question-circle-fill',  l:'Practice Quizzes'  },
  { s:'exam',         i:'bi-mortarboard-fill',      l:'Final Exam'        },
  { s:'assignments',  i:'bi-file-earmark-text',     l:'Assignments'       },
  { s:'certificates', i:'bi-award-fill',            l:'Certificates'      },
  { s:'profile',      i:'bi-person-circle',         l:'My Profile'        },
];

const INSTRUCTOR_LINKS = [
  { s:'',            i:'bi-speedometer2',           l:'Dashboard'           },
  { s:'courses',     i:'bi-collection-fill',        l:'My Courses'          },
  { s:'create',      i:'bi-plus-circle-fill',       l:'Create Course'       },
  { s:'videos',      i:'bi-camera-video-fill',      l:'Manage Videos'       },
  { s:'assignments', i:'bi-file-earmark-text',      l:'Create Assignments'  },
  { s:'submissions', i:'bi-inbox-fill',             l:'Student Submissions' },
  { s:'quizzes',     i:'bi-patch-question-fill',    l:'Manage Quizzes'      },
  { s:'analytics',   i:'bi-bar-chart-fill',         l:'Analytics'           },
  { s:'profile',     i:'bi-person-circle',          l:'My Profile'          },
];

const ADMIN_LINKS = [
  { s:'',            i:'bi-speedometer2',           l:'Overview'             },
  { s:'approvals',   i:'bi-person-check-fill',      l:'Instructor Approvals' },
  { s:'users',       i:'bi-people-fill',            l:'Manage Users'         },
  { s:'courses',     i:'bi-collection-fill',        l:'Manage Courses'       },
  { s:'categories',  i:'bi-grid-3x3-gap-fill',      l:'Categories'           },
  { s:'quizzes',     i:'bi-question-circle-fill',   l:'Manage Quizzes'       },
  { s:'assignments', i:'bi-file-earmark-fill',      l:'Assignments'          },
  { s:'enrollments', i:'bi-journal-check',          l:'Enrollments'          },
  { s:'analytics',   i:'bi-graph-up-arrow',         l:'Analytics'            },
];

const avatarBg = role => ({ admin:'linear-gradient(135deg,#e74c3c,#c0392b)', instructor:'linear-gradient(135deg,#3498db,#2980b9)', student:'linear-gradient(135deg,#f0a500,#e67e22)' }[role] || 'var(--g-accent)');
const roleCol  = role => ({ admin:'#e74c3c', instructor:'#3498db', student:'#00c9a7' }[role] || '#f0a500');

const Sidebar = ({ activeSection, setActiveSection, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const links = user?.role === 'admin' ? ADMIN_LINKS : user?.role === 'instructor' ? INSTRUCTOR_LINKS : STUDENT_LINKS;

  return (
    <div className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <i className="bi bi-mortarboard-fill me-2"></i>EduLearn
      </div>

      {/* User badge */}
      <div style={{ padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,.10)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11, background:'rgba(255,255,255,.07)', borderRadius:12, padding:'10px 12px', border:'1px solid rgba(255,255,255,.10)' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:avatarBg(user?.role), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:'1rem', flexShrink:0, boxShadow:'0 3px 10px rgba(0,0,0,.25)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ color:'#fff', fontWeight:600, fontSize:'.86rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ color:roleCol(user?.role), fontSize:'.72rem', textTransform:'capitalize', fontWeight:600 }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ padding:'10px 0', flex:1, overflowY:'auto' }}>
        {links.map(link => (
          <button key={link.s} onClick={() => setActiveSection(link.s)}
            className={`sb-link ${activeSection === link.s ? 'active' : ''}`}>
            <i className={`bi ${link.i}`}></i>
            <span>{link.l}</span>
            {activeSection === link.s && <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--el-accent)', marginLeft:'auto', flexShrink:0 }}></div>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,.10)' }}>
        <button onClick={logout}
          style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'rgba(231,76,60,.12)', border:'1px solid rgba(231,76,60,.22)', borderRadius:10, color:'#ff6b6b', cursor:'pointer', padding:'10px 14px', fontFamily:'Poppins,sans-serif', fontSize:'.87rem', fontWeight:600, transition:'all .22s' }}
          onMouseOver={e => { e.currentTarget.style.background='rgba(231,76,60,.22)'; e.currentTarget.style.transform='translateX(3px)'; }}
          onMouseOut={e  => { e.currentTarget.style.background='rgba(231,76,60,.12)'; e.currentTarget.style.transform='translateX(0)'; }}>
          <i className="bi bi-box-arrow-right fs-5"></i> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
