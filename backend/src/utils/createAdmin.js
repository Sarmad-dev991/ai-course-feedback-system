require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

const adminName = "System Admin";
const adminEmail = "admin@aicfs.com";
const adminPassword = "Admin@12345";

const sql = `
    SELECT id
    FROM roles
    WHERE name = 'Admin'
`;

db.query(sql, async (err, results) => {
    if (err) {
        console.error("Failed to find Admin role:", err);
        process.exit(1);
    }

    if (results.length === 0) {
        console.error("Admin role not found.");
        process.exit(1);
    }

    const roleId = results[0].id;

    const checkUserSql = `
        SELECT id
        FROM users
        WHERE email = ?
    `;

    db.query(checkUserSql, [adminEmail], async (userErr, userResults) => {
        if (userErr) {
            console.error("Failed to check admin:", userErr);
            process.exit(1);
        }

        if (userResults.length > 0) {
            console.log("Admin user already exists.");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const insertSql = `
            INSERT INTO users
            (
                role_id,
                name,
                email,
                password_hash,
                is_active
            )
            VALUES (?, ?, ?, ?, TRUE)
        `;

        db.query(
            insertSql,
            [
                roleId,
                adminName,
                adminEmail,
                passwordHash
            ],
            (insertErr, result) => {
                if (insertErr) {
                    console.error("Failed to create admin:", insertErr);
                    process.exit(1);
                }

                console.log("Admin created successfully.");
                console.log("Email:", adminEmail);
                console.log("Password:", adminPassword);
                console.log("User ID:", result.insertId);

                process.exit(0);
            }
        );
    });
});