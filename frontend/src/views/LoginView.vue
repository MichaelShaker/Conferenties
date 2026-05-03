<template>
  <main class="login-view">

    <section class="login-layout">

      <!-- LEFT SIDE -->
      <div class="login-info">
        <p class="eyebrow">Accounttoegang</p>

        <h1>Inloggen op je account</h1>

        <p>
          Log in om je inschrijvingen te beheren en toegang te krijgen tot je account.
        </p>
      </div>

      <!-- FORM -->
      <div class="login-card">
        <div class="card-header">
          <h2>Inloggen</h2>
          <p>Voer je gegevens in om verder te gaan.</p>
        </div>

        <StatusMessage :message="message" :success="success" />

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">E-mailadres</label>
            <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
            />
          </div>

          <div class="form-group">
            <label for="password">Wachtwoord</label>
            <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                required
            />
          </div>

          <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? 'Inloggen...' : 'Inloggen' }}
          </button>
        </form>

        <router-link to="/forgot-password">
          Wachtwoord vergeten?
        </router-link>

        <p class="register-link">
          Nog geen account?
          <RouterLink to="/register">Registreren</RouterLink>
        </p>
      </div>

    </section>

  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusMessage from '../components/StatusMessage.vue'
import { setAuth } from '../stores/auth'
import { loginUser } from '../services/api'

const router = useRouter()

const loading = ref(false)
const message = ref('')
const success = ref(false)

const form = reactive({
  email: '',
  password: ''
})

async function handleLogin() {
  loading.value = true
  message.value = ''

  try {
    const response = await loginUser(form)

    setAuth(response.data.token, response.data.user)

    success.value = true
    message.value = 'Inloggen succesvol.'
    if (!response.data.user.profileCompleted) {
      router.push('/complete-profile')
    } else {
      router.push(response.data.user.role === 'admin' ? '/admin' : '/account')
    }
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background:
      radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.12), transparent 35%),
      linear-gradient(135deg, #ffffff, #f8fafc);
}

/* LAYOUT */
.login-layout {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 60px;
  align-items: center;
}

/* LEFT SIDE (TEXT) */
.login-info {
  max-width: 520px;
}

.eyebrow {
  margin-bottom: 12px;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-info h1 {
  margin-bottom: 18px;
  color: #0f172a;
  font-size: clamp(2.8rem, 5vw, 4.6rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.login-info p {
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.7;
}

/* FORGOT PASSWORD LINK */
.login-card > a {
  display: block;
  margin-top: 14px;
  font-size: 0.85rem;
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
  transition: 0.2s ease;
  text-align: center;
}

.login-card > a:hover {
  text-decoration: underline;
  color: #1d4ed8;
}

/* HEADER */
.card-header {
  margin-bottom: 26px;
}

.card-header h2 {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1.6rem;
  letter-spacing: -0.03em;
}

.card-header p {
  color: #64748b;
  font-size: 0.95rem;
}

/* FORM */
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #475569;
}

.form-group input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* BUTTON */
.submit-btn {
  width: 100%;
  margin-top: 10px;
  padding: 14px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  transition: 0.2s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.28);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* LINK */
.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
}

.register-link a {
  color: #2563eb;
  font-weight: 800;
}

.register-link a:hover {
  text-decoration: underline;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .login-info {
    margin: 0 auto;
  }

  .login-card {
    max-width: 420px;
    margin: 0 auto;
  }
}

@media (max-width: 560px) {
  .login-view {
    padding: 40px 20px;
  }

  .login-info h1 {
    font-size: 2.5rem;
  }

  .login-card {
    padding: 26px;
    border-radius: 22px;
  }
}
</style>