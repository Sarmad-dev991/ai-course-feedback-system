// Course create/update karte waqt required data check karega.

const validateCourse = (req, res, next) => {
    const { title, category_id } = req.body;

    if (!title || !category_id) {
        return res.status(400).json({
            success: false,
            message: "Course title and category are required"
        });
    }

    next();
};

module.exports = validateCourse;