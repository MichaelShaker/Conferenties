<template>
  <main class="auth-page">
    <section class="auth-layout">
      <div class="auth-info">
        <span class="badge">Khelwa toegang</span>
        <h1>Inloggen voor Khelwa</h1>
        <p>
          Log in met hetzelfde account om je Khelwa reserveringen te beheren.
        </p>
      </div>

      <div class="auth-card">
        <div class="card-header">
          <h2>Inloggen</h2>
          <p>Gebruik je bestaande accountgegevens.</p>
        </div>

        <StatusMessage :message="message" :success="success" />

        <form @submit.prevent="handleLogin">
          <label>
            E-mailadres
            <input v-model="form.email" type="email" required />
          </label>

          <label>
            Wachtwoord
            <input v-model="form.password" type="password" required />
          </label>

          <button type="submit" :disabled="loading">
            {{ loading ? "Inloggen..." : "Inloggen" }}
          </button>
        </form>

        <RouterLink class="forgot-link" to="/forgot-password">
          Wachtwoord vergeten?
        </RouterLink>

        <p class="switch-link">
          Nog geen account?
          <RouterLink to="/khelwa/register">Registreren</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import StatusMessage from "../components/StatusMessage.vue"
import { setAuth } from "../stores/auth"
import { loginUser } from "../services/api"

const router = useRouter()

const loading = ref(false)
const message = ref("")
const success = ref(false)

const form = reactive({
  email: "",
  password: ""
})

async function handleLogin() {
  loading.value = true
  message.value = ""

  try {
    const response = await loginUser(form)

    setAuth(response.data.token, response.data.user)

    success.value = true
    message.value = "Inloggen succesvol."

    if (!response.data.user.profileCompleted) {
      router.push("/complete-profile")
    } else {
      router.push("/khelwa/account")
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
.auth-page {
  --dark: #231914;
  --brown: #7a573d;

  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  padding: 40px 0 70px;
}

.auth-layout {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 430px;
  gap: 48px;
  align-items: center;
}

.auth-info,
.auth-card {
  position: relative;
  background:
      linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,250,244,0.9)),
      radial-gradient(circle at top right, rgba(122,87,61,0.16), transparent 34%);
  border: 1px solid rgba(122,87,61,0.16);
  box-shadow: 0 26px 70px rgba(35,25,20,0.12);
  clip-path: polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px));
}

.auth-info {
  padding: 46px;
}

.auth-card {
  padding: 36px;
}

.badge {
  display: inline-flex;
  align-items: center;
  color: var(--brown);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.badge::before {
  content: "";
  width: 34px;
  height: 2px;
  background: var(--brown);
  margin-right: 12px;
}

.auth-info h1 {
  margin: 0;
  color: var(--dark);
  font-size: clamp(42px, 5vw, 70px);
  line-height: 0.95;
  letter-spacing: -0.075em;
  font-weight: 950;
}

.auth-info p,
.card-header p,
.switch-link {
  color: rgba(35,25,20,0.68);
  line-height: 1.7;
  font-weight: 650;
}

.card-header {
  margin-bottom: 24px;
}

.card-header h2 {
  margin: 0 0 8px;
  color: var(--dark);
  font-size: 32px;
  font-weight: 950;
  letter-spacing: -0.05em;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
  color: rgba(35,25,20,0.72);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.04em;
}

input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(122,87,61,0.2);
  background: rgba(255,250,244,0.82);
  color: var(--dark);
  padding: 15px 16px;
  font-size: 15px;
  font-weight: 700;
  outline: none;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

input:focus {
  background: white;
  border-color: rgba(122,87,61,0.55);
  box-shadow: 0 0 0 4px rgba(122,87,61,0.1);
}

button {
  width: 100%;
  border: 0;
  color: white;
  background: linear-gradient(135deg, #2f241d, #7a573d);
  padding: 15px 20px;
  font-weight: 950;
  cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-link,
.switch-link a {
  color: var(--brown);
  font-weight: 950;
}

.forgot-link {
  display: block;
  margin-top: 16px;
  text-align: center;
  text-decoration: none;
}

.switch-link {
  margin-top: 18px;
  text-align: center;
}

@media (max-width: 900px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
}
</style>