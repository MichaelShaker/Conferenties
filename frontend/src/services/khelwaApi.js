const API_URL = "/api/khelwa"

function getToken() {
    return localStorage.getItem("token")
}

export async function getKhelwaAvailability(month) {
    const response = await fetch(`${API_URL}/availability?month=${month}`)
    return await response.json()
}

export async function blockKhelwaDate(blocked_date, reason = "") {
    const response = await fetch(`${API_URL}/admin/block-date`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            blocked_date,
            reason
        })
    })

    return await response.json()
}

export async function createKhelwaReservation(data) {
    const token = getToken()

    const headers = {
        "Content-Type": "application/json"
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/reserve`, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
    })

    return await response.json()
}

export async function getMyKhelwaReservations() {
    const response = await fetch(`${API_URL}/my-reservations`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    })

    return await response.json()
}

export async function getAdminKhelwaReservations() {
    const response = await fetch(`${API_URL}/admin/reservations`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    })

    return await response.json()
}

export async function approveKhelwaReservation(id, admin_note = "") {
    const response = await fetch(`${API_URL}/admin/reservations/${id}/approve`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ admin_note })
    })

    return await response.json()
}

export async function rejectKhelwaReservation(id, admin_note = "") {
    const response = await fetch(`${API_URL}/admin/reservations/${id}/reject`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ admin_note })
    })

    return await response.json()
}