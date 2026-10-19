require("dotenv").config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("ERROR: JWT_SECRET is missing or too short in backend/.env");
    process.exit(1);
}

const express = require("express");
const cors = require("cors");
const db = require("./src/config/db");

// Routes
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const courseRoutes = require("./src/routes/course.routes");
const batchRoutes = require("./src/routes/batch.routes");
const enrollmentRoutes = require("./src/routes/enrollment.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");
const courseCategoryRoutes = require("./src/routes/courseCategory.routes");
const feedbackFormRoutes = require("./src/routes/feedbackForm.routes");
const questionRoutes = require("./src/routes/question.routes");
const feedbackResponseRoutes = require("./src/routes/feedbackResponse.routes");
const reportRoutes = require("./src/routes/report.routes");
const auditLogRoutes = require("./src/routes/auditLog.routes");
const studentRoutes = require("./src/routes/student.routes");
const instructorRoutes = require("./src/routes/instructor.routes");
const batchInstructorRoutes = require("./src/routes/batchInstructor.routes");
const feedbackOptionRoutes = require("./src/routes/feedbackOption.routes");
const feedbackSubmissionRoutes = require("./src/routes/feedbackSubmission.routes");
const ratingResponseRoutes = require("./src/routes/ratingResponse.routes");
const textResponseRoutes = require("./src/routes/textResponse.routes");
const aiAnalysisRoutes = require("./src/routes/aiAnalysis.routes");

// Middleware
const notFound = require("./src/middleware/notFound.middleware");
const errorHandler = require("./src/middleware/error.middleware");

const app = express();

const PORT = process.env.PORT || 5000;


// Global Middleware

app.use(cors());
app.use(express.json());


// API Routes

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/course-categories", courseCategoryRoutes);
app.use("/api/feedback-forms", feedbackFormRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/feedback-responses", feedbackResponseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/batch-instructors", batchInstructorRoutes);
app.use("/api/feedback-submissions", feedbackSubmissionRoutes);
app.use("/api/feedback-options", feedbackOptionRoutes);
app.use("/api/rating-responses", ratingResponseRoutes);
app.use("/api/text-responses", textResponseRoutes);
app.use("/api/ai-analyses", aiAnalysisRoutes);


// Test API

app.get("/api", (req, res) => {
    res.json({
        message: "AI Course Feedback System Backend is running"
    });
});


// 404 Middleware

app.use(notFound);


// Error Handling Middleware

app.use(errorHandler);


// Start Server

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});