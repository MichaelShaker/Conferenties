import { reactive } from 'vue'

function loadSavedAuth() {
    const token = localStorage.getItem('token') || ''
    const rawUser = localStorage.getItem('user')

    if (!rawUser) {
        return {
            token,
            user: null
        }
    }

    try {
        return {
            token,
            user: JSON.parse(rawUser)
        }
    } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        return {
            token: '',
            user: null
        }
    }
}

const savedAuth = loadSavedAuth()

export const authState = reactive({
    token: savedAuth.token,
    user: savedAuth.user
})

export function setAuth(token, user) {
    authState.token = token
    authState.user = user

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth() {
    authState.token = ''
    authState.user = null

    localStorage.removeItem('token')
    localStorage.removeItem('user')
}
