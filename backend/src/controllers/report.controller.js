
const db = require("../config/db");

const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const getCourseReport = async (req, res) => {
    const courseId = Number(req.params.id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid course ID"
        });
    }

    try {
        const courses = await runQuery(
            `SELECT id, title, is_active
             FROM courses
             WHERE id = ?`,
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Instructors may only access courses assigned through their batches.
        if (req.user.role === "Instructor") {
            const userId = Number(req.user.userId);

            const assigned = await runQuery(
                `SELECT 1
                 FROM instructors i
                 JOIN batch_instructors bi
                   ON bi.instructor_id = i.id
                 JOIN batches b
                   ON b.id = bi.batch_id
                 WHERE i.user_id = ?
                   AND b.course_id = ?
                 LIMIT 1`,
                [userId, courseId]
            );

            if (assigned.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to this course"
                });
            }
        }

        const rows = await runQuery(
            `SELECT
                COUNT(DISTINCT ff.id) AS feedbackForms,
                COUNT(DISTINCT e.student_id) AS totalStudents,
                COUNT(DISTINCT fs.id) AS totalResponses,
                COUNT(DISTINCT CASE
                    WHEN ff.anonymous_mode = 1 THEN fs.id
                END) AS anonymousResponses
             FROM courses c
             LEFT JOIN batches b
               ON b.course_id = c.id
             LEFT JOIN enrollments e
               ON e.batch_id = b.id
             LEFT JOIN feedback_forms ff
               ON ff.batch_id = b.id
             LEFT JOIN feedback_submissions fs
               ON fs.form_id = ff.id
              AND fs.student_id = e.student_id
             WHERE c.id = ?`,
            [courseId]
        );

        const stats = rows[0] || {};
        const totalStudents = Number(stats.totalStudents || 0);
        const totalResponses = Number(stats.totalResponses || 0);

        const eligibleRows = await runQuery(
            `SELECT COUNT(*) AS eligiblePairs
             FROM enrollments e
             JOIN batches b
               ON b.id = e.batch_id
             JOIN feedback_forms ff
               ON ff.batch_id = b.id
              AND ff.is_active = 1
             WHERE b.course_id = ?
               AND b.is_active = 1`,
            [courseId]
        );

        const submittedRows = await runQuery(
            `SELECT COUNT(DISTINCT CONCAT(fs.student_id, '-', fs.form_id))
                AS submittedPairs
             FROM feedback_submissions fs
             JOIN feedback_forms ff
               ON ff.id = fs.form_id
             JOIN batches b
               ON b.id = ff.batch_id
             JOIN enrollments e
               ON e.student_id = fs.student_id
              AND e.batch_id = b.id
             WHERE b.course_id = ?
               AND b.is_active = 1
               AND ff.is_active = 1`,
            [courseId]
        );

        const eligiblePairs = Number(
            eligibleRows[0]?.eligiblePairs || 0
        );
        const submittedPairs = Number(
            submittedRows[0]?.submittedPairs || 0
        );

        const responseRate = eligiblePairs > 0
            ? Number(
                Math.min(100, submittedPairs / eligiblePairs * 100)
                    .toFixed(2)
            )
            : 0;

        return res.json({
            success: true,
            report: {
                course: {
                    id: courses[0].id,
                    name: courses[0].title,
                    is_active: courses[0].is_active
                },
                feedbackForms: Number(stats.feedbackForms || 0),
                statistics: {
                    totalStudents,
                    totalResponses,
                    eligiblePairs,
                    submittedPairs,
                    responseRate: `${responseRate}%`,
                    anonymousResponses: Number(
                        stats.anonymousResponses || 0
                    )
                },
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Course report error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate course report"
        });
    }
};

module.exports = {
    getCourseReport
};
