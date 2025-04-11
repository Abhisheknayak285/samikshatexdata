document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANT: Replace with your DEPLOYED Google Apps Script URL !!!
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynJVLQR_1H2VWYCIM5gBIpgNppCqq9QVXJTYLNq3QM9rY_NAwOTUZBJVexMNhJW9NX/exec";

    const galleryForm = document.getElementById('add-gallery-form');
    const arrivalForm = document.getElementById('add-arrival-form');
    const statusMessage = document.getElementById('status-message');

    function showStatus(message, isError = false) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'status error' : 'status success';
        statusMessage.style.display = 'block';

        // Optional: Hide message after a few seconds
        setTimeout(() => {
           if (statusMessage.textContent === message) { // Only hide if message hasn't changed
             statusMessage.style.display = 'none';
             statusMessage.textContent = '';
             statusMessage.className = 'status';
           }
        }, 6000); // Hide after 6 seconds
    }

    function handleFormSubmit(form, action) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            showStatus('Submitting...', false); // Indicate processing

            const formData = new FormData(form);
            const dataPayload = { action: action };
            // Convert FormData to simple object
            for (let [key, value] of formData.entries()) {
                dataPayload[key] = value;
            }

            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors', // Required for cross-origin requests to GAS web app
                    cache: 'no-cache',
                    headers: {
                       // Usually GAS handles JSON automatically from stringified body
                       // 'Content-Type': 'application/json', // Can sometimes cause issues, test without first
                    },
                    // GAS expects stringified data in e.postData.contents
                    body: JSON.stringify(dataPayload),
                    // Redirect handling might be needed depending on GAS setup, but 'follow' is default
                    // redirect: 'follow'
                });

                 // Check if response is OK (status 200-299)
                 if (!response.ok) {
                    // Try to get error details from response body if possible
                    let errorText = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorBody = await response.json(); // Try parsing JSON error
                        errorText = errorBody.message || errorText;
                    } catch (parseError) {
                       // If body isn't JSON or can't be parsed, use status text
                       errorText = response.statusText || errorText;
                    }
                    throw new Error(errorText);
                 }

                // Parse the JSON response from GAS
                const result = await response.json();

                if (result.result === "success") {
                    showStatus(result.message || 'Item added successfully!', false);
                    form.reset(); // Clear the form
                } else {
                    throw new Error(result.message || 'An unknown error occurred.');
                }

            } catch (error) {
                console.error('Submission Error:', error);
                showStatus(`Error: ${error.message}`, true);
            } finally {
                submitButton.disabled = false; // Re-enable button
            }
        });
    }

    if (galleryForm) {
        handleFormSubmit(galleryForm, 'addGalleryItem');
    }
    if (arrivalForm) {
        handleFormSubmit(arrivalForm, 'addArrivalItem');
    }

     // Check if SCRIPT_URL is set
    if (SCRIPT_URL === "YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE" || !SCRIPT_URL) {
        showStatus("Admin Panel Error: Google Apps Script URL is not set in admin.js.", true);
        console.error("CRITICAL: Set the SCRIPT_URL variable in admin.js");
        // Disable forms if URL is missing
        if(galleryForm) galleryForm.querySelector('button[type="submit"]').disabled = true;
        if(arrivalForm) arrivalForm.querySelector('button[type="submit"]').disabled = true;
    }

});
