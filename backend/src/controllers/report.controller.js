const { findCourse } = require("./course.controller");
const { getFeedbackFormsData } = require("./feedbackForm.controller");
const { getFeedbackResponsesData } = require("./feedbackResponse.controller");
const { getEnrollmentData } = require("./enrollment.controller");

const getCourseReport = (req, res) => {
    const courseId = Number(req.params.id);

    const course = findCourse(courseId);

    if (!course) {
        return res.status(404).json({
            success: false,
            message: "Course not found"
        });
    }

    // Instructor can only access their own course
    if (req.user.role === "Instructor") {
        const instructorMap = {
            "instructor1@gmail.com": "Instructor 1",
            "instructor2@gmail.com": "Instructor 2"
        };

        const instructorName = instructorMap[req.user.email];

        if (course.instructor !== instructorName) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this course report"
            });
        }
    }

    const forms = getFeedbackFormsData().filter(
        form => form.courseId === courseId
    );

    const responses = getFeedbackResponsesData().filter(
        response => response.courseId === courseId
    );

    const enrollments = getEnrollmentData().filter(
        enrollment =>
            enrollment.courseId === courseId &&
            enrollment.status === "Active"
    );

    const totalStudents = enrollments.length;
    const totalResponses = responses.length;

    const responseRate =
        totalStudents === 0
            ? 0
            : Number(((totalResponses / totalStudents) * 100).toFixed(2));

    const anonymousResponses = responses.filter(
        response => response.anonymous === true
    ).length;

    res.json({
        success: true,
        report: {
            course: {
                id: course.id,
                name: course.name,
                instructor: course.instructor
            },

            feedbackForms: forms.length,

            statistics: {
                totalStudents,
                totalResponses,
                responseRate: `${responseRate}%`,
                anonymousResponses
            },

            generatedAt: new Date().toISOString()
        }
    });
};

module.exports = {
    getCourseReport
};