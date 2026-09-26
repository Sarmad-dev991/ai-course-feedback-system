require("dotenv").config();

const db = require("../config/db");

async function createAcademicData() {
    try {
        // Get course
        const [courses] = await db.promise().query(
            "SELECT id FROM courses ORDER BY id LIMIT 1"
        );

        if (courses.length === 0) {
            console.log("No course found in database.");
            process.exit(1);
        }

        const courseId = courses[0].id;

        // Create batch
        const [existingBatches] = await db.promise().query(
            "SELECT id FROM batches WHERE course_id = ? LIMIT 1",
            [courseId]
        );

        let batchId;

        if (existingBatches.length > 0) {
            batchId = existingBatches[0].id;
            console.log("Batch already exists. ID:", batchId);
        } else {
            const [batchResult] = await db.promise().query(
                `
                INSERT INTO batches
                (course_id, name, start_date, end_date, is_active)
                VALUES (?, ?, ?, ?, TRUE)
                `,
                [
                    courseId,
                    "Batch 2026",
                    "2026-09-01",
                    "2027-02-28"
                ]
            );

            batchId = batchResult.insertId;
            console.log("Batch created. ID:", batchId);
        }

        // Get instructor
        const [instructors] = await db.promise().query(
            "SELECT id FROM instructors ORDER BY id LIMIT 1"
        );

        if (instructors.length === 0) {
            console.log("No instructor found.");
            process.exit(1);
        }

        const instructorId = instructors[0].id;

        // Assign instructor to batch
        const [assignmentExists] = await db.promise().query(
            `
            SELECT id
            FROM batch_instructors
            WHERE batch_id = ? AND instructor_id = ?
            LIMIT 1
            `,
            [batchId, instructorId]
        );

        if (assignmentExists.length === 0) {
            await db.promise().query(
                `
                INSERT INTO batch_instructors
                (batch_id, instructor_id)
                VALUES (?, ?)
                `,
                [batchId, instructorId]
            );

            console.log("Instructor assigned to batch.");
        } else {
            console.log("Instructor already assigned to batch.");
        }

        // Get student
        const [students] = await db.promise().query(
            "SELECT id FROM students ORDER BY id LIMIT 1"
        );

        if (students.length === 0) {
            console.log("No student found.");
            process.exit(1);
        }

        const studentId = students[0].id;

        // Enroll student
        const [enrollmentExists] = await db.promise().query(
            `
            SELECT id
            FROM enrollments
            WHERE student_id = ? AND batch_id = ?
            LIMIT 1
            `,
            [studentId, batchId]
        );

        if (enrollmentExists.length === 0) {
            await db.promise().query(
                `
                INSERT INTO enrollments
                (student_id, batch_id)
                VALUES (?, ?)
                `,
                [studentId, batchId]
            );

            console.log("Student enrolled in batch.");
        } else {
            console.log("Student already enrolled in batch.");
        }

        console.log("Academic data setup completed.");
        process.exit(0);

    } catch (error) {
        console.error("Failed to create academic data:");
        console.error(error);
        process.exit(1);
    }
}

createAcademicData();