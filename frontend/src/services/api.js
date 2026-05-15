const API_BASE_URL = "/api";

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

async function handleResponse(response) {
    const text = await response.text();
    let result = {};

    try {
        result = text ? JSON.parse(text) : {};
    } catch (error) {
        throw new Error(text || "Server returned an invalid response");
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
}

export async function fetchConferences() {
    const response = await fetch(`${API_BASE_URL}/conferences`);
    const result = await handleResponse(response);
    return result.data;
}

export async function fetchConferenceById(id) {
    const response = await fetch(`${API_BASE_URL}/conferences/${id}`);
    const result = await handleResponse(response);
    return result.data;
}

export async function loginUser(formData) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    const text = await response.text();
    let result = {};

    try {
        result = text ? JSON.parse(text) : {};
    } catch (error) {
        throw new Error(text || "Server returned an invalid login response");
    }

    if (!response.ok) {
        throw new Error(result.message || "Login failed");
    }

    return result;
}

export async function registerUser(formData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
    });

    return handleResponse(response);
}

export async function createRegistration(conferenceId, details = {}) {
    const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ conferenceId, ...details })
    });

    return handleResponse(response);
}

export async function fetchMyRegistrations() {
    const response = await fetch(`${API_BASE_URL}/registrations/mine`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function fetchAdminRegistrations() {
    const response = await fetch(`${API_BASE_URL}/registrations`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function fetchRegistrationPaymentProof(id) {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}/payment-proof`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function updateRegistrationStatus(id, payload) {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    return handleResponse(response);
}

export async function resendRegistrationEmail(id) {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}/resend-email`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

export async function cancelRegistration(id) {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}/cancel`, {
        method: "PUT",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

export async function createConference(payload) {
    const response = await fetch(`${API_BASE_URL}/conferences`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    return handleResponse(response);
}

export async function updateConference(id, payload) {
    const response = await fetch(`${API_BASE_URL}/conferences/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    return handleResponse(response);
}

export async function resendConferenceEmail(id) {
    const response = await fetch(`${API_BASE_URL}/conferences/${id}/resend-email`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

export async function sendConferenceTestEmail(id) {
    const response = await fetch(`${API_BASE_URL}/conferences/${id}/test-email`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

export async function unsubscribeFromEventEmails(token) {
    const response = await fetch(`${API_BASE_URL}/auth/unsubscribe`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
    });

    return handleResponse(response);
}

export async function fetchAdminAuditLogs() {
    const response = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function fetchAdminEmailLogs() {
    const response = await fetch(`${API_BASE_URL}/admin/email-logs`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function fetchAdminUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function updateAdminUser(id, payload) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    return handleResponse(response);
}

export async function fetchAdminStatus() {
    const response = await fetch(`${API_BASE_URL}/admin/status`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function deleteConference(id) {
    const response = await fetch(`${API_BASE_URL}/conferences/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

export async function uploadPaymentProof(id, paymentProof) {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}/payment-proof`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentProof })
    });

    return handleResponse(response);
}

export async function fetchChurches() {
    const response = await fetch(`${API_BASE_URL}/churches`);
    const result = await handleResponse(response);
    return result.data;
}

export async function fetchMyProfile() {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function exportApprovedUsersCsv(eventId, eventTitle = "event", filter = "all") {
    const params = new URLSearchParams({ filter });
    const response = await fetch(
        `${API_BASE_URL}/conferences/${eventId}/approved-users/export?${params.toString()}`,
        {
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {
        throw new Error("CSV export mislukt");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const safeTitle = eventTitle
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase();

    const link = document.createElement("a");
    link.href = url;
    link.download = `deelnemers-${safeTitle}.csv`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function fetchGoogleSheetsStatus() {
    const response = await fetch(`${API_BASE_URL}/google/status`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function fetchGoogleSheetsAuthUrl() {
    const response = await fetch(`${API_BASE_URL}/google/auth-url`, {
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data.authUrl;
}

export async function syncGoogleSheetForEvent(eventId) {
    const response = await fetch(`${API_BASE_URL}/google/conferences/${eventId}/sync`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function syncAllGoogleSheets() {
    const response = await fetch(`${API_BASE_URL}/google/conferences/sync-all`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    return result.data;
}

export async function updateMyProfile(payload) {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    const result = await handleResponse(response);
    return result.data;
}
