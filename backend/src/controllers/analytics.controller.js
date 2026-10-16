const db = require("../config/db");
const {
    findCourse
} = require("./course.controller");

const {
    getEnrollmentData
} = require("./enrollment.controller");

const {
    getFeedbackFormsData
} = require("./feedbackForm.controller");

const {
    getFeedbackResponsesData
} = require("./feedbackResponse.controller");


// -----------------------------------------
// Instructor/Admin Course Analytics
// -----------------------------------------

const getCourseAnalytics = (req, res) => {

    const courseId = Number(req.params.id);

    // Find course
    const course = findCourse(courseId);

    if (!course) {
        return res.status(404).json({
            success: false,
            message: "Course not found"
        });
    }


    // -----------------------------------------
    // Role check
    // -----------------------------------------

    if (
        req.user.role !== "Admin" &&
        req.user.role !== "Instructor"
    ) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Analytics are only available to instructors and admins."
        });
    }


    // -----------------------------------------
    // Instructor assignment check
    // -----------------------------------------

    if (req.user.role === "Instructor") {

        const instructorMap = {
            "instructor1@gmail.com": "Instructor 1",
            "instructor2@gmail.com": "Instructor 2"
        };

        const instructorName =
            instructorMap[req.user.email];


        if (!instructorName) {
            return res.status(403).json({
                success: false,
                message: "Instructor assignment not found"
            });
        }


        if (course.instructor !== instructorName) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this course"
            });
        }
    }


    // -----------------------------------------
    // Get forms for this course
    // -----------------------------------------

    const forms = getFeedbackFormsData().filter(
        form => form.courseId === courseId
    );


    // -----------------------------------------
    // Get responses for this course
    // -----------------------------------------

    const responses = getFeedbackResponsesData().filter(
        response => response.courseId === courseId
    );


    // -----------------------------------------
    // Get enrollments for this course
    // -----------------------------------------

    const enrollments = getEnrollmentData().filter(
        enrollment =>
            enrollment.courseId === courseId &&
            enrollment.status === "Active"
    );


    // -----------------------------------------
    // Calculate section averages
    // -----------------------------------------

    const sectionQuestions = {

        instructor: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

        course: [11, 12, 13, 14, 15],

        facilities: [16, 17, 18]

    };


    const calculateAverage = (questionIds) => {

        let total = 0;
        let count = 0;


        for (const response of responses) {

            for (const questionId of questionIds) {

                const rating =
                    Number(response.ratings[questionId]);

                if (
                    Number.isInteger(rating) &&
                    rating >= 1 &&
                    rating <= 5
                ) {
                    total += rating;
                    count++;
                }
            }
        }


        if (count === 0) {
            return 0;
        }


        return Number(
            (total / count).toFixed(2)
        );
    };


    // -----------------------------------------
    // Question-level summaries
    // -----------------------------------------

    const questionSummaries = [];


    for (let questionId = 1; questionId <= 18; questionId++) {

        let total = 0;
        let count = 0;


        for (const response of responses) {

            const rating =
                Number(response.ratings[questionId]);

            if (
                Number.isInteger(rating) &&
                rating >= 1 &&
                rating <= 5
            ) {
                total += rating;
                count++;
            }
        }


        questionSummaries.push({

            questionId,

            responseCount: count,

            averageRating:
                count === 0
                    ? 0
                    : Number(
                        (total / count).toFixed(2)
                    )

        });
    }


    // -----------------------------------------
    // Response rate
    // -----------------------------------------

    const enrolledStudents =
        enrollments.length;

    const responseCount =
        responses.length;


    const responseRate =
        enrolledStudents === 0
            ? 0
            : Number(
                (
                    (responseCount /
                        enrolledStudents) * 100
                ).toFixed(2)
            );


    // -----------------------------------------
    // Anonymous response count
    // -----------------------------------------

    const anonymousResponses =
        responses.filter(
            response => response.anonymous === true
        ).length;


    // -----------------------------------------
    // Final analytics response
    // -----------------------------------------

    res.json({

        success: true,

        data: {

            course: {
                id: course.id,
                name: course.name,
                instructor: course.instructor
            },

            feedbackForms: forms.length,

            responseCount,

            enrolledStudents,

            responseRate: `${responseRate}%`,

            anonymousResponses,

            averageRatingBySection: {

                instructor:
                    calculateAverage(
                        sectionQuestions.instructor
                    ),

                course:
                    calculateAverage(
                        sectionQuestions.course
                    ),

                facilities:
                    calculateAverage(
                        sectionQuestions.facilities
                    )

            },

            questionLevelSummaries:
                questionSummaries

        }

    });
};


// -----------------------------------------
// Admin Summary
// -----------------------------------------

const getAdminSummary = (req, res) => {

    if (req.user.role !== "Admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });

    }


    const enrollments =
        getEnrollmentData();

    const forms =
        getFeedbackFormsData();

    const responses =
        getFeedbackResponsesData();


    const totalStudents =
        new Set(
            enrollments.map(
                enrollment =>
                    enrollment.studentEmail
            )
        ).size;


    const totalCourses =
        new Set(
            enrollments.map(
                enrollment =>
                    enrollment.courseId
            )
        ).size;


    const activeBatches =
        new Set(
            enrollments
                .filter(
                    enrollment =>
                        enrollment.status === "Active"
                )
                .map(
                    enrollment =>
                        enrollment.batchId
                )
        ).size;


    const totalResponses =
        responses.length;


    const totalEligible =
        enrollments.filter(
            enrollment =>
                enrollment.status === "Active"
        ).length;


    const responseRate =
        totalEligible === 0
            ? 0
            : Number(
                (
                    (totalResponses /
                        totalEligible) * 100
                ).toFixed(2)
            );


    res.json({

        success: true,

        data: {

            totalStudents,

            totalInstructors: 2,

            totalCourses,

            activeBatches,

            totalFeedbackForms:
                forms.length,

            totalResponses,

            feedbackResponseRate:
                `${responseRate}%`

        }

    });
};


const runDashboardQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const getInstructorDashboard = async (req, res) => {
    try {
        const userId = Number(req.user.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid instructor account."
            });
        }

        // Confirm that this user has an instructor record.
        const instructorRows = await runDashboardQuery(
            "SELECT id FROM instructors WHERE user_id = ?",
            [userId]
        );

        if (instructorRows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Instructor profile not found."
            });
        }

        // Only courses and batches assigned to this instructor.
        const courses = await runDashboardQuery(`
            SELECT DISTINCT
                c.id AS courseId,
                c.title AS courseName,
                b.id AS batchId,
                b.name AS batchName,
                b.is_active AS batchActive
            FROM instructors i
            JOIN batch_instructors bi
                ON bi.instructor_id = i.id
            JOIN batches b
                ON b.id = bi.batch_id
            JOIN courses c
                ON c.id = b.course_id
            WHERE i.user_id = ?
            ORDER BY c.title, b.name
        `, [userId]);

        const metricsRows = await runDashboardQuery(`
            SELECT
                COUNT(DISTINCT e.student_id) AS enrolledStudents,
                COUNT(DISTINCT CASE
                    WHEN fs.id IS NOT NULL THEN fs.student_id
                END) AS respondingStudents,
                COUNT(DISTINCT fs.id) AS totalResponses,
                COUNT(DISTINCT ff.id) AS feedbackForms
            FROM instructors i
            JOIN batch_instructors bi
                ON bi.instructor_id = i.id
            JOIN batches b
                ON b.id = bi.batch_id
            LEFT JOIN enrollments e
                ON e.batch_id = b.id
            LEFT JOIN feedback_forms ff
                ON ff.batch_id = b.id
            LEFT JOIN feedback_submissions fs
                ON fs.form_id = ff.id
            WHERE i.user_id = ?
        `, [userId]);

        const ratingRows = await runDashboardQuery(`
            SELECT
                LOWER(fq.section) AS section,
                ROUND(AVG(fo.option_value), 2) AS averageRating,
                COUNT(rr.id) AS ratingCount
            FROM instructors i
            JOIN batch_instructors bi
                ON bi.instructor_id = i.id
            JOIN batches b
                ON b.id = bi.batch_id
            JOIN feedback_forms ff
                ON ff.batch_id = b.id
            JOIN feedback_questions fq
                ON fq.form_id = ff.id
            JOIN feedback_submissions fs
                ON fs.form_id = ff.id
            JOIN rating_responses rr
                ON rr.submission_id = fs.id
               AND rr.question_id = fq.id
            JOIN feedback_options fo
                ON fo.id = rr.option_id
               AND fo.question_id = fq.id
            WHERE i.user_id = ?
              AND fo.option_value BETWEEN 1 AND 5
            GROUP BY LOWER(fq.section)
        `, [userId]);

        const aiAnalyses = await runDashboardQuery(`
            SELECT DISTINCT
                aa.id,
                aa.submission_id,
                aa.analysis_type,
                aa.result,
                aa.created_at
            FROM instructors i
            JOIN batch_instructors bi
                ON bi.instructor_id = i.id
            JOIN batches b
                ON b.id = bi.batch_id
            JOIN feedback_forms ff
                ON ff.batch_id = b.id
            JOIN feedback_submissions fs
                ON fs.form_id = ff.id
            JOIN ai_analyses aa
                ON aa.submission_id = fs.id
            WHERE i.user_id = ?
            ORDER BY aa.created_at DESC
            LIMIT 100
        `, [userId]);

        const metrics = metricsRows[0] || {};
        const enrolledStudents = Number(metrics.enrolledStudents || 0);
        const respondingStudents = Number(metrics.respondingStudents || 0);
        const totalResponses = Number(metrics.totalResponses || 0);

        const responseRate = enrolledStudents === 0
            ? 0
            : Number(
                ((respondingStudents / enrolledStudents) * 100).toFixed(2)
            );

        const ratings = {
            overall: 0,
            instructor: 0,
            course: 0,
            facilities: 0
        };

        let ratingTotal = 0;
        let ratingCount = 0;

        for (const row of ratingRows) {
            const average = Number(row.averageRating || 0);
            const count = Number(row.ratingCount || 0);

            if (count > 0) {
                ratingTotal += average * count;
                ratingCount += count;
            }

            const section = String(row.section || "").toLowerCase();

            if (Object.prototype.hasOwnProperty.call(ratings, section)) {
                ratings[section] = average;
            }
        }

        ratings.overall = ratingCount > 0
            ? Number((ratingTotal / ratingCount).toFixed(2))
            : 0;

        return res.json({
            success: true,
            data: {
                instructor: {
                    id: instructorRows[0].id,
                    userId
                },
                summary: {
                    averageRating: ratings.overall,
                    responseRate,
                    totalResponses,
                    enrolledStudents,
                    respondingStudents,
                    courses: new Set(
                        courses.map(course => course.courseId)
                    ).size,
                    feedbackForms: Number(metrics.feedbackForms || 0)
                },
                ratingsBySection: ratings,
                assignedCourses: courses,
                aiAnalyses
            }
        });

    } catch (error) {
        console.error("Instructor dashboard error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to load instructor dashboard."
        });
    }
};



module.exports = {
    getCourseAnalytics,
    getAdminSummary,
    getInstructorDashboard
};
