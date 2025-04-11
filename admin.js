document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANT: Replace with your DEPLOYED Google Apps Script URL !!!
    // This URL is for ADDING Gallery and New Arrivals data.
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwTGtpBQE3GM-y-IkPaqET8l_jLhefXGB9DdL3gI_dMlUjmMklLIdaMCzQ_EsKeom9L/exec";

    // --- VERY INSECURE: Hardcoded Password ---
    // Replace 'yourSecretPassword' with the password you want to use.
    // REMINDER: THIS IS VISIBLE IN BROWSER SOURCE CODE. NOT SECURE.
    const ADMIN_PASSWORD = '@surat1017';
    // -----------------------------------------

    // --- Get DOM Elements ---
    const loginSection = document.getElementById('login-section');
    const adminContent = document.getElementById('admin-content');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    // Get elements within the admin content area
    const galleryForm = document.getElementById('add-gallery-form');
    const arrivalForm = document.getElementById('add-arrival-form');
    const statusMessage = document.getElementById('status-message'); // Status for add forms

    // --- Helper Functions for Showing/Hiding Sections ---
    function showLoginForm() {
        if (loginSection) loginSection.style.display = 'block';
        if (adminContent) adminContent.style.display = 'none';
        // Center the login form vertically
        document.body.style.alignItems = 'center';
    }

    function showAdminContent() {
        if (loginSection) loginSection.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';
        // Align body content to the top when admin panel is visible
        document.body.style.alignItems = 'flex-start';
    }

    // --- Check Login Status on Page Load ---
    // sessionStorage clears when the browser tab is closed.
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showAdminContent();
    } else {
        showLoginForm();
    }

    // --- Login Form Handler ---
    if (loginForm && passwordInput && loginError) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredPassword = passwordInput.value;

            if (enteredPassword === ADMIN_PASSWORD) {
                // --- Password Correct ---
                sessionStorage.setItem('isAdminLoggedIn', 'true'); // Set login flag
                showAdminContent(); // Show the main admin forms
                passwordInput.value = ''; // Clear password field
                loginError.style.display = 'none'; // Hide any previous error message
                loginError.textContent = ''; // Clear error text
            } else {
                // --- Password Incorrect ---
                loginError.textContent = 'Invalid password. Please try again.';
                loginError.style.display = 'block'; // Show error message
                passwordInput.value = ''; // Clear password field
                passwordInput.focus(); // Focus back on password field
                sessionStorage.removeItem('isAdminLoggedIn'); // Ensure flag is removed
            }
        });
    } else {
        console.error("Login form elements (form, password input, or error display) not found!");
        // Optionally display an error to the user if login form is broken
        if(loginSection) loginSection.innerHTML = "<h2>Login form error. Please contact support.</h2>";
    }


    // --- Logout Button Handler ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('isAdminLoggedIn'); // Remove login flag
            showLoginForm(); // Show the login form again
        });
    } else {
         console.warn("Logout button not found!"); // Warn if button is missing
    }


    // --- Admin Form Submission Logic ---
    // Handles submitting data for Gallery and New Arrivals to Google Apps Script

    function showStatus(message, isError = false) {
        if (!statusMessage) {
            console.warn("Status message element not found.");
            return; // Exit if status element doesn't exist
        }
        statusMessage.textContent = message;
        // Use CSS classes for styling success/error states
        statusMessage.className = 'status ' + (isError ? 'error' : 'success');
        statusMessage.style.display = 'block'; // Make sure it's visible

        // Hide message after a delay
        setTimeout(() => {
           // Only hide if the message hasn't changed in the meantime
           if (statusMessage.textContent === message) {
             statusMessage.style.display = 'none';
             statusMessage.textContent = '';
             statusMessage.className = 'status'; // Reset class
           }
        }, isError ? 8000 : 6000); // Show errors slightly longer
    }

    function handleFormSubmit(form, action) {
        // Ensure form exists before adding listener
        if (!form) {
            console.warn(`Form element not found for action: ${action}`);
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default HTML form submission

             // --- Double-check login status before allowing submission ---
            if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
                showStatus("Error: You are not logged in. Please log in again.", true);
                showLoginForm(); // Force back to login screen
                return; // Stop the submission
            }

            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true; // Disable button during submission
            showStatus('Submitting data...', false); // Show processing message

            const formData = new FormData(form);
            const dataPayload = { action: action }; // Include the action type
            // Convert FormData entries to a plain object
            for (let [key, value] of formData.entries()) {
                dataPayload[key] = value;
            }

            // --- Check if the Google Apps Script URL is configured ---
            if (SCRIPT_URL === "YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE" || !SCRIPT_URL) {
                const errorMsg = "Admin Panel Error: Google Apps Script URL is not configured in admin.js.";
                showStatus(errorMsg, true);
                console.error("CRITICAL: Set the SCRIPT_URL variable in admin.js");
                if (submitButton) submitButton.disabled = false; // Re-enable button
                return; // Stop submission
            }


            // --- Send data to Google Apps Script ---
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors', // Required for cross-origin requests
                    cache: 'no-cache', // Don't cache POST requests
                    // Sending JSON is generally preferred if GAS is set up for it
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8', // Send as plain text to avoid CORS preflight, GAS parses `e.postData.contents`
                    },
                    body: JSON.stringify(dataPayload), // Stringify the data payload
                    // redirect: 'follow' // Default behavior
                });

                // Check if the response was successful
                 if (!response.ok) {
                    // Try to parse error details from response body if possible
                    let errorText = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorBody = await response.json(); // Try parsing JSON error
                        // Use error message from GAS if available
                        errorText = errorBody.message || errorBody.error || errorText;
                    } catch (parseError) {
                       // If body isn't JSON or can't be parsed, use status text
                       errorText = response.statusText || errorText;
                    }
                    throw new Error(errorText); // Throw error to be caught below
                 }

                // Parse the JSON response from GAS
                const result = await response.json();

                // Check the result indicator from GAS
                if (result.result === "success") {
                    showStatus(result.message || 'Item added successfully!', false);
                    form.reset(); // Clear the form fields on success
                } else {
                    // Throw error if GAS indicates failure
                    throw new Error(result.message || result.error || 'An unknown error occurred during submission.');
                }

            } catch (error) {
                // Catch fetch errors or errors thrown from response handling
                console.error('Submission Error:', error);
                showStatus(`Error: ${error.message}`, true); // Display error message to user
            } finally {
                // --- Re-enable submit button regardless of success or failure ---
                if (submitButton) submitButton.disabled = false;
            }
        });
    } // --- End handleFormSubmit ---

    // --- Initialize the form submission handlers ---
    handleFormSubmit(galleryForm, 'addGalleryItem');
    handleFormSubmit(arrivalForm, 'addArrivalItem');

}); // --- End DOMContentLoaded ---
