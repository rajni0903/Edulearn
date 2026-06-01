const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Bilingual question
  question:      { type: String, required: true }, // English
  questionHindi: { type: String, default: '' },     // Hindi
  options: [{ type: String }],
  optionsHindi: [{ type: String }],  // Hindi options
  correctAnswer: { type: Number, required: true }, // index
  marks: { type: Number, default: 5 },             // 20 questions × 5 = 100
});

const quizSchema = new mongoose.Schema(
  {
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:       { type: String, required: true },
    titleHindi:  { type: String, default: '' },
    // 'practice' = 30-100 questions, 'exam' = exactly 20 questions (certificate exam)
    type:        { type: String, enum: ['practice', 'exam'], default: 'practice' },
    questions:   { type: [questionSchema], validate: {
      validator: function(q) {
        if (this.type === 'exam') return q.length === 20;
        return q.length >= 30 && q.length <= 100;
      },
      message: 'Practice quiz: 30-100 questions. Exam: exactly 20 questions.',
    }},
    duration:     { type: Number, default: 30 }, // minutes
    passingScore: { type: Number, default: 60 }, // % for practice
    // Exam passing is always 75 (75/100)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const quizResultSchema = new mongoose.Schema(
  {
    quizId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers:    [{ type: Number }],
    score:      { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed:     { type: Boolean, default: false },
    timeTaken:  { type: Number, default: 0 },
    // For exam results — triggers certificate
    certificateGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Quiz       = mongoose.model('Quiz', quizSchema);
const QuizResult = mongoose.model('QuizResult', quizResultSchema);
module.exports   = { Quiz, QuizResult };
