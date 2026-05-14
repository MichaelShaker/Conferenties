import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import EventsView from '../views/EventsView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AccountView from '../views/AccountView.vue'
import MyRegistrationsView from '../views/MyRegistrationsView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminEventsView from '../views/AdminEventsView.vue'
import AdminRegistrationsView from '../views/AdminRegistrationsView.vue'
import AdminAuditView from '../views/AdminAuditView.vue'
import AdminEmailLogsView from '../views/AdminEmailLogsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminStatusView from '../views/AdminStatusView.vue'
import CompleteProfileView from '../views/CompleteProfileView.vue'
import ForgotPasswordView from "../views/ForgotPasswordView.vue"
import ResetPasswordView from "../views/ResetPasswordView.vue"
import UnsubscribeView from "../views/UnsubscribeView.vue"

import { authState } from '../stores/auth.js'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/events',
        name: 'events',
        component: EventsView
    },
    {
        path: '/events/:id',
        name: 'event-detail',
        component: EventDetailView,
        props: true
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView
    },
    {
        path: '/account',
        name: 'account',
        component: AccountView,
        meta: { requiresAuth: true }
    },
    {
        path: '/my-registrations',
        name: 'my-registrations',
        component: MyRegistrationsView,
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/events',
        name: 'admin-events',
        component: AdminEventsView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/registrations',
        name: 'admin-registrations',
        component: AdminRegistrationsView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/audit',
        name: 'admin-audit',
        component: AdminAuditView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/email-logs',
        name: 'admin-email-logs',
        component: AdminEmailLogsView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/status',
        name: 'admin-status',
        component: AdminStatusView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/complete-profile',
        name: 'complete-profile',
        component: CompleteProfileView,
        meta: { requiresAuth: true }
    },
    {
        path: '/edit-profile',
        name: 'edit-profile',
        component: CompleteProfileView,
        meta: { requiresAuth: true }
    },
    {
        path: "/forgot-password",
        name: "forgot-password",
        component: ForgotPasswordView
    },
    {
        path: "/reset-password/:token",
        name: "reset-password",
        component: ResetPasswordView
    },
    {
        path: "/unsubscribe",
        name: "unsubscribe",
        component: UnsubscribeView
    },

    // Khelwa mini-app
    {
        path: '/khelwa',
        component: () => import('../views/KhelwaLayout.vue'),
        children: [
            {
                path: '',
                name: 'khelwa-home',
                component: () => import('../views/KhelwaBookingView.vue')
            },
            {
                path: 'admin',
                name: 'khelwa-admin',
                component: () => import('../views/AdminKhelwaReservationsView.vue'),
                meta: { requiresAuth: true, requiresAdmin: true }
            },
            {
                path: '/khelwa/my-reservations',
                name: 'khelwa-my-reservations',
                component: () => import('../views/MyKhelwaReservationsView.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'account',
                name: 'khelwa-account',
                component: () => import('../views/KhelwaAccountView.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'login',
                name: 'khelwa-login',
                component: () => import('../views/KhelwaLoginView.vue')
            },
            {
                path: 'register',
                name: 'khelwa-register',
                component: () => import('../views/KhelwaRegisterView.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const isLoggedIn = !!authState.token
    const isAdmin = authState.user?.role === 'admin'

    if (to.meta.requiresAuth && !isLoggedIn) {
        return next('/login')
    }

    if (to.meta.requiresAdmin && !isAdmin) {
        return next('/')
    }

    next()
})

export default router
