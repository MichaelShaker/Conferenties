const API_BASE_URL = "/api";

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

async function handleResponse(response) {
    const result = await response.json();

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

    const result = await response.json();

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

export async function createRegistration(conferenceId) {
    const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ conferenceId })
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

export async function updateRegistrationStatus(id, payload) {
    const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
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

export async function updateMyProfile(payload) {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    const result = await handleResponse(response);
    return result.data;
}