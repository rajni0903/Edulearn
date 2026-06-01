/**
 * QuizPage — Premium quiz UI: one question at a time, timer, progress bar,
 * result screen with correct/incorrect review, bilingual toggle
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getQuiz, submitQuiz } from '../services/api';
import { toast } from 'react-toastify';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate   = useNavigate();

  const [quiz, setQuiz]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [answers, setAnswers]   = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]     = useState(null);
  const [submitting, setSub]    = useState(false);
  const [startTime, setStart]   = useState(null);
  const [lang, setLang]         = useState('en');
  const [correctAnswers, setCorrect] = useState([]);  // for review screen

  // Load quiz
  useEffect(() => {
    getQuiz(quizId)
      .then(r => {
        setQuiz(r.data.quiz);
        setAnswers(new Array(r.data.quiz.questions.length).fill(-1));
        setTimeLeft(r.data.quiz.duration * 60);
      })
      .catch(() => { toast.error('Quiz not found'); navigate('/student'); })
      .finally(() => setLoading(false));
  }, [quizId, navigate]);

  // Auto-submit when timer hits 0
  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    if (auto) toast.info('⏰ Time up! Submitting…');
    setSub(true);
    try {
      const res = await submitQuiz({ quizId, answers, timeTaken });
      const r   = res.data.result;
      setResult(r);
      setCorrect(r.correctAnswers || []);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally { setSub(false); }
  }, [quizId, answers, startTime, submitting]);

  // Countdown
  useEffect(() => {
    if (!started || submitted) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted, timeLeft, handleSubmit]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pct  = () => Math.round(((currentQ + 1) / (quiz?.questions?.length || 1)) * 100);

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div><Navbar />
      <div className="text-center py-5"><div className="el-spinner mx-auto mb-3"></div><p className="text-muted">Loading quiz…</p></div>
    </div>
  );
  if (!quiz) return null;

  const q    = quiz.questions[currentQ];
  const OPTS = ['A','B','C','D','E','F'];
  const opts = (lang === 'hi' && q.optionsHindi?.length) ? q.optionsHindi : q.options;
  const qTxt = (lang === 'hi' && q.questionHindi) ? q.questionHindi : q.question;

  // ── Result Screen ────────────────────────────────────────
  if (submitted && result) {
    const isExam = quiz.type === 'exam';
    return (
      <div><Navbar />
        <div className="container py-5" style={{ maxWidth:700 }}>
          <div className="el-card el-bounce-in text-center" style={{ boxShadow:'var(--sh-lg)' }}>
            {/* Score circle */}
            <div style={{ width:130,height:130,borderRadius:'50%',border:`6px solid ${result.passed?'#00c9a7':'#e74c3c'}`,background:result.passed?'rgba(0,201,167,.08)':'rgba(231,76,60,.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',flexDirection:'column' }}>
              <span style={{ fontSize:'2.6rem',fontWeight:800,color:result.passed?'#00c9a7':'#e74c3c' }}>{result.percentage}%</span>
            </div>

            <h2 className="fw-800 mb-2" style={{ color:result.passed?'#00c9a7':'#e74c3c' }}>
              {result.passed ? '🎉 ' + (isExam ? 'Exam Passed! Certificate Earned!' : 'Quiz Passed!') : '😔 ' + (isExam ? 'Exam Failed' : 'Quiz Failed')}
            </h2>
            <p style={{ color:'var(--el-muted)', marginBottom:28 }}>
              {isExam && result.passed ? 'Congratulations! Go to Certificates section to download your PDF certificate.' : isExam ? `You need ${result.passingScore}% to pass. Please retake.` : 'Keep practicing to improve your score!'}
            </p>

            {/* Score grid */}
            <div className="row g-3 mb-5" style={{ maxWidth:420, margin:'0 auto 28px' }}>
              {[
                { l:'Score',         v:`${result.score}/${result.totalMarks}`, c:'#0d6efd' },
                { l:'Percentage',    v:`${result.percentage}%`, c:result.passed?'#00c9a7':'#e74c3c' },
                { l:'Passing Score', v:`${result.passingScore}%`, c:'#f0a500' },
                { l:'Status',        v:result.passed?'PASSED':'FAILED', c:result.passed?'#00c9a7':'#e74c3c' },
              ].map((s,i) => (
                <div key={i} className="col-6">
                  <div className="p-3 rounded-3 text-center" style={{ background:`${s.c}0d`,border:`1px solid ${s.c}28` }}>
                    <div style={{ fontSize:'1.5rem',fontWeight:800,color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:'.78rem',color:'var(--el-muted)' }}>{s.l}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer Review */}
            {correctAnswers.length > 0 && (
              <div className="text-start mb-4">
                <h5 className="fw-700 mb-3">Answer Review</h5>
                {quiz.questions.map((q, i) => {
                  const userAns    = answers[i];
                  const correctAns = correctAnswers[i];
                  const isRight    = userAns === correctAns;
                  return (
                    <div key={i} className="mb-3 p-3 rounded-3" style={{ background:isRight?'rgba(0,201,167,.06)':'rgba(231,76,60,.06)',border:`1px solid ${isRight?'#00c9a7':'#e74c3c'}` }}>
                      <div className="fw-600 mb-2" style={{ fontSize:'.88rem' }}>
                        {i+1}. {q.question}
                        <span className="ms-2" style={{ color:isRight?'#00c9a7':'#e74c3c' }}>
                          {isRight ? '✓ Correct' : '✗ Wrong'}
                        </span>
                      </div>
                      {!isRight && (
                        <div style={{ fontSize:'.82rem', color:'var(--el-muted)' }}>
                          <span style={{ color:'#e74c3c' }}>Your answer: {userAns >= 0 ? `${OPTS[userAns]}. ${q.options[userAns]}` : 'Not answered'}</span>
                          <br />
                          <span style={{ color:'#00c9a7' }}>Correct: {OPTS[correctAns]}. {q.options[correctAns]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {isExam && result.passed && (
              <div className="p-4 rounded-3 mb-4" style={{ background:'rgba(240,165,0,.08)',border:'2px solid rgba(240,165,0,.3)' }}>
                <div style={{ fontSize:'2rem',marginBottom:8 }}>🏆</div>
                <div className="fw-700" style={{ color:'var(--el-accent)',fontSize:'1.05rem' }}>Certificate Generated!</div>
                <div style={{ fontSize:'.86rem',color:'var(--el-muted)' }}>Go to Dashboard → Certificates to download your PDF.</div>
              </div>
            )}

            <div className="d-flex gap-3 justify-content-center flex-wrap">
              {!isExam && (
                <button onClick={() => { setSubmitted(false); setStarted(false); setAnswers(new Array(quiz.questions.length).fill(-1)); setCurrentQ(0); setTimeLeft(quiz.duration*60); setResult(null); setCorrect([]); }} className="btn-outline-gold">
                  <i className="bi bi-arrow-clockwise"></i> Retake Quiz
                </button>
              )}
              <Link to="/student" className="btn-gold"><i className="bi bi-speedometer2"></i> Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Start Screen ─────────────────────────────────────────
  if (!started) {
    const isExam = quiz.type === 'exam';
    return (
      <div><Navbar />
        <div className="container py-5" style={{ maxWidth:640 }}>
          <div className="el-card el-scale-in text-center" style={{ boxShadow:'var(--sh-lg)' }}>
            <div style={{ fontSize:'4rem',marginBottom:16 }}>{isExam?'🎓':'🧠'}</div>
            <span className={`el-pill mb-3 d-inline-block ${isExam?'pill-red':'pill-blue'}`} style={{ textTransform:'uppercase',letterSpacing:'.5px',fontSize:'.72rem' }}>{isExam?'FINAL EXAM':'PRACTICE QUIZ'}</span>
            <h2 className="fw-800 mb-1">{quiz.title}</h2>
            {quiz.titleHindi && <p style={{ color:'var(--el-muted)',fontSize:'.9rem',marginBottom:4 }}>{quiz.titleHindi}</p>}

            {/* Lang toggle */}
            {quiz.questions[0]?.questionHindi && (
              <div className="d-flex gap-2 justify-content-center mt-2 mb-4">
                {[['en','EN'],['hi','हिं']].map(([v,l])=>(
                  <button key={v} onClick={()=>setLang(v)}
                    style={{ border:`2px solid ${lang===v?'var(--el-accent)':'#e9ecef'}`,background:lang===v?'rgba(240,165,0,.1)':'#fff',color:lang===v?'var(--el-accent)':'#555',borderRadius:'var(--r-sm)',padding:'4px 16px',fontWeight:600,cursor:'pointer',transition:'var(--tr)',fontFamily:'Poppins,sans-serif' }}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            {/* Info grid */}
            <div className="row g-3 mb-4" style={{ maxWidth:400, margin:'0 auto 20px' }}>
              {[
                ['bi-list-ol','Questions',quiz.questions.length],
                ['bi-clock','Duration',`${quiz.duration} min`],
                ['bi-trophy','Passing',`${isExam?'75':''+quiz.passingScore}%`],
                ['bi-star','Marks',quiz.questions.reduce((a,q)=>a+q.marks,0)],
              ].map(([ic,lbl,val],i)=>(
                <div key={i} className="col-6">
                  <div className="p-3 rounded-3 text-center" style={{ background:'#f8f9fa',border:'1px solid #e9ecef' }}>
                    <i className={`bi ${ic} d-block mb-1`} style={{ color:'var(--el-accent)',fontSize:'1.15rem' }}></i>
                    <div className="fw-700" style={{ color:'var(--el-primary)' }}>{val}</div>
                    <div style={{ fontSize:'.74rem',color:'#888' }}>{lbl}</div>
                  </div>
                </div>
              ))}
            </div>

            {isExam && (
              <div className="p-3 rounded-3 mb-4" style={{ background:'rgba(231,76,60,.05)',border:'1px solid rgba(231,76,60,.18)',fontSize:'.83rem',color:'#721c24',textAlign:'left' }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Exam Rules:</strong> 20 questions · 100 marks · Pass = 75% · Certificate issued on pass
              </div>
            )}
            <div className="p-3 rounded-3 mb-4" style={{ background:'rgba(240,165,0,.06)',border:'1px solid rgba(240,165,0,.2)',fontSize:'.83rem',color:'#856404' }}>
              <i className="bi bi-info-circle me-2"></i>Timer starts when you click Start. Cannot pause.
            </div>

            <button onClick={() => { setStarted(true); setStart(Date.now()); }} className="btn-gold btn-lg px-5">
              <i className="bi bi-play-circle-fill"></i> Start {isExam ? 'Exam' : 'Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz in Progress ─────────────────────────────────────
  const answered = answers.filter(a => a !== -1).length;

  return (
    <div style={{ background:'var(--el-bg)', minHeight:'100vh' }}>
      <Navbar />
      <div className="container py-4" style={{ maxWidth:780 }}>
        <div className="el-fade-in">

          {/* Header row: title + timer + lang */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-800 mb-0" style={{ color:'var(--el-primary)' }}>{quiz.type==='exam'?'🎓 Final Exam':'🧠 Practice Quiz'}</h5>
              <small style={{ color:'var(--el-muted)' }}>{answered}/{quiz.questions.length} answered · {quiz.title}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              {quiz.questions[0]?.questionHindi && (
                <div className="d-flex gap-1">
                  {[['en','EN'],['hi','हिं']].map(([v,l])=>(
                    <button key={v} onClick={()=>setLang(v)}
                      style={{ border:`2px solid ${lang===v?'var(--el-accent)':'#e9ecef'}`,background:lang===v?'rgba(240,165,0,.1)':'#fff',color:lang===v?'var(--el-accent)':'#555',borderRadius:'var(--r-sm)',padding:'3px 12px',fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif',fontSize:'.82rem' }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <div className={`quiz-timer ${timeLeft < 60 ? 'danger' : ''}`}><i className="bi bi-clock me-1"></i>{fmt(timeLeft)}</div>
            </div>
          </div>

          {/* Top progress bar */}
          <div className="el-prog-track mb-4" style={{ height:10 }}>
            <div className="el-prog-bar" style={{ width:`${pct()}%` }}></div>
          </div>

          {/* Question Card */}
          <div className="el-card mb-4" style={{ boxShadow:'var(--sh-md)' }}>
            {/* Question header */}
            <div className="d-flex align-items-start gap-3 mb-4">
              <div style={{ width:40,height:40,borderRadius:'var(--r-md)',background:'var(--g-accent)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,flexShrink:0 }}>
                {currentQ + 1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'.78rem',color:'var(--el-accent)',fontWeight:600,marginBottom:4 }}>
                  QUESTION {currentQ+1} / {quiz.questions.length} &nbsp;·&nbsp; {q.marks} MARK{q.marks>1?'S':''}
                </div>
                <h5 className="fw-700 mb-0" style={{ fontSize:'1.05rem',lineHeight:1.45 }}>{qTxt}</h5>
                {/* Show other lang hint */}
                {lang==='en' && q.questionHindi && <p style={{ fontSize:'.82rem',color:'var(--el-muted)',marginTop:4,marginBottom:0 }}>{q.questionHindi}</p>}
                {lang==='hi' && q.question && q.question!==qTxt && <p style={{ fontSize:'.82rem',color:'var(--el-muted)',marginTop:4,marginBottom:0 }}>{q.question}</p>}
              </div>
            </div>

            {/* Options */}
            <div>
              {opts.map((opt, idx) => (
                <button key={idx} onClick={() => { const a=[...answers]; a[currentQ]=idx; setAnswers(a); }}
                  className={`quiz-opt ${answers[currentQ]===idx?'selected':''}`}>
                  <div className={`quiz-opt-circle ${answers[currentQ]===idx?'selected':''}`}>{OPTS[idx]}</div>
                  <span style={{ flex:1 }}>{opt}</span>
                  {/* Show Hindi option hint if in English mode */}
                  {lang==='en' && q.optionsHindi?.[idx] && q.optionsHindi[idx] && (
                    <span style={{ fontSize:'.78rem',color:'#aaa',marginLeft:8 }}>/ {q.optionsHindi[idx]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <button onClick={() => setCurrentQ(p => Math.max(0, p-1))} disabled={currentQ===0}
              className="btn-outline-gold" style={{ padding:'9px 24px', opacity:currentQ===0?.5:1 }}>
              <i className="bi bi-chevron-left"></i> Previous
            </button>

            {/* Question dots */}
            <div className="d-flex gap-1 flex-wrap justify-content-center" style={{ maxWidth:320 }}>
              {quiz.questions.map((_,i) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  style={{ width:30,height:30,borderRadius:'var(--r-sm)',border:`2px solid ${i===currentQ?'var(--el-accent)':answers[i]!==-1?'#00c9a7':'#e9ecef'}`,background:i===currentQ?'var(--el-accent)':answers[i]!==-1?'rgba(0,201,167,.1)':'#fff',color:i===currentQ?'#fff':answers[i]!==-1?'#00c9a7':'#999',fontWeight:700,fontSize:'.78rem',cursor:'pointer',transition:'all .18s' }}>
                  {i+1}
                </button>
              ))}
            </div>

            {currentQ < quiz.questions.length - 1 ? (
              <button onClick={() => setCurrentQ(p => p+1)} className="btn-gold" style={{ padding:'9px 24px' }}>
                Next <i className="bi bi-chevron-right"></i>
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)} disabled={submitting} className="btn-gold"
                style={{ padding:'9px 24px', background:'var(--g-success)' }}>
                {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-send-fill"></i> Submit</>}
              </button>
            )}
          </div>

          {/* Bottom progress: x/n answered */}
          <div className="text-center mt-4 d-flex align-items-center justify-content-center gap-2" style={{ fontSize:'.82rem',color:'var(--el-muted)' }}>
            <span>{answered} of {quiz.questions.length} answered</span>
            {answers[currentQ] === -1 && <span style={{ color:'#f0a500' }}>· This question not answered yet</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
