require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

const users = [
    {
        role: "Student",
        name: "Test Student",
        email: "student@aicfs.com",
        password: "Student@12345",
        studentId: "STU001"
    },
    {
        role: "Instructor",
        name: "Test Instructor",
        email: "instructor@aicfs.com",
        password: "Instructor@12345",
        instructorId: "INS001"
    }
];

async function createUsers() {
    try {
        for (const user of users) {

            // Get role
            const [roleResults] = await db.promise().query(
                "SELECT id FROM roles WHERE name = ? LIMIT 1",
                [user.role]
            );

            if (roleResults.length === 0) {
                console.log(`Role not found: ${user.role}`);
                continue;
            }

            const roleId = roleResults[0].id;

            // Check existing user
            const [existingUsers] = await db.promise().query(
                "SELECT id FROM users WHERE email = ? LIMIT 1",
                [user.email]
            );

            let userId;

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
                console.log(`${user.role} user already exists.`);
            } else {
                const passwordHash = await bcrypt.hash(user.password, 10);

                const [result] = await db.promise().query(
                    `
                    INSERT INTO users
                    (role_id, name, email, password_hash, is_active)
                    VALUES (?, ?, ?, ?, TRUE)
                    `,
                    [
                        roleId,
                        user.name,
                        user.email,
                        passwordHash
                    ]
                );

                userId = result.insertId;

                console.log(`${user.role} user created. ID: ${userId}`);
            }

            // Student record
            if (user.role === "Student") {

                const [studentExists] = await db.promise().query(
                    "SELECT id FROM students WHERE user_id = ? OR student_id = ? LIMIT 1",
                    [userId, user.studentId]
                );

                if (studentExists.length === 0) {
                    await db.promise().query(
                        `
                        INSERT INTO students
                        (user_id, student_id)
                        VALUES (?, ?)
                        `,
                        [userId, user.studentId]
                    );

                    console.log("Student profile created.");
                } else {
                    console.log("Student profile already exists.");
                }
            }

            // Instructor record
            if (user.role === "Instructor") {

                const [instructorExists] = await db.promise().query(
                    "SELECT id FROM instructors WHERE user_id = ? OR instructor_id = ? LIMIT 1",
                    [userId, user.instructorId]
                );

                if (instructorExists.length === 0) {
                    await db.promise().query(
                        `
                        INSERT INTO instructors
                        (user_id, instructor_id)
                        VALUES (?, ?)
                        `,
                        [userId, user.instructorId]
                    );

                    console.log("Instructor profile created.");
                } else {
                    console.log("Instructor profile already exists.");
                }
            }
        }

        console.log("Users setup completed.");
        process.exit(0);

    } catch (error) {
        console.error("Failed to create users:");
        console.error(error);
        process.exit(1);
    }
}

createUsers();