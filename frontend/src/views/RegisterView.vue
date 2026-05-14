<template>
  <main class="register-view">
    <section class="register-shell">

      <!-- LEFT SIDE -->
      <div class="register-hero">
        <div class="brand-pill">
          <span></span>
          Conferenties platform
        </div>

        <h1>Start vandaag met je conferentiehub.</h1>

        <p>
          Maak een account aan om je evenementen, tickets en inschrijvingen makkelijk te beheren.
        </p>

        <div class="hero-cards">
          <div class="mini-card">
            <strong>Snel</strong>
            <span>Registreren in enkele stappen</span>
          </div>

          <div class="mini-card">
            <strong>1 plek</strong>
            <span>Voor al je evenementen</span>
          </div>
        </div>
      </div>

      <!-- FORM -->
      <div class="register-card">
        <div class="card-decoration"></div>

        <div class="card-header">
          <p class="card-label">Accountregistratie</p>
          <h2>Registreren</h2>
          <p>Vul je gegevens in om een account aan te maken.</p>
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
                placeholder="Je naam"
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
                placeholder="jij@example.com"
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
                placeholder="••••••••"
                required
            />
          </div>

          <button class="submit-btn" type="submit" :disabled="loading">
            {{ loading ? 'Registreren...' : 'Account aanmaken' }}
          </button>

          <p class="privacy-note">
            We bewaren je accountgegevens om inschrijvingen, betalingen en eventcommunicatie te beheren.
            Je kunt event-emails later uitzetten in je profiel of via de afmeldlink in emails.
          </p>
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
  width: 100%;
  min-height: 100vh;

  background:
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 30%),
      linear-gradient(135deg, #f8fafc, #eef4ff);
}

.register-shell {
  width: 100%;
  min-height: 100vh;

  display: flex;
  flex-wrap: wrap;
}

/* LEFT SIDE */
.register-hero {
  position: relative;

  flex: 1 1 50%;
  min-width: 320px;
  min-height: 100vh;

  padding: clamp(40px, 6vw, 100px);

  display: flex;
  flex-direction: column;
  justify-content: center;

  overflow: hidden;

  color: white;

  background:
      linear-gradient(
          145deg,
          rgba(15, 23, 42, 0.92),
          rgba(30, 64, 175, 0.88)
      ),
      url("https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80");

  background-size: cover;
  background-position: center;
}

.register-hero::after {
  content: "";

  position: absolute;
  inset: 0;

  background:
      radial-gradient(
          circle at 20% 20%,
          rgba(96, 165, 250, 0.3),
          transparent 28%
      ),
      linear-gradient(
          to top,
          rgba(15, 23, 42, 0.7),
          transparent
      );

  pointer-events: none;
}

.register-hero > * {
  position: relative;
  z-index: 1;
}

/* BRAND PILL */
.brand-pill {
  width: fit-content;

  display: flex;
  align-items: center;
  gap: 10px;

  margin-bottom: 28px;
  padding: 10px 18px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.12);

  border: 1px solid rgba(255, 255, 255, 0.2);

  backdrop-filter: blur(10px);

  font-size: 0.9rem;
  font-weight: 800;
}

.brand-pill span {
  width: 10px;
  height: 10px;

  border-radius: 50%;

  background: #38bdf8;
}

/* HERO TEXT */
.register-hero h1 {
  max-width: 650px;

  margin-bottom: 24px;

  font-size: clamp(3rem, 7vw, 6rem);

  line-height: 0.92;
  letter-spacing: -0.08em;

  font-weight: 900;
}

.register-hero p {
  max-width: 540px;

  color: #dbeafe;

  font-size: clamp(0.95rem, 1.2vw, 1.15rem);

  line-height: 1.8;
}

/* MINI CARDS */
.hero-cards {
  display: flex;
  gap: 20px;

  margin-top: 42px;

  flex-wrap: wrap;
}

.mini-card {
  min-width: 180px;

  padding: 28px;

  border-radius: 28px;

  background: rgba(255, 255, 255, 0.08);

  border: 1px solid rgba(255, 255, 255, 0.12);

  backdrop-filter: blur(12px);
}

.mini-card strong {
  display: block;

  margin-bottom: 8px;

  font-size: 2rem;
  font-weight: 900;
}

.mini-card span {
  color: #dbeafe;
}

/* RIGHT SIDE */
.register-card {
  position: relative;

  flex: 1 1 50%;
  min-width: 320px;
  min-height: 100vh;

  padding: clamp(40px, 6vw, 100px);

  display: flex;
  flex-direction: column;
  justify-content: center;

  background:
      linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.98),
          rgba(248, 250, 252, 0.96)
      );
}

/* DECORATION */
.card-decoration {
  position: absolute;

  top: 70px;
  right: 70px;

  width: 100px;
  height: 100px;

  border-radius: 30px;

  background:
      linear-gradient(
          135deg,
          #2563eb,
          #38bdf8
      );

  opacity: 0.1;

  transform: rotate(12deg);
}

/* HEADER */
.card-header {
  margin-bottom: 34px;
}

.card-label {
  margin-bottom: 10px;

  color: #64748b;

  font-size: 0.82rem;
  font-weight: 900;

  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-header h2 {
  margin-bottom: 10px;

  color: #0f172a;

  font-size: clamp(2rem, 3vw, 3rem);

  font-weight: 900;

  letter-spacing: -0.05em;
}

.card-header p {
  color: #64748b;

  font-size: 1rem;
}

/* FORM */
.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;

  margin-bottom: 8px;

  color: #334155;

  font-size: 0.88rem;
  font-weight: 850;
}

.form-group input {
  width: 100%;
  max-width: 520px;

  height: 58px;

  padding: 0 18px;

  border-radius: 18px;

  border: 1px solid #dbe3ef;

  background: #f8fafc;

  color: #0f172a;

  font-size: 1rem;

  transition: 0.22s ease;
}

.form-group input::placeholder {
  color: #94a3b8;
}

.form-group input:focus {
  outline: none;

  border-color: #2563eb;

  background: white;

  box-shadow:
      0 0 0 4px rgba(37, 99, 235, 0.12);
}

/* BUTTON */
.submit-btn {
  width: 100%;
  max-width: 520px;

  margin-top: 10px;
  padding: 17px 20px;

  border: none;
  border-radius: 18px;

  background:
      linear-gradient(
          135deg,
          #2563eb,
          #1e40af
      );

  color: white;

  font-size: 1rem;
  font-weight: 900;

  cursor: pointer;

  transition: 0.25s ease;

  box-shadow:
      0 16px 32px rgba(37, 99, 235, 0.25);
}

.submit-btn:hover {
  transform: translateY(-2px);

  box-shadow:
      0 24px 40px rgba(37, 99, 235, 0.32);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* LINKS */
.login-link {
  margin-top: 26px;

  color: #64748b;
}

.login-link a {
  color: #2563eb;

  font-weight: 900;

  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

/* TABLET */
@media (max-width: 1000px) {
  .register-shell {
    flex-direction: column;
  }

  .register-hero,
  .register-card {
    width: 100%;
    min-height: auto;
  }

  .register-hero {
    padding-top: 120px;
    padding-bottom: 120px;

    align-items: center;
    text-align: center;
  }

  .register-hero p {
    margin: 0 auto;
  }

  .hero-cards {
    justify-content: center;
  }
}

/* MOBILE */
@media (max-width: 600px) {
  .register-hero,
  .register-card {
    padding: 36px 22px;
  }

  .register-hero {
    min-height: 65vh;
  }

  .register-hero h1 {
    font-size: 3rem;
  }

  .form-group input,
  .submit-btn {
    max-width: 100%;
  }

  .card-decoration {
    width: 70px;
    height: 70px;
  }
}
</style>
