require("dotenv").config();

const db = require("../config/db");

async function createFeedbackData() {
    try {
        const [batches] = await db.promise().query(
            "SELECT id, course_id FROM batches ORDER BY id DESC LIMIT 1"
        );

        if (batches.length === 0) {
            console.log("No batch found.");
            process.exit(1);
        }

        const batchId = batches[0].id;
        const courseId = batches[0].course_id;

        // Create feedback form
        const [existingForms] = await db.promise().query(
            `
            SELECT id
            FROM feedback_forms
            WHERE batch_id = ? AND course_id = ?
            LIMIT 1
            `,
            [batchId, courseId]
        );

        let formId;

        if (existingForms.length > 0) {
            formId = existingForms[0].id;
            console.log("Feedback form already exists. ID:", formId);
        } else {
            const [formResult] = await db.promise().query(
                `
                INSERT INTO feedback_forms
                (
                    course_id,
                    batch_id,
                    title,
                    open_date,
                    close_date,
                    anonymous_mode,
                    is_active
                )
                VALUES (?, ?, ?, ?, ?, FALSE, TRUE)
                `,
                [
                    courseId,
                    batchId,
                    "Course Feedback Form",
                    "2026-09-01 00:00:00",
                    "2027-02-28 23:59:59"
                ]
            );

            formId = formResult.insertId;
            console.log("Feedback form created. ID:", formId);
        }

        // Questions
        const questions = [
            ["Instructor", "The instructor explained concepts clearly.", "rating", 1],
            ["Instructor", "The instructor demonstrated good knowledge of the subject.", "rating", 2],
            ["Instructor", "The instructor was well prepared for classes.", "rating", 3],
            ["Instructor", "The instructor encouraged student participation.", "rating", 4],
            ["Instructor", "The instructor communicated effectively.", "rating", 5],
            ["Instructor", "The instructor responded appropriately to questions.", "rating", 6],
            ["Instructor", "The instructor used suitable teaching methods.", "rating", 7],
            ["Instructor", "The instructor managed the class effectively.", "rating", 8],
            ["Instructor", "The instructor provided useful guidance and feedback.", "rating", 9],
            ["Instructor", "The instructor maintained a professional attitude.", "rating", 10],

            ["Course", "The course content was relevant to the subject.", "rating", 11],
            ["Course", "The course objectives were clear.", "rating", 12],
            ["Course", "The course material was well organized.", "rating", 13],
            ["Course", "The course provided useful practical knowledge.", "rating", 14],
            ["Course", "The overall course structure was satisfactory.", "rating", 15],

            ["Facilities", "The classroom/lab facilities were adequate.", "rating", 16],
            ["Facilities", "The available equipment and resources were satisfactory.", "rating", 17],
            ["Facilities", "The learning environment was suitable.", "rating", 18],

            ["Comments", "What did you like most about this course?", "text", 19],
            ["Comments", "What improvements or suggestions would you recommend?", "text", 20]
        ];

        const options = [
            ["Excellent", 5],
            ["Good", 4],
            ["Average", 3],
            ["Below Average", 2]
        ];

        for (const question of questions) {

            const [existingQuestion] = await db.promise().query(
                `
                SELECT id
                FROM feedback_questions
                WHERE form_id = ? AND question_order = ?
                LIMIT 1
                `,
                [formId, question[3]]
            );

            let questionId;

            if (existingQuestion.length > 0) {
                questionId = existingQuestion[0].id;
            } else {
                const [questionResult] = await db.promise().query(
                    `
                    INSERT INTO feedback_questions
                    (
                        form_id,
                        section,
                        question_text,
                        question_type,
                        is_required,
                        question_order
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        formId,
                        question[0],
                        question[1],
                        question[2],
                        question[2] === "rating",
                        question[3]
                    ]
                );

                questionId = questionResult.insertId;
            }

            // Add options only for rating questions
            if (question[2] === "rating") {

                for (const option of options) {

                    const [existingOption] = await db.promise().query(
                        `
                        SELECT id
                        FROM feedback_options
                        WHERE question_id = ? AND option_text = ?
                        LIMIT 1
                        `,
                        [questionId, option[0]]
                    );

                    if (existingOption.length === 0) {
                        await db.promise().query(
                            `
                            INSERT INTO feedback_options
                            (
                                question_id,
                                option_text,
                                option_value
                            )
                            VALUES (?, ?, ?)
                            `,
                            [questionId, option[0], option[1]]
                        );
                    }
                }
            }
        }

        console.log("Feedback form, 20 questions and rating options setup completed.");
        process.exit(0);

    } catch (error) {
        console.error("Failed to create feedback data:");
        console.error(error);
        process.exit(1);
    }
}

createFeedbackData();