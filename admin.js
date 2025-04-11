// ==========================================================================
// ================== Full JavaScript for admin.html ========================
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANT: Replace with your DEPLOYED Google Apps Script URL !!!
    // This URL is for ADDING/DELETING/FETCHING Gallery and New Arrivals data.
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxW-Pbd0molCtMgesFI7aWt2bk3dBKaIsZWxvLiRDathxHWkRFC_HWokVCHC1pix3A1/exec";

    // --- VERY INSECURE: Hardcoded Password ---
    // Replace 'yourSecretPassword' with the password you want to use.
    // REMINDER: THIS IS VISIBLE IN BROWSER SOURCE CODE. NOT SECURE AT ALL.
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
    const statusMessage = document.getElementById('status-message'); // Status for ADD actions
    const deleteStatusMessage = document.getElementById('delete-status-message'); // Status for DELETE actions
    const galleryItemsContainer = document.getElementById('current-gallery-items');
    const arrivalItemsContainer = document.getElementById('current-arrival-items');

    // --- Helper Functions for Showing/Hiding Sections ---
    function showLoginForm() {
        if (loginSection) loginSection.style.display = 'block';
        if (adminContent) adminContent.style.display = 'none';
        document.body.style.alignItems = 'center'; // Center login form vertically
    }

    function showAdminContent() {
        if (loginSection) loginSection.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';
        document.body.style.alignItems = 'flex-start'; // Align content to top
        // Fetch existing items when showing admin content
        fetchAndDisplayItems();
    }

    // --- Status Message Function ---
    function showStatus(element, message, isError = false, duration = 6000) {
        if (!element) return;
        element.textContent = message;
        element.className = 'status ' + (isError ? 'error' : 'success');
        element.style.display = 'block';
        setTimeout(() => {
           if (element.textContent === message) {
             element.style.display = 'none';
             element.textContent = '';
             element.className = 'status';
           }
        }, isError ? duration + 2000 : duration);
    }

    // --- Fetch and Display Existing Items ---
    async function fetchAndDisplayItems() {
        if (!galleryItemsContainer || !arrivalItemsContainer) {
             console.error("Item display containers not found."); return;
        }
        galleryItemsContainer.innerHTML = '<p class="loading-indicator">Loading gallery items...</p>';
        arrivalItemsContainer.innerHTML = '<p class="loading-indicator">Loading new arrival items...</p>';

        if (SCRIPT_URL === "YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE" || !SCRIPT_URL) {
            const errorMsg = "Cannot load items: Admin Apps Script URL is not configured.";
            showStatus(statusMessage, errorMsg, true, 10000);
            galleryItemsContainer.innerHTML = `<p style="color:red;">${errorMsg}</p>`;
            arrivalItemsContainer.innerHTML = `<p style="color:red;">${errorMsg}</p>`;
            return;
        }

        try {
            // Use GET for fetching data
            const response = await fetch(`${SCRIPT_URL}?action=getData&v=${Date.now()}`, {
                 method: 'GET', // Explicitly GET for fetching
                 cache: 'no-store'
            });
            if (!response.ok) {
                let errorText = `Failed to fetch items (Status: ${response.status})`;
                try { const err = await response.json(); errorText = err.message || err.error || errorText; } catch(e){}
                throw new Error(errorText);
            }
            const data = await response.json();
            if (data.error) throw new Error(`Error from server: ${data.error}`);

            // Display Gallery Items
            galleryItemsContainer.innerHTML = '';
            if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
                data.gallery.forEach(item => galleryItemsContainer.appendChild(createItemElement(item, 'gallery')));
            } else {
                galleryItemsContainer.innerHTML = '<p>No gallery items found.</p>';
            }

            // Display Arrival Items
            arrivalItemsContainer.innerHTML = '';
            if (data.newArrivals && Array.isArray(data.newArrivals) && data.newArrivals.length > 0) {
                data.newArrivals.forEach(item => arrivalItemsContainer.appendChild(createItemElement(item, 'arrival')));
            } else {
                arrivalItemsContainer.innerHTML = '<p>No new arrival items found.</p>';
            }

        } catch (error) {
            console.error("Error fetching items:", error);
            const errorText = `Error loading items: ${error.message}`;
            showStatus(statusMessage, errorText, true, 10000);
             galleryItemsContainer.innerHTML = `<p style="color:red;">${errorText}</p>`;
             arrivalItemsContainer.innerHTML = `<p style="color:red;">${errorText}</p>`;
        }
    }

    // --- Helper to Create HTML for Each Item ---
    function createItemElement(item, itemType) {
        if (!item || !item.ID) {
            console.warn("Skipping item render due to missing ID:", item);
            return document.createDocumentFragment(); // Return empty, non-renderable fragment
        }

        const div = document.createElement('div');
        div.className = 'manage-item';
        div.dataset.itemId = item.ID;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'item-details';

        const img = document.createElement('img');
        img.src = item.ImageURL || 'images/placeholder.png';
        img.alt = item.Title || 'Item image';
        img.className = 'item-thumbnail';
        img.onerror = () => { img.src = 'images/placeholder.png'; img.alt = 'Invalid image'; };

        const textDiv = document.createElement('div');
        textDiv.className = 'item-text';
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.Title || '(No Title)';
        titleSpan.title = item.Title || '';
        const descSpan = document.createElement('span');
        descSpan.textContent = item.Description || '(No Description)';
        descSpan.title = item.Description || '';
        textDiv.appendChild(titleSpan);
        textDiv.appendChild(descSpan);

        detailsDiv.appendChild(img);
        detailsDiv.appendChild(textDiv);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.dataset.id = item.ID;
        deleteButton.dataset.type = itemType;

        div.appendChild(detailsDiv);
        div.appendChild(deleteButton);
        return div;
    }

    // --- Handle Delete Request ---
    async function sendDeleteRequest(itemId, itemType) {
        if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
            showStatus(deleteStatusMessage, "Error: Not logged in.", true);
            showLoginForm(); return;
        }

        const action = itemType === 'gallery' ? 'deleteGalleryItem' : 'deleteArrivalItem';
        const payload = { action: action, id: itemId };

        const deleteButton = document.querySelector(`.delete-button[data-id="${itemId}"][data-type="${itemType}"]`);
        if(deleteButton) deleteButton.disabled = true;
        showStatus(deleteStatusMessage, `Deleting ${itemType} item (ID: ${itemId})...`, false);

        try {
            const response = await fetch(SCRIPT_URL, {
                // --- Use POST for delete actions ---
                method: 'POST',
                // ----------------------------------
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                 let errorText = `HTTP error! Status: ${response.status}`;
                 try { const err = await response.json(); errorText = err.message || err.error || errorText; } catch (e) {}
                 throw new Error(errorText);
            }
            const result = await response.json();

            if (result.result === 'success') {
                showStatus(deleteStatusMessage, result.message || 'Item deleted successfully.', false);
                const itemElement = document.querySelector(`.manage-item[data-item-id="${itemId}"]`);
                if (itemElement) {
                    itemElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                    itemElement.style.opacity = '0';
                    itemElement.style.transform = 'translateX(-20px)'; // Slide out effect
                    setTimeout(() => itemElement.remove(), 500);
                }
            } else {
                throw new Error(result.message || result.error || 'Deletion failed.');
            }

        } catch (error) {
            console.error("Delete Error:", error);
            showStatus(deleteStatusMessage, `Error deleting item: ${error.message}`, true, 8000);
             if(deleteButton) deleteButton.disabled = false; // Re-enable on error
        }
    }


    // --- Check Login Status on Page Load ---
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
                 sessionStorage.setItem('isAdminLoggedIn', 'true');
                 showAdminContent(); // Calls fetchAndDisplayItems inside
                 passwordInput.value = '';
                 loginError.style.display = 'none';
                 loginError.textContent = '';
             } else {
                 loginError.textContent = 'Invalid password.';
                 loginError.style.display = 'block';
                 passwordInput.value = '';
                 passwordInput.focus();
                 sessionStorage.removeItem('isAdminLoggedIn');
             }
        });
     } else { console.error("Login form elements missing!"); }

    // --- Logout Button Handler ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('isAdminLoggedIn');
             if(galleryItemsContainer) galleryItemsContainer.innerHTML = ''; // Clear items visually
             if(arrivalItemsContainer) arrivalItemsContainer.innerHTML = '';
            showLoginForm();
        });
    } else { console.warn("Logout button missing!"); }

    // --- ADD Form Submission Handler ---
    function handleFormSubmit(form, action) {
        if (!form) {
            console.warn(`Add form element not found for action: ${action}`);
            return;
        }
        form.addEventListener('submit', async (e) => {
             e.preventDefault();
             if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
                showStatus(statusMessage, "Error: Not logged in.", true);
                showLoginForm(); return;
             }
             const submitButton = form.querySelector('button[type="submit"]');
             if (submitButton) submitButton.disabled = true;
             showStatus(statusMessage, `Adding ${action.includes('Gallery') ? 'gallery' : 'arrival'} item...`, false);
             const formData = new FormData(form);
             const dataPayload = { action: action };
             for (let [key, value] of formData.entries()) { dataPayload[key] = value; }

             if (SCRIPT_URL === "YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE" || !SCRIPT_URL) {
                 showStatus(statusMessage, "Admin Panel Error: Google Apps Script URL is not set.", true);
                 if (submitButton) submitButton.disabled = false; return;
             }

             try {
                 // --- Ensure POST method is used for adding items ---
                 const response = await fetch(SCRIPT_URL, {
                     method: 'POST', // <<<--- CORRECT METHOD FOR ADDING
                     mode: 'cors',
                     cache: 'no-cache',
                     headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                     body: JSON.stringify(dataPayload)
                 });
                 // --------------------------------------------------

                 if (!response.ok) {
                     let errorText = `HTTP error! Status: ${response.status}`;
                     try { const err = await response.json(); errorText = err.message || err.error || errorText;} catch(e){}
                     throw new Error(errorText);
                 }
                 const result = await response.json();
                 if (result.result === "success") {
                     showStatus(statusMessage, result.message || 'Item added successfully!', false);
                     form.reset();
                     // Refresh the item list view after adding
                     fetchAndDisplayItems();
                 } else { throw new Error(result.message || result.error || 'Failed to add item.'); }
             } catch (error) {
                 console.error('Submission Error:', error);
                 showStatus(statusMessage, `Error adding item: ${error.message}`, true);
             } finally {
                 if (submitButton) submitButton.disabled = false;
             }
        });
    } // --- End handleFormSubmit ---

    // --- Initialize the ADD form submission handlers ---
    handleFormSubmit(galleryForm, 'addGalleryItem');
    handleFormSubmit(arrivalForm, 'addArrivalItem');

    // --- Event Delegation for DELETE Buttons ---
    function setupDeleteListeners() {
        const adminContentDiv = document.getElementById('admin-content');
        if (adminContentDiv) {
            adminContentDiv.addEventListener('click', (event) => {
                const deleteButton = event.target.closest('.delete-button'); // Find button even if icon inside is clicked
                if (deleteButton) {
                    const itemId = deleteButton.dataset.id;
                    const itemType = deleteButton.dataset.type;
                    if (itemId && itemType) {
                        if (confirm(`DELETE Item?\n\nType: ${itemType}\nID: ${itemId}\n\nThis action cannot be undone.`)) {
                            sendDeleteRequest(itemId, itemType);
                        }
                    } else {
                         console.error("Delete button missing ID or Type data.");
                         showStatus(deleteStatusMessage, "Error: Could not identify item to delete.", true);
                    }
                }
            });
        } else {
             console.error("#admin-content container not found for delete listeners.");
        }
    }
    // Set up delete listeners once the DOM is ready
    setupDeleteListeners();

}); // --- End DOMContentLoaded ---
