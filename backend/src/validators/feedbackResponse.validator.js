const validateFeedbackResponse = (req, res, next) => {
    const { formId, ratings, comments } = req.body;

    // formId required
    if (!formId) {
        return res.status(400).json({
            success: false,
            message: "formId is required"
        });
    }

    // ratings required
    if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
        return res.status(400).json({
            success: false,
            message: "Ratings are required and must be an object"
        });
    }

    // Only question IDs 1-18 are valid rating questions
    const allowedRatingQuestionIds = Array.from(
        { length: 18 },
        (_, index) => String(index + 1)
    );

    const ratingKeys = Object.keys(ratings);

    // Exactly 18 ratings required
    if (ratingKeys.length !== 18) {
        return res.status(400).json({
            success: false,
            message: "Exactly 18 rating responses are required"
        });
    }

    // Check every question ID
    for (const questionId of ratingKeys) {

        if (!allowedRatingQuestionIds.includes(String(questionId))) {
            return res.status(400).json({
                success: false,
                message: `Question ${questionId} is not a valid rating question`
            });
        }

        const rating = Number(ratings[questionId]);

        // Rating must be integer 1-5
        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: `Rating for question ${questionId} must be an integer between 1 and 5`
            });
        }
    }

    // Comments are optional
    if (comments !== undefined) {

        if (
            typeof comments !== "object" ||
            comments === null ||
            Array.isArray(comments)
        ) {
            return res.status(400).json({
                success: false,
                message: "Comments must be an object"
            });
        }

        // Only question IDs 19 and 20 are allowed for comments
        const allowedCommentQuestionIds = ["19", "20"];

        for (const commentId of Object.keys(comments)) {

            if (!allowedCommentQuestionIds.includes(String(commentId))) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${commentId} is not a valid comment question`
                });
            }

            if (typeof comments[commentId] !== "string") {
                return res.status(400).json({
                    success: false,
                    message: `Comment for question ${commentId} must be text`
                });
            }

            // Maximum 1000 characters
            if (comments[commentId].length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: `Comment for question ${commentId} cannot exceed 1000 characters`
                });
            }
        }
    }

    // anonymous must be boolean if provided
    if (
        req.body.anonymous !== undefined &&
        typeof req.body.anonymous !== "boolean"
    ) {
        return res.status(400).json({
            success: false,
            message: "anonymous must be true or false"
        });
    }

    next();
};

module.exports = validateFeedbackResponse;