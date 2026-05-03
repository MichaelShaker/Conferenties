<template>
  <main class="auth-page">
    <section class="auth-layout">
      <div class="auth-info">
        <span class="badge">Khelwa registratie</span>
        <h1>Maak je account aan</h1>
        <p>
          Maak één account aan en gebruik die voor beide websites: events en Khelwa.
        </p>
      </div>

      <div class="auth-card">
        <div class="card-header">
          <h2>Registreren</h2>
          <p>Vul je gegevens in om verder te gaan.</p>
        </div>

        <StatusMessage :message="message" :success="success" />

        <form @submit.prevent="handleRegister">
          <label>
            Naam
            <input v-model="form.name" type="text" required />
          </label>

          <label>
            E-mailadres
            <input v-model="form.email" type="email" required />
          </label>

          <label>
            Wachtwoord
            <input v-model="form.password" type="password" required />
          </label>

          <button type="submit" :disabled="loading">
            {{ loading ? "Registreren..." : "Account aanmaken" }}
          </button>
        </form>

        <p class="switch-link">
          Al een account?
          <RouterLink to="/khelwa/login">Inloggen</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import StatusMessage from "../components/StatusMessage.vue"
import { registerUser } from "../services/api"

const router = useRouter()

const loading = ref(false)
const message = ref("")
const success = ref(false)

const form = reactive({
  name: "",
  email: "",
  password: ""
})

async function handleRegister() {
  loading.value = true
  message.value = ""

  try {
    await registerUser(form)

    success.value = true
    message.value = "Registratie succesvol. Je kunt nu inloggen."
    router.push("/khelwa/login")
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

.switch-link {
  margin-top: 18px;
  text-align: center;
}

.switch-link a {
  color: var(--brown);
  font-weight: 950;
}

@media (max-width: 900px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
}
</style>