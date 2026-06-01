 EduLearn LMS — Setup Guide
 Prerequisites (Pehle yeh install karo)

 1. Node.js
- Download: https://nodejs.org
- Version: v18 ya usse upar
- Install karne ke baad verify karo:
  ```
  node --version
  npm --version
  ```

 2. MongoDB Community Server
- Download: https://www.mongodb.com/try/download/community
- Windows mein install karo (default settings theek hain)
- Service automatically start hogi background mein
- Ya manually start karo: `mongod`

 3. VS Code
- Download: https://code.visualstudio.com
- Install karo aur open karo



 VS Code mein Project Open karna

1. ZIP file extract karo → `edulearn-updated` folder milega
2. VS Code open karo
3. File → Open Folder → `edulearn-updated` folder select karo
4. VS Code mein folder open ho jayega



 Step-by-Step Setup

 Terminal kaise open karo VS Code mein
> VS Code mein upar menu se: Terminal → New Terminal



 STEP 1 — Backend Install

Terminal mein type karo:
```bash
cd backend
npm install
```
Yeh saare backend packages install karega (express, mongoose, jwt, bcrypt, pdfkit, etc.)



 STEP 2 — .env File Check karo

`backend/.env` file already bani hui hai. Isme yeh hona chahiye:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/edulearn
JWT_SECRET=edulearn_super_secret_jwt_key_2024_v2
JWT_EXPIRE=7d
NODE_ENV=development
```
Agar MongoDB remote use karna hai (jaise MongoDB Atlas):
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/edulearn
```



 STEP 3 — Database Seed karo (Sample Data)

```bash
cd backend
node seed.js
```
Yeh create karega:
- Admin: rajni9496@gmail.com / [admin password — see seed.js]
- Instructor: instructor@edulearn.com / instructor123
- Student: amit@edulearn.com / student123
- 2 sample courses with videos, quizzes, assignments



 STEP 4 — Frontend Install

New Terminal open karo (Terminal → New Terminal):
```bash
cd frontend
npm install
```
Yeh React aur sab frontend packages install karega.



 STEP 5 — Project Run karo

Do alag terminals mein run karo:

Terminal 1 — Backend:
```bash
cd backend
npm run dev
```
Output aayega: `🚀 EduLearn Server → http://localhost:5000`

Terminal 2 — Frontend:
```bash
cd frontend
npm start
```
Browser automatically open hoga: `http://localhost:3000`



 Login Credentials (seed.js ke baad)

| Role | Email | Password |
||-|-|
| Admin | rajni9496@gmail.com | [see seed.js] |
| Instructor | instructor@edulearn.com | instructor123 |
| Student | amit@edulearn.com | student123 |



 Features List

 🔐 Authentication
- JWT based secure login
- Role-based access: Admin / Instructor / Student
- Instructor approval system

 📚 Course System
- Instructor manually course + videos add kar sakta hai
- YouTube video URLs se automatic thumbnail
- Category system (Admin se dynamic categories)

 📝 Assignment System
- Instructor: Assignment banao with PDF/Drive link attachment
- Student: Assignment tab unlock hota hai jab ≥1 video dekh le
- Student: PDF link ya Drive link se submit karo
- Instructor: Student name, submission time dekho + Grade do

 🧠 Quiz System
- Manual quiz create karo (question + 4 options + correct answer)
- DOCX Import: Word file se quiz import karo
  - Format: `Q1. Question` → `A. Option` → `Answer: A`
- Practice quiz aur Final Exam types
- Auto certificate on exam pass (75%+)

 🏆 Certificate
- PDF certificate auto generate hota hai
- Student name, course name, completion date, performance % included
- One-click download

 🗂️ Admin Panel
- Users manage karo (approve/reject/delete)
- Instructor approvals
- Categories manage karo (add/edit/delete) — no code change needed
- Courses, Quizzes, Assignments, Enrollments dekho



 Folder Structure

```
edulearn-updated/
├── backend/
│   ├── models/          ← MongoDB schemas
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Quiz.js
│   │   ├── Category.js  ← NEW
│   │   └── Lesson.js
│   ├── routes/          ← API endpoints
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── enrollments.js
│   │   ├── assignments.js
│   │   ├── quizzes.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js      ← JWT protect
│   ├── utils/
│   │   └── certificate.js ← PDF generator
│   ├── config/
│   │   └── db.js
│   ├── server.js        ← Entry point
│   ├── seed.js          ← Sample data
│   ├── .env             ← Config (no API keys)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── HomePage.js
    │   │   ├── CoursesPage.js
    │   │   ├── CourseDetailPage.js
    │   │   ├── StudentDashboard.js
    │   │   ├── InstructorDashboard.js
    │   │   ├── AdminDashboard.js
    │   │   └── QuizPage.js
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── Sidebar.js
    │   │   ├── CourseCard.js  ← Image UI fixed
    │   │   ├── Footer.js
    │   │   └── Spinner.js
    │   ├── services/
    │   │   └── api.js         ← All API calls
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── index.css          ← All styles
    │   └── App.js
    ├── .env
    └── package.json
```



 Troubleshooting

MongoDB connect nahi ho raha?
```bash
 Windows - MongoDB service start karo
net start MongoDB

 Ya manually
mongod --dbpath C:\data\db
```

Port 5000 already in use?
```
backend/.env mein PORT=5001 karo
frontend/.env mein REACT_APP_API_URL=http://localhost:5001/api karo
```

npm install error?
```bash
npm cache clean --force
npm install
```

"Module not found" error?
```bash
cd backend && npm install
cd frontend && npm install
```
