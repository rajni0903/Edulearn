const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User       = require('./models/User');
const Course     = require('./models/Course');
const { Quiz }   = require('./models/Quiz');
const Assignment = require('./models/Assignment');
const Enrollment = require('./models/Enrollment');
const Submission = require('./models/Submission');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Clear
    await Promise.all([
      User.deleteMany({}), Course.deleteMany({}),
      Quiz.deleteMany({}), Assignment.deleteMany({}),
      Enrollment.deleteMany({}), Submission.deleteMany({}),
    ]);

    // ── FIXED ADMIN ──────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Rajni Admin',
      email: 'rajni9496@gmail.com',
      password: 'riya@9496',
      role: 'admin',
      status: 'approved',
    });

    // ── INSTRUCTORS (approved) ────────────────────────────────────────────────
    const inst1 = await User.create({
      name: 'Rahul Sharma', email: 'rahul@edulearn.com',
      password: 'instructor123', role: 'instructor', status: 'approved',
      bio: 'Full Stack Developer 8 yrs exp',
    });
    const inst2 = await User.create({
      name: 'Priya Verma', email: 'priya@edulearn.com',
      password: 'instructor123', role: 'instructor', status: 'approved',
      bio: 'Data Scientist & ML Engineer',
    });

    // ── STUDENTS ──────────────────────────────────────────────────────────────
    const stu1 = await User.create({ name: 'Amit Kumar',  email: 'amit@edulearn.com',  password: 'student123', role: 'student' });
    const stu2 = await User.create({ name: 'Sneha Patel', email: 'sneha@edulearn.com', password: 'student123', role: 'student' });

    console.log('✅ Users created');

    // ── COURSES ───────────────────────────────────────────────────────────────
    const course1 = await Course.create({
      title: 'Complete React.js Masterclass 2024',
      description: 'React.js zero se advanced tak seekho. Hooks, Context API, Redux, real-world projects.',
      category: 'Web Development', level: 'Beginner', price: 999, duration: '42 hours',
      instructorId: inst1._id, instructorName: inst1.name, rating: 4.8, totalStudents: 1240,
      thumbnail: 'https://img.youtube.com/vi/w7ejDZ8SWv8/hqdefault.jpg',
      videos: [
        { title: 'Part 1 - React Introduction', titleHindi: 'भाग 1 - React परिचय', youtubeUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', youtubeId: 'w7ejDZ8SWv8', thumbnail: 'https://img.youtube.com/vi/w7ejDZ8SWv8/hqdefault.jpg', duration: '45 min', order: 1 },
        { title: 'Part 2 - Components & Props',  titleHindi: 'भाग 2 - Components और Props', youtubeUrl: 'https://www.youtube.com/watch?v=RGKi6LSPDLU', youtubeId: 'RGKi6LSPDLU', thumbnail: 'https://img.youtube.com/vi/RGKi6LSPDLU/hqdefault.jpg', duration: '60 min', order: 2 },
        { title: 'Part 3 - useState Hook',       titleHindi: 'भाग 3 - useState Hook', youtubeUrl: 'https://www.youtube.com/watch?v=4pO-HcG2igk', youtubeId: '4pO-HcG2igk', thumbnail: 'https://img.youtube.com/vi/4pO-HcG2igk/hqdefault.jpg', duration: '55 min', order: 3 },
        { title: 'Part 4 - useEffect Hook',      titleHindi: 'भाग 4 - useEffect Hook', youtubeUrl: 'https://www.youtube.com/watch?v=-4XpG5_Lj_o', youtubeId: '-4XpG5_Lj_o', thumbnail: 'https://img.youtube.com/vi/-4XpG5_Lj_o/hqdefault.jpg', duration: '50 min', order: 4 },
        { title: 'Part 5 - Context API',         titleHindi: 'भाग 5 - Context API', youtubeUrl: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc', youtubeId: '5LrDIWkK_Bc', thumbnail: 'https://img.youtube.com/vi/5LrDIWkK_Bc/hqdefault.jpg', duration: '65 min', order: 5 },
        { title: 'Part 6 - React Router',        titleHindi: 'भाग 6 - React Router', youtubeUrl: 'https://www.youtube.com/watch?v=0cSVuySEB0A', youtubeId: '0cSVuySEB0A', thumbnail: 'https://img.youtube.com/vi/0cSVuySEB0A/hqdefault.jpg', duration: '70 min', order: 6 },
      ],
      tags: ['React','JavaScript','Frontend'],
    });

    const course2 = await Course.create({
      title: 'Node.js & Express Backend Development',
      description: 'Node.js aur Express se REST APIs banao. MongoDB, JWT authentication, deployment.',
      category: 'Web Development', level: 'Intermediate', price: 1299, duration: '36 hours',
      instructorId: inst1._id, instructorName: inst1.name, rating: 4.7, totalStudents: 987,
      thumbnail: 'https://img.youtube.com/vi/BLl32FvcdVM/hqdefault.jpg',
      videos: [
        { title: 'Part 1 - Node.js Basics',    titleHindi: 'भाग 1 - Node.js मूल बातें', youtubeUrl: 'https://www.youtube.com/watch?v=BLl32FvcdVM', youtubeId: 'BLl32FvcdVM', thumbnail: 'https://img.youtube.com/vi/BLl32FvcdVM/hqdefault.jpg', duration: '50 min', order: 1 },
        { title: 'Part 2 - Express.js Setup',  titleHindi: 'भाग 2 - Express.js सेटअप', youtubeUrl: 'https://www.youtube.com/watch?v=7H_QH9nipNs', youtubeId: '7H_QH9nipNs', thumbnail: 'https://img.youtube.com/vi/7H_QH9nipNs/hqdefault.jpg', duration: '55 min', order: 2 },
        { title: 'Part 3 - MongoDB & Mongoose', titleHindi: 'भाग 3 - MongoDB और Mongoose', youtubeUrl: 'https://www.youtube.com/watch?v=ExcRbA7fy_A', youtubeId: 'ExcRbA7fy_A', thumbnail: 'https://img.youtube.com/vi/ExcRbA7fy_A/hqdefault.jpg', duration: '60 min', order: 3 },
      ],
      tags: ['Node.js','Express','MongoDB'],
    });

    console.log('✅ Courses with videos created');

    // ── PRACTICE QUIZ (30 questions, bilingual) ───────────────────────────────
    await Quiz.create({
      courseId: course1._id, createdBy: inst1._id,
      title: 'React Fundamentals Practice Quiz',
      titleHindi: 'React मूल बातें अभ्यास प्रश्नोत्तरी',
      type: 'practice', duration: 30, passingScore: 60,
      questions: [
        { question: 'What is React?', questionHindi: 'React क्या है?', options: ['A database','A JS library for UI','A backend framework','A CSS tool'], optionsHindi: ['एक डेटाबेस','UI के लिए JS लाइब्रेरी','एक बैकएंड फ्रेमवर्क','एक CSS टूल'], correctAnswer: 1, marks: 2 },
        { question: 'Which hook manages state?', questionHindi: 'कौन सा hook state मैनेज करता है?', options: ['useEffect','useContext','useState','useRef'], optionsHindi: ['useEffect','useContext','useState','useRef'], correctAnswer: 2, marks: 2 },
        { question: 'What does JSX stand for?', questionHindi: 'JSX का पूर्ण रूप क्या है?', options: ['JavaScript XML','Java Syntax','JS Extension','Java XML'], optionsHindi: ['JavaScript XML','Java Syntax','JS Extension','Java XML'], correctAnswer: 0, marks: 2 },
        { question: 'React component returns?', questionHindi: 'React component क्या return करता है?', options: ['CSS','HTML string','JSX','JSON'], optionsHindi: ['CSS','HTML string','JSX','JSON'], correctAnswer: 2, marks: 2 },
        { question: 'What is a prop in React?', questionHindi: 'React में prop क्या है?', options: ['State variable','Input to component','CSS class','Database'], optionsHindi: ['State variable','Component का input','CSS class','Database'], correctAnswer: 1, marks: 2 },
        { question: 'Props are:', questionHindi: 'Props होते हैं:', options: ['Mutable','Immutable','Functions','Arrays only'], optionsHindi: ['परिवर्तनीय','अपरिवर्तनीय','Functions','केवल Arrays'], correctAnswer: 1, marks: 2 },
        { question: 'useEffect runs:', questionHindi: 'useEffect कब चलता है?', options: ['Before render','After render','Never','On click'], optionsHindi: ['Render से पहले','Render के बाद','कभी नहीं','Click पर'], correctAnswer: 1, marks: 2 },
        { question: 'Virtual DOM is?', questionHindi: 'Virtual DOM क्या है?', options: ['A browser','Lightweight DOM copy','A database','CSS framework'], optionsHindi: ['एक ब्राउज़र','DOM की हल्की कॉपी','एक डेटाबेस','CSS framework'], correctAnswer: 1, marks: 2 },
        { question: 'Key prop is used for?', questionHindi: 'Key prop किसलिए उपयोग होता है?', options: ['Styling','Unique list items','Events','API calls'], optionsHindi: ['Styling','List items को unique बनाने','Events','API calls'], correctAnswer: 1, marks: 2 },
        { question: 'React Router is for?', questionHindi: 'React Router किसलिए है?', options: ['Styling','State management','Navigation','API'], optionsHindi: ['Styling','State management','Navigation','API'], correctAnswer: 2, marks: 2 },
        { question: 'Context API solves?', questionHindi: 'Context API क्या हल करता है?', options: ['Routing','Prop drilling','Styling','DB connection'], optionsHindi: ['Routing','Prop drilling','Styling','DB connection'], correctAnswer: 1, marks: 2 },
        { question: 'useState returns?', questionHindi: 'useState क्या return करता है?', options: ['Object','Array of [state, setter]','String','Number'], optionsHindi: ['Object','[state, setter] Array','String','Number'], correctAnswer: 1, marks: 2 },
        { question: 'React.Fragment is used to?', questionHindi: 'React.Fragment का उपयोग?', options: ['Add CSS','Wrap without extra DOM','Make API call','Create context'], optionsHindi: ['CSS जोड़ना','Extra DOM के बिना wrap करना','API call','Context बनाना'], correctAnswer: 1, marks: 2 },
        { question: 'Controlled component has?', questionHindi: 'Controlled component में क्या होता है?', options: ['No state','Value from state','Random value','CSS class'], optionsHindi: ['No state','State से value','Random value','CSS class'], correctAnswer: 1, marks: 2 },
        { question: 'map() in JSX is for?', questionHindi: 'JSX में map() किसलिए?', options: ['Mapping routes','Rendering lists','Styling','API'], optionsHindi: ['Routes mapping','Lists render करना','Styling','API'], correctAnswer: 1, marks: 2 },
        { question: 'Class vs Functional components — recommended now?', questionHindi: 'अब recommended component type?', options: ['Class','Functional','Both equal','Neither'], optionsHindi: ['Class','Functional','दोनों बराबर','कोई नहीं'], correctAnswer: 1, marks: 2 },
        { question: 'useRef is used to?', questionHindi: 'useRef का उपयोग?', options: ['Manage state','Access DOM element','Fetch data','Route'], optionsHindi: ['State manage','DOM element access','Data fetch','Route'], correctAnswer: 1, marks: 2 },
        { question: 'StrictMode in React?', questionHindi: 'React StrictMode क्या करता है?', options: ['Disables features','Highlights potential problems','Speeds up','Adds CSS'], optionsHindi: ['Features बंद करता है','संभावित problems highlight करता है','Speed बढ़ाता है','CSS जोड़ता है'], correctAnswer: 1, marks: 2 },
        { question: 'Reconciliation means?', questionHindi: 'Reconciliation का अर्थ?', options: ['Routing','Comparing virtual DOMs','Styling','Testing'], optionsHindi: ['Routing','Virtual DOMs की तुलना','Styling','Testing'], correctAnswer: 1, marks: 2 },
        { question: 'PureComponent / memo is for?', questionHindi: 'PureComponent/memo किसलिए?', options: ['Styling','Performance optimization','Routing','DB'], optionsHindi: ['Styling','Performance optimization','Routing','DB'], correctAnswer: 1, marks: 2 },
        { question: 'State updates are?', questionHindi: 'State updates होते हैं?', options: ['Synchronous','Asynchronous','Immediate DOM change','Manual'], optionsHindi: ['Synchronous','Asynchronous','Immediate DOM change','Manual'], correctAnswer: 1, marks: 2 },
        { question: 'Event handling uses?', questionHindi: 'Event handling किस syntax से?', options: ['onclick','onClick','on-click','eventClick'], optionsHindi: ['onclick','onClick','on-click','eventClick'], correctAnswer: 1, marks: 2 },
        { question: 'Default export syntax?', questionHindi: 'Default export syntax?', options: ['module.exports','export default','exports.default','export'], optionsHindi: ['module.exports','export default','exports.default','export'], correctAnswer: 1, marks: 2 },
        { question: 'Lifting state up means?', questionHindi: 'State lift up का मतलब?', options: ['Move state to child','Move state to parent','Delete state','Copy state'], optionsHindi: ['State child में ले जाना','State parent में ले जाना','State delete करना','State copy करना'], correctAnswer: 1, marks: 2 },
        { question: 'npm start runs?', questionHindi: 'npm start क्या चलाता है?', options: ['Build','Development server','Tests','Deploy'], optionsHindi: ['Build','Development server','Tests','Deploy'], correctAnswer: 1, marks: 2 },
        { question: 'create-react-app command?', questionHindi: 'CRA command?', options: ['npx create-react-app myapp','npm react new','react-cli new myapp','npx new-react-app'], optionsHindi: ['npx create-react-app myapp','npm react new','react-cli new myapp','npx new-react-app'], correctAnswer: 0, marks: 2 },
        { question: 'Axios is used for?', questionHindi: 'Axios किसलिए उपयोग होता है?', options: ['Routing','Styling','HTTP requests','Testing'], optionsHindi: ['Routing','Styling','HTTP requests','Testing'], correctAnswer: 2, marks: 2 },
        { question: 'package.json contains?', questionHindi: 'package.json में क्या होता है?', options: ['CSS styles','Project dependencies & scripts','HTML template','DB config'], optionsHindi: ['CSS styles','Project dependencies और scripts','HTML template','DB config'], correctAnswer: 1, marks: 2 },
        { question: 'Redux is used for?', questionHindi: 'Redux किसलिए है?', options: ['Routing','Global state management','Styling','Testing'], optionsHindi: ['Routing','Global state management','Styling','Testing'], correctAnswer: 1, marks: 2 },
        { question: 'React was created by?', questionHindi: 'React किसने बनाया?', options: ['Google','Amazon','Facebook/Meta','Microsoft'], optionsHindi: ['Google','Amazon','Facebook/Meta','Microsoft'], correctAnswer: 2, marks: 2 },
      ],
    });

    // ── EXAM QUIZ (exactly 20 questions, bilingual) ───────────────────────────
    await Quiz.create({
      courseId: course1._id, createdBy: inst1._id,
      title: 'React Final Exam', titleHindi: 'React अंतिम परीक्षा',
      type: 'exam', duration: 40, passingScore: 75,
      questions: [
        { question: 'What is React?',                  questionHindi: 'React क्या है?',                        options: ['Database','JS UI library','Backend framework','CSS tool'],          optionsHindi: ['Database','JS UI library','Backend framework','CSS tool'],          correctAnswer: 1, marks: 5 },
        { question: 'JSX stands for?',                 questionHindi: 'JSX का अर्थ?',                         options: ['JavaScript XML','Java Syntax','JS Ext','Java XML'],                  optionsHindi: ['JavaScript XML','Java Syntax','JS Ext','Java XML'],                  correctAnswer: 0, marks: 5 },
        { question: 'State hook?',                     questionHindi: 'State hook कौन सा है?',                 options: ['useEffect','useState','useContext','useRef'],                        optionsHindi: ['useEffect','useState','useContext','useRef'],                        correctAnswer: 1, marks: 5 },
        { question: 'Props are?',                      questionHindi: 'Props होते हैं?',                       options: ['Mutable','Immutable','Functions','Arrays'],                          optionsHindi: ['Mutable','Immutable','Functions','Arrays'],                          correctAnswer: 1, marks: 5 },
        { question: 'useEffect runs after?',           questionHindi: 'useEffect कब चलता है?',                 options: ['Before render','After render','Never','On click'],                   optionsHindi: ['Render से पहले','Render के बाद','कभी नहीं','Click पर'],              correctAnswer: 1, marks: 5 },
        { question: 'Virtual DOM?',                    questionHindi: 'Virtual DOM क्या है?',                  options: ['Browser','Lightweight DOM copy','DB','CSS'],                         optionsHindi: ['Browser','DOM की हल्की कॉपी','DB','CSS'],                           correctAnswer: 1, marks: 5 },
        { question: 'Context API solves?',             questionHindi: 'Context API क्या हल करता है?',          options: ['Routing','Prop drilling','Styling','DB'],                            optionsHindi: ['Routing','Prop drilling','Styling','DB'],                            correctAnswer: 1, marks: 5 },
        { question: 'Key prop used for?',              questionHindi: 'Key prop किसलिए?',                     options: ['Styling','Unique list items','Events','API'],                        optionsHindi: ['Styling','Unique list items','Events','API'],                        correctAnswer: 1, marks: 5 },
        { question: 'React Router is for?',            questionHindi: 'React Router किसलिए है?',               options: ['Styling','State','Navigation','API'],                                optionsHindi: ['Styling','State','Navigation','API'],                                correctAnswer: 2, marks: 5 },
        { question: 'Class vs Functional — recommended?', questionHindi: 'अब recommended?',                   options: ['Class','Functional','Both','Neither'],                               optionsHindi: ['Class','Functional','दोनों','कोई नहीं'],                            correctAnswer: 1, marks: 5 },
        { question: 'Reconciliation?',                 questionHindi: 'Reconciliation का अर्थ?',               options: ['Routing','Comparing Virtual DOMs','Styling','Testing'],             optionsHindi: ['Routing','Virtual DOMs की तुलना','Styling','Testing'],             correctAnswer: 1, marks: 5 },
        { question: 'Controlled component?',           questionHindi: 'Controlled component में?',             options: ['No state','State value','Random value','CSS'],                       optionsHindi: ['No state','State value','Random value','CSS'],                       correctAnswer: 1, marks: 5 },
        { question: 'Event handler in JSX?',           questionHindi: 'JSX में event handler?',                options: ['onclick','onClick','on-click','eventClick'],                         optionsHindi: ['onclick','onClick','on-click','eventClick'],                         correctAnswer: 1, marks: 5 },
        { question: 'useState returns?',               questionHindi: 'useState क्या return करता है?',         options: ['Object','[state, setter]','String','Number'],                        optionsHindi: ['Object','[state, setter]','String','Number'],                        correctAnswer: 1, marks: 5 },
        { question: 'Lifting state up?',               questionHindi: 'State lift up?',                       options: ['Move to child','Move to parent','Delete','Copy'],                    optionsHindi: ['Child में','Parent में','Delete','Copy'],                            correctAnswer: 1, marks: 5 },
        { question: 'React was created by?',           questionHindi: 'React किसने बनाया?',                   options: ['Google','Amazon','Facebook/Meta','Microsoft'],                       optionsHindi: ['Google','Amazon','Facebook/Meta','Microsoft'],                       correctAnswer: 2, marks: 5 },
        { question: 'React.Fragment?',                 questionHindi: 'React.Fragment का उपयोग?',              options: ['Add CSS','Wrap without extra DOM','API call','Context'],              optionsHindi: ['CSS जोड़ना','Extra DOM के बिना wrap','API call','Context'],          correctAnswer: 1, marks: 5 },
        { question: 'PureComponent/memo?',             questionHindi: 'PureComponent/memo किसलिए?',            options: ['Styling','Performance optimization','Routing','DB'],                  optionsHindi: ['Styling','Performance optimization','Routing','DB'],                  correctAnswer: 1, marks: 5 },
        { question: 'npm start runs?',                 questionHindi: 'npm start क्या चलाता है?',              options: ['Build','Development server','Tests','Deploy'],                       optionsHindi: ['Build','Development server','Tests','Deploy'],                       correctAnswer: 1, marks: 5 },
        { question: 'Axios is used for?',              questionHindi: 'Axios किसलिए?',                        options: ['Routing','Styling','HTTP requests','Testing'],                       optionsHindi: ['Routing','Styling','HTTP requests','Testing'],                       correctAnswer: 2, marks: 5 },
      ],
    });

    // ── ASSIGNMENT ────────────────────────────────────────────────────────────
    await Assignment.create({
      courseId: course1._id, createdBy: inst1._id,
      title: 'Build a Todo App with React',
      description: 'React ka use karke ek Todo App banao jisme:\n1. Todos add/delete karein\n2. Complete mark karein\n3. localStorage mein save ho\n4. Filter karein (All/Active/Done)\n\nApna GitHub link submit karein.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
    });

    console.log('✅ Quiz (practice + exam) and Assignment created');
    console.log('\n🎉 Seed complete!\n');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║           LOGIN CREDENTIALS                       ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║ ADMIN      → rajni9496@gmail.com  | riya@9496     ║');
    console.log('║ INSTRUCTOR → rahul@edulearn.com   | instructor123 ║');
    console.log('║ STUDENT    → amit@edulearn.com    | student123    ║');
    console.log('╚══════════════════════════════════════════════════╝');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
