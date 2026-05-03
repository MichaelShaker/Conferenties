import { reactive } from 'vue'

const savedToken = localStorage.getItem('token')
const savedUser = JSON.parse(localStorage.getItem('user') || 'null')

export const authState = reactive({
    token: savedToken || '',
    user: savedUser || null
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