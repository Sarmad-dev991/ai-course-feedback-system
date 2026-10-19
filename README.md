# \# AI Course Feedback System

# 

# \*\*AI-Powered Course Feedback and Evaluation System for CS Technologies, Rawalpindi.\*\*

# 

# \## 📌 Project Overview

# 

# The AI Course Feedback System is a web-based application designed to collect, manage, and analyze student feedback about courses, instructors, and learning facilities at CS Technologies, Rawalpindi.

# 

# The system provides role-based access for Students, Instructors, and Administrators. It helps users manage course feedback, review reports, and access AI-generated insights to support data-driven improvements in course quality.

# 

# \## ✨ Key Features

# 

# \### 👨‍🎓 Student Module

# \- Secure login and authentication.

# \- View available courses and relevant course information.

# \- Submit course feedback using structured questions and ratings.

# \- Provide written comments and suggestions.

# \- View the student dashboard.

# 

# \### 👨‍🏫 Instructor Module

# \- Access instructor-specific information and dashboard.

# \- Review course feedback insights.

# \- View saved AI-generated feedback analyses.

# \- Review course performance and reports.

# \- Export reports as CSV files.

# 

# \### 🛡️ Administrator Module

# \- Access the administration dashboard.

# \- Manage courses, course categories, and users.

# \- Review system activity and audit logs.

# \- View AI-generated feedback insights.

# \- Review course performance and reports.

# \- Export report data as CSV files.

# 

# \### 🤖 AI-Powered Insights

# \- Display saved feedback analyses.

# \- Summarize student feedback.

# \- Identify common topics and issues.

# \- Present suggestions for course improvement.

# \- Display sentiment trends when sufficient feedback data is available.

# 

# \## 🛠️ Technologies Used

# 

# \### Frontend

# \- HTML5

# \- CSS3

# \- JavaScript

# \- Bootstrap 5.3.3

# 

# \### Backend

# \- Node.js

# \- Express.js

# \- REST APIs

# \- JSON Web Tokens (JWT)

# \- bcryptjs

# 

# \### Database

# \- MySQL

# \- XAMPP

# \- DBeaver (database management tool)

# 

# \## 📂 Project Structure

# 

# ```text

# ai-course-feedback-system/

# ├── backend/

# │   ├── src/

# │   │   ├── config/

# │   │   ├── controllers/

# │   │   ├── middleware/

# │   │   ├── models/

# │   │   ├── routes/

# │   │   ├── services/

# │   │   ├── utils/

# │   │   └── validators/

# │   ├── server.js

# │   └── package.json

# ├── frontend/

# │   ├── css/

# │   ├── js/

# │   ├── pages/

# │   └── index.html

# └── README.md

# ```

# 

# \## ⚙️ Prerequisites

# 

# Install the following software before running the project:

# 

# \- \[Node.js and npm](https://nodejs.org/)

# \- \[XAMPP](https://www.apachefriends.org/)

# \- \[Git](https://git-scm.com/)

# \- A modern web browser

# 

# DBeaver is optional and can be used to inspect and manage the MySQL database.

# 

# \## 🚀 Installation and Setup

# 

# \### 1. Clone the repository

# 

# ```bash

# git clone https://github.com/Sarmad-dev991/ai-course-feedback-system.git

# cd ai-course-feedback-system

# ```

# 

# \### 2. Configure the database

# 

# 1\. Open XAMPP Control Panel.

# 2\. Start Apache if needed and start MySQL.

# 3\. Open DBeaver or phpMyAdmin.

# 4\. Create or configure the database named `ai\_course\_feedback`.

# 5\. Set up the required tables using the database schema or SQL files provided with the project.

# 

# Make sure the database connection settings match your local MySQL configuration.

# 

# \### 3. Configure backend environment variables

# 

# Open the `backend` folder and create a `.env` file using the variables required by the backend configuration.

# 

# Configure the necessary values, such as:

# 

# \- Server port

# \- MySQL host, port, username, and password

# \- Database name

# \- JWT secret

# 

# Use the variable names expected by the existing backend configuration. Never commit your actual `.env` file, passwords, JWT secrets, or API keys to GitHub.

# 

# \### 4. Install backend dependencies

# 

# Open a terminal in the project root and run:

# 

# ```bash

# cd backend

# npm install

# ```

# 

# \### 5. Start the backend server

# 

# Use the development command configured in `backend/package.json`:

# 

# ```bash

# npm run dev

# ```

# 

# If the development script is unavailable, use the start script defined in `package.json`.

# 

# The backend is configured to run on port `5000` by default, unless overridden by environment settings.

# 

# \### 6. Run the frontend

# 

# Open `frontend/index.html` in a browser or use the VS Code Live Server extension.

# 

# Ensure the backend server is running and the frontend API configuration points to the correct backend URL.

# 

# \## 🔐 Authentication and Access Control

# 

# The system supports role-based access for:

# 

# \- \*\*Student:\*\* Course feedback and student functionality.

# \- \*\*Instructor:\*\* Course-specific insights and reports.

# \- \*\*Administrator:\*\* User and course management, system monitoring, insights, and reports.

# 

# Access to protected API endpoints depends on authentication and the permissions configured for each role.

# 

# \## 📊 Reports and Analytics

# 

# The reporting module provides course performance information, response-rate statistics, saved AI analysis counts, and recent reports.

# 

# Report details can be reviewed through the interface, and CSV export is available in the reports module.

# 

# \## 🔒 Security Notes

# 

# \- Keep environment variables and credentials private.

# \- Use strong passwords and a secure JWT secret.

# \- Do not upload `.env` files or database credentials to the repository.

# \- Configure appropriate permissions before deploying the application publicly.

# 

# \## 👨‍💻 Repository

# 

# GitHub: \[Sarmad-dev991/ai-course-feedback-system](https://github.com/Sarmad-dev991/ai-course-feedback-system)

# 

# \## 📝 Project Purpose

# 

# This project aims to make course evaluation more organized and useful by combining structured student feedback, reporting, and AI-generated insights to support continuous improvement in teaching and learning.



