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


module.exports = {
    getCourseAnalytics,
    getAdminSummary
};