<template>
  <main class="login-view">
    <section class="login-shell">

      <!-- LEFT SIDE -->
      <div class="login-hero">
        <div class="brand-pill">
          <span></span>
          Conferenties platform
        </div>

        <h1>Welkom terug bij je conferentiehub.</h1>

        <p>
          Log in om je tickets, inschrijvingen en persoonlijke conferentie-overzicht te beheren.
        </p>

        <div class="hero-cards">
          <div class="mini-card">
            <strong>24+</strong>
            <span>Evenementen</span>
          </div>

          <div class="mini-card">
            <strong>1 plek</strong>
            <span>Voor al je inschrijvingen</span>
          </div>
        </div>
      </div>

      <!-- FORM -->
      <div class="login-card">
        <div class="card-decoration"></div>

        <div class="card-header">
          <p class="card-label">Accounttoegang</p>
          <h2>Inloggen</h2>
          <p>Gebruik je gegevens om verder te gaan.</p>
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
                autocomplete="current-password"
                placeholder="••••••••"
                required
            />
          </div>

          <button class="submit-btn" type="submit" :disabled="loading">
            {{ loading ? 'Bezig met inloggen...' : 'Inloggen' }}
          </button>
        </form>

        <router-link class="forgot-link" to="/forgot-password">
          Wachtwoord vergeten?
        </router-link>

        <p class="register-link">
          Nog geen account?
          <RouterLink to="/register">Maak een account aan</RouterLink>
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
/* PAGE */
.login-view {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;

  background:
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 30%),
      linear-gradient(135deg, #f8fafc, #eef4ff);
}

/* FULLSCREEN SPLIT */
.login-shell {
  width: 100%;
  min-height: 100vh;

  display: flex;
  flex-wrap: wrap;
}

/* LEFT SIDE */
.login-hero {
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
          rgba(15, 23, 42, 0.9),
          rgba(30, 64, 175, 0.86)
      ),
      url("https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80");

  background-size: cover;
  background-position: center;
}

.login-hero::after {
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

.login-hero > * {
  position: relative;
  z-index: 1;
}

/* PILL */
.brand-pill {
  width: fit-content;

  margin-bottom: 28px;
  padding: 10px 18px;

  display: flex;
  align-items: center;
  gap: 10px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.12);

  border: 1px solid rgba(255, 255, 255, 0.2);

  backdrop-filter: blur(10px);

  font-size: 0.82rem;
  font-weight: 800;
}

.brand-pill span {
  width: 9px;
  height: 9px;

  border-radius: 50%;

  background: #38bdf8;

  box-shadow: 0 0 14px #38bdf8;
}

/* HERO TEXT */
.login-hero h1 {
  max-width: 650px;

  margin-bottom: 24px;

  font-size: clamp(3rem, 7vw, 6.5rem);

  line-height: 0.92;
  letter-spacing: -0.08em;

  font-weight: 900;
}

.login-hero p {
  max-width: 540px;

  color: #dbeafe;

  font-size: clamp(0.95rem, 1.2vw, 1.15rem);

  line-height: 1.8;
}

/* INFO CARDS */
.hero-cards {
  margin-top: 42px;

  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.mini-card {
  min-width: 160px;

  padding: 22px;

  border-radius: 24px;

  background: rgba(255, 255, 255, 0.12);

  border: 1px solid rgba(255, 255, 255, 0.18);

  backdrop-filter: blur(14px);

  transition: 0.25s ease;
}

.mini-card:hover {
  transform: translateY(-4px);

  background: rgba(255, 255, 255, 0.18);
}

.mini-card strong {
  display: block;

  margin-bottom: 4px;

  font-size: 1.5rem;
  font-weight: 900;
}

.mini-card span {
  color: #cbd5e1;

  font-size: 0.86rem;
  font-weight: 700;
}

/* RIGHT SIDE */
.login-card {
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
  margin-bottom: 8px;

  color: #2563eb;

  font-size: 0.75rem;
  font-weight: 900;

  text-transform: uppercase;
  letter-spacing: 0.16em;
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
.forgot-link {
  display: block;

  max-width: 520px;

  margin-top: 18px;

  text-align: center;

  color: #2563eb;

  font-size: 0.9rem;
  font-weight: 800;

  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.register-link {
  max-width: 520px;

  margin-top: 30px;

  text-align: center;

  color: #64748b;

  font-size: 0.95rem;
}

.register-link a {
  color: #2563eb;

  font-weight: 900;

  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

/* TABLET */
@media (max-width: 1000px) {
  .login-shell {
    flex-direction: column;
  }

  .login-hero,
  .login-card {
    width: 100%;
    min-height: auto;
  }

  .login-hero {
    padding-top: 120px;
    padding-bottom: 120px;

    align-items: center;
    text-align: center;
  }

  .login-hero p {
    margin: 0 auto;
  }

  .hero-cards {
    justify-content: center;
  }

  .card-decoration {
    top: 40px;
    right: 40px;
  }
}

/* MOBILE */
@media (max-width: 600px) {
  .login-hero,
  .login-card {
    padding: 36px 22px;
  }

  .login-hero {
    min-height: 65vh;
  }

  .login-hero h1 {
    font-size: 3rem;
  }

  .hero-cards {
    width: 100%;
  }

  .mini-card {
    flex: 1;
    min-width: 130px;
  }

  .form-group input,
  .submit-btn,
  .forgot-link,
  .register-link {
    max-width: 100%;
  }

  .card-decoration {
    width: 70px;
    height: 70px;
  }
}
</style>