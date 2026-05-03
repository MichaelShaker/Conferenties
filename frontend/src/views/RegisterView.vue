<template>
  <main class="register-view">

    <section class="register-layout">
      <div class="register-info">
        <p class="eyebrow">Accountregistratie</p>

        <h1>Maak een account aan</h1>

        <p>
          Registreer om je aan te melden voor evenementen en je inschrijvingen
          overzichtelijk te beheren.
        </p>
      </div>

      <div class="register-card">
        <div class="card-header">
          <h2>Registreren</h2>
          <p>Vul onderstaande gegevens in.</p>
        </div>

        <StatusMessage :message="message" :success="success" />

        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="name">Naam</label>
            <input
                id="name"
                v-model="form.name"
                type="text"
                autocomplete="name"
                required
            />
          </div>

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
                autocomplete="new-password"
                required
            />
          </div>

          <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? 'Registreren...' : 'Account aanmaken' }}
          </button>
        </form>

        <p class="login-link">
          Al een account?
          <RouterLink to="/login">Inloggen</RouterLink>
        </p>
      </div>
    </section>

  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusMessage from '../components/StatusMessage.vue'
import { registerUser } from '../services/api'

const router = useRouter()

const loading = ref(false)
const message = ref('')
const success = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: ''
})

async function handleRegister() {
  loading.value = true
  message.value = ''

  try {
    await registerUser(form)

    success.value = true
    message.value = 'Registratie succesvol. Je kunt nu inloggen.'
    router.push('/login')
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background:
      radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.12), transparent 35%),
      linear-gradient(135deg, #ffffff, #f8fafc);
}

.register-layout {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 60px;
  align-items: center;
}

.register-info {
  max-width: 540px;
}

.eyebrow {
  margin-bottom: 12px;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.register-info h1 {
  margin-bottom: 18px;
  color: #0f172a;
  font-size: clamp(2.8rem, 5vw, 4.6rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.register-info p {
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.7;
}

.register-card {
  padding: 36px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

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

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 800;
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

.submit-btn {
  width: 100%;
  margin-top: 10px;
  padding: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border: none;
  font-size: 0.95rem;
  font-weight: 800;
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

.login-link {
  margin-top: 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.login-link a {
  color: #2563eb;
  font-weight: 800;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .register-layout {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .register-info {
    margin: 0 auto;
  }

  .register-card {
    max-width: 420px;
    margin: 0 auto;
  }
}

@media (max-width: 560px) {
  .register-view {
    padding: 40px 20px;
  }

  .register-info h1 {
    font-size: 2.5rem;
  }

  .register-card {
    padding: 26px;
    border-radius: 22px;
  }
}
</style>