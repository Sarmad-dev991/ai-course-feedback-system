document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // 1. PAGE NAVIGATION
    // =====================================================

    document.querySelectorAll("[data-go]").forEach(function (button) {

        button.addEventListener("click", function () {

            window.location.href = button.dataset.go;

        });

    });


    // =====================================================
    // 2. TEXTAREA CHARACTER COUNTER
    // =====================================================

    document.querySelectorAll("textarea[maxlength]").forEach(function (textarea) {

        let counter = document.createElement("small");

        counter.className = "muted d-block text-end mt-1";

        function updateCounter() {

            counter.innerText =
                textarea.value.length +
                "/" +
                textarea.maxLength +
                " characters";

        }

        textarea.parentNode.appendChild(counter);

        textarea.addEventListener("input", updateCounter);

        updateCounter();

    });


    // =====================================================
    // 3. LOGIN PAGE
    // =====================================================

    const loginForm = document.getElementById("loginForm");
    const togglePassword = document.getElementById("togglePassword");
    const password = document.getElementById("password");
    const loginError = document.getElementById("loginError");


    // Password Show / Hide
    if (togglePassword && password) {

        togglePassword.addEventListener("click", function () {

            if (password.type === "password") {

                password.type = "text";

                togglePassword.innerHTML =
                    '<i class="bi bi-eye-slash"></i>';

            } else {

                password.type = "password";

                togglePassword.innerHTML =
                    '<i class="bi bi-eye"></i>';

            }

        });

    }


    // Login Form
    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();


            const emailInput = document.getElementById("email");

            const passwordInput = document.getElementById("password");

            const selectedRole =
                document.querySelector('input[name="role"]:checked');


            const email =
                emailInput ? emailInput.value.trim() : "";

            const passwordValue =
                passwordInput ? passwordInput.value.trim() : "";


            // Validation
            if (!email || !passwordValue || !selectedRole) {

                if (loginError) {

                    loginError.innerHTML =
                        '<i class="bi bi-exclamation-circle me-1"></i>' +
                        "Please enter all required information.";

                    loginError.classList.add("show");

                }

                return;

            }


            // Hide error
            if (loginError) {

                loginError.classList.remove("show");

            }


            // Selected Role
            const role = selectedRole.value;


            // Frontend Prototype Navigation
            if (role === "student") {

                window.location.href =
                    "student-dashboard.html";

            }

            else if (role === "instructor") {

                window.location.href =
                    "instructor-dashboard.html";

            }

            else if (role === "admin") {

                window.location.href =
                    "admin-dashboard.html";

            }

        });

    }


    // =====================================================
    // 4. STUDENT COURSE SEARCH
    // =====================================================

    const courseSearch =
        document.getElementById("courseSearch");

    if (courseSearch) {

        const courseCards =
            document.querySelectorAll(
                ".row.g-4 > div[class*='col-']"
            );


        courseSearch.addEventListener("input", function () {

            const searchText =
                courseSearch.value.toLowerCase().trim();


            courseCards.forEach(function (card) {

                const courseName =
                    card.innerText.toLowerCase();


                if (courseName.includes(searchText)) {

                    card.style.display = "";

                } else {

                    card.style.display = "none";

                }

            });

        });

    }


    // =====================================================
    // 5. INSTRUCTOR EVALUATION
    // =====================================================

    const saveInstructor =
        document.getElementById("saveInstructor");


    if (saveInstructor) {

        saveInstructor.addEventListener("click", function () {

            let answered = 0;


            // Check 10 questions
            for (let i = 1; i <= 10; i++) {

                const selected =
                    document.querySelector(
                        `input[name="q${i}"]:checked`
                    );


                if (selected) {

                    answered++;

                }

            }


            // Validation
            if (answered < 10) {

                alert(
                    `Please answer all questions. ${answered}/10 completed.`
                );

                return;

            }


            // Temporary frontend save
            localStorage.setItem(
                "instructorEvaluationCompleted",
                "true"
            );


            alert(
                "Instructor evaluation saved successfully."
            );

        });

    }


    // =====================================================
    // 6. COURSE EVALUATION
    // =====================================================

    const courseNext =
        document.getElementById("courseNext");


    if (courseNext) {

        courseNext.addEventListener("click", function (event) {

            let answered = 0;


            // Check 5 questions
            for (let i = 1; i <= 5; i++) {

                const selected =
                    document.querySelector(
                        `input[name="q${i}"]:checked`
                    );


                if (selected) {

                    answered++;

                }

            }


            // Validation
            if (answered < 5) {

                event.preventDefault();

                alert(
                    "Please answer all 5 course evaluation questions."
                );

                return;

            }


            // Temporary frontend save
            localStorage.setItem(
                "courseEvaluationCompleted",
                "true"
            );

        });

    }


    // =====================================================
    // 7. FACILITIES & COMMENTS
    // =====================================================

    const facilitiesNext =
        document.getElementById("facilitiesNext");


    if (facilitiesNext) {

        facilitiesNext.addEventListener("click", function (event) {

            let answered = 0;


            // Check 3 questions
            for (let i = 1; i <= 3; i++) {

                const selected =
                    document.querySelector(
                        `input[name="q${i}"]:checked`
                    );


                if (selected) {

                    answered++;

                }

            }


            // Validation
            if (answered < 3) {

                event.preventDefault();

                alert(
                    "Please answer all 3 facilities questions."
                );

                return;

            }


            // Temporary frontend save
            localStorage.setItem(
                "facilitiesCompleted",
                "true"
            );

        });

    }


    // =====================================================
    // 8. REVIEW & SUBMIT
    // =====================================================

    const submitFeedback =
        document.getElementById("submitFeedback");

    const confirmCheckbox =
        document.getElementById("confirm");


    if (submitFeedback && confirmCheckbox) {

        submitFeedback.addEventListener("click", function () {


            // Confirmation check
            if (!confirmCheckbox.checked) {

                alert(
                    "Click ok if you are sure that provided information is correct."
                );

                return;

            }


            // Temporary frontend save
            localStorage.setItem(
                "feedbackSubmitted",
                "true"
            );


            // Go to confirmation page
            window.location.href =
                "submission-confirmation.html";

        });

    }


    // =====================================================
    // 9. ADMIN COURSE SEARCH
    // =====================================================

    const adminCourseSearch =
        document.getElementById("adminCourseSearch");


    if (adminCourseSearch) {

        adminCourseSearch.addEventListener("input", function () {

            const search =
                this.value.toLowerCase().trim();


            const rows =
                document.querySelectorAll(
                    ".table-custom tbody tr"
                );


            rows.forEach(function (row) {

                const text =
                    row.innerText.toLowerCase();


                if (text.includes(search)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

});