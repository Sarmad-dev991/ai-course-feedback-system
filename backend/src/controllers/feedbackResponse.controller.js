const { findFeedbackForm } = require("./feedbackForm.controller");
const { isStudentEligible } = require("./enrollment.controller");

let responses = [];

/*
    Submit Feedback
*/
const submitFeedback = (req, res) => {

    const {
        formId,
        ratings,
        comments,
        anonymous
    } = req.body;

    // Find feedback form
    const form = findFeedbackForm(formId);

    if (!form) {
        return res.status(404).json({
            success: false,
            message: "Feedback form not found"
        });
    }

    // Form must be active
    if (form.status !== "Active") {
        return res.status(403).json({
            success: false,
            message: "This feedback form is not active"
        });
    }

    // Check opening/closing dates
    const today = new Date().toISOString().split("T")[0];

    if (today < form.openDate) {
        return res.status(403).json({
            success: false,
            message: "This feedback form is not open yet"
        });
    }

    if (today > form.closeDate) {
        return res.status(403).json({
            success: false,
            message: "This feedback form has been closed"
        });
    }

    /*
        Student eligibility
    */
    const eligible = isStudentEligible(
        req.user.email,
        form.courseId,
        form.batchId
    );

    if (!eligible) {
        return res.status(403).json({
            success: false,
            message:
                "You are not eligible to submit feedback for this course and batch"
        });
    }

    /*
        Anonymous mode
    */
    let isAnonymous = false;

    if (anonymous === true) {

        // Form must allow anonymous feedback
        if (!form.anonymousEnabled) {
            return res.status(400).json({
                success: false,
                message:
                    "Anonymous feedback is not enabled for this form"
            });
        }

        isAnonymous = true;
    }

    /*
        Duplicate submission protection

        Normal submission:
        studentId = student email

        Anonymous submission:
        studentId = null
        submittedBy is kept internally only for duplicate checking
    */
    const alreadySubmitted = responses.some((response) => {

        if (response.formId !== Number(formId)) {
            return false;
        }

        // Normal feedback
        if (!isAnonymous) {
            return response.studentId === req.user.email;
        }

        // Anonymous feedback
        return (
            response.anonymous === true &&
            response.submittedBy === req.user.email
        );
    });

    if (alreadySubmitted) {
        return res.status(409).json({
            success: false,
            message:
                "You have already submitted feedback for this form"
        });
    }

    /*
        Create response

        submittedBy is internal only.
        It will NOT be returned to students.
    */
    const newResponse = {
        id: responses.length + 1,

        formId: Number(formId),

        courseId: form.courseId,

        batchId: form.batchId,

        anonymous: isAnonymous,

        // Hide identity when anonymous
        studentId: isAnonymous
            ? null
            : req.user.email,

        // Internal field for duplicate checking
        submittedBy: req.user.email,

        ratings,

        comments: comments || {},

        submittedAt: new Date().toISOString()
    };

    responses.push(newResponse);

    /*
        Safe response
        Do NOT expose submittedBy
    */
    const safeResponse = {
        id: newResponse.id,
        formId: newResponse.formId,
        courseId: newResponse.courseId,
        batchId: newResponse.batchId,
        anonymous: newResponse.anonymous,
        studentId: newResponse.studentId,
        ratings: newResponse.ratings,
        comments: newResponse.comments,
        submittedAt: newResponse.submittedAt
    };

    res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        data: safeResponse
    });
};


/*
    Get My Feedback

    Important:
    Internal submittedBy field is NEVER returned.
*/
const getMyFeedback = (req, res) => {

    const myResponses = responses
        .filter(
            (response) =>
                response.studentId === req.user.email
        )
        .map((response) => ({
            id: response.id,
            formId: response.formId,
            courseId: response.courseId,
            batchId: response.batchId,
            anonymous: response.anonymous,
            studentId: response.studentId,
            ratings: response.ratings,
            comments: response.comments,
            submittedAt: response.submittedAt
        }));

    res.json({
        success: true,
        count: myResponses.length,
        data: myResponses
    });
};


/*
    Get Course Feedback
*/
const getCourseFeedback = (req, res) => {

    const courseId = Number(req.params.courseId);

    const responsesForCourse = responses.filter(
        (response) =>
            response.courseId === courseId
    );

    /*
        Instructor can only see feedback
        for their own course.
    */
    if (req.user.role === "Instructor") {

        const instructorMap = {
            "instructor1@gmail.com": "Instructor 1",
            "instructor2@gmail.com": "Instructor 2"
        };

        const instructorName =
            instructorMap[req.user.email];

        const {
            findCourse
        } = require("./course.controller");

        const course = findCourse(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (course.instructor !== instructorName) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this course feedback"
            });
        }
    }

    /*
        Never expose submittedBy
        in course feedback.
    */
    const safeResponses = responsesForCourse.map(
        (response) => ({
            id: response.id,
            formId: response.formId,
            courseId: response.courseId,
            batchId: response.batchId,
            anonymous: response.anonymous,
            ratings: response.ratings,
            comments: response.comments,
            submittedAt: response.submittedAt
        })
    );

    res.json({
        success: true,
        count: safeResponses.length,
        data: safeResponses
    });
};


/*
    Internal data access
    Used by analytics/reports.
*/
const getFeedbackResponsesData = () => {
    return responses;
};


module.exports = {
    submitFeedback,
    getMyFeedback,
    getCourseFeedback,
    getFeedbackResponsesData
};