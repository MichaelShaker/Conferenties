<template>
  <main class="profile-view">
    <section class="profile-hero">
      <div>
        <p class="eyebrow">Profiel afronden</p>
        <h1>Vertel ons iets meer over jezelf.</h1>
        <p>
          Deze gegevens helpen ons om jouw inschrijvingen sneller en beter te verwerken.
        </p>
      </div>

      <div class="hero-card">
        <strong>{{ activeStep + 1 }}/{{ profileSteps.length }}</strong>
        <span>{{ currentStep.title }}</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section class="profile-card">
      <form @submit.prevent="handleSubmit">
        <nav class="step-tabs" aria-label="Profiel stappen">
          <button
              v-for="(step, index) in profileSteps"
              :key="step.title"
              type="button"
              :class="{ active: activeStep === index, done: index < activeStep }"
              @click="goToStep(index)"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ step.title }}</strong>
          </button>
        </nav>

        <div v-if="activeStep === 0" class="form-section wizard-section">
          <div class="section-title">
            <span>01</span>
            <div>
              <h2>Basisgegevens</h2>
              <p>Wie ben je en hoe kunnen we je bereiken?</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Voornaam</label>
              <input v-model="form.firstName" type="text" required />
            </div>

            <div class="form-group">
              <label>Achternaam</label>
              <input v-model="form.lastName" type="text" required />
            </div>

            <div class="form-group">
              <label>Telefoonnummer</label>
              <input v-model="form.phone" type="text" required />
            </div>

            <div class="form-group">
              <label>Geboortedatum</label>
              <input v-model="form.birthDate" type="date" required />
            </div>
          </div>
        </div>

        <div v-if="activeStep === 1" class="form-section wizard-section">
          <div class="section-title">
            <span>02</span>
            <div>
              <h2>Kerk en voorkeuren</h2>
              <p>Dit gebruiken we voor je aanmeldingen en eventcommunicatie.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group wide">
              <label>Kerk</label>
              <select v-model="form.churchId" required>
                <option value="">Kies je kerk</option>
                <option
                    v-for="church in churches"
                    :key="church.id"
                    :value="church.id"
                >
                  {{ church.name }} - {{ church.city }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Shirtmaat</label>
              <select v-model="form.shirtSize">
                <option value="">Kies je maat</option>
                <option v-for="size in shirtSizes" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>

            <label class="newsletter-toggle full">
              <input v-model="form.newsletterEnabled" type="checkbox" />
              <span>Ik wil emails ontvangen over events die bij mijn profiel passen.</span>
            </label>
          </div>
        </div>

        <div class="submit-panel">
          <div>
            <strong>{{ currentStep.title }}</strong>
            <p>{{ currentStep.summary }}</p>
          </div>

          <div class="step-actions">
            <button
                v-if="activeStep > 0"
                class="btn btn-secondary submit-btn"
                type="button"
                @click="activeStep -= 1"
            >
              Terug
            </button>

            <button
                v-if="activeStep < profileSteps.length - 1"
                class="btn btn-primary submit-btn"
                type="button"
                @click="nextStep"
            >
              Volgende
            </button>

            <button
                v-else
                class="btn btn-primary submit-btn"
                type="submit"
                :disabled="loading"
            >
              {{ loading ? 'Opslaan...' : 'Profiel opslaan' }}
            </button>
          </div>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchChurches, fetchMyProfile, updateMyProfile } from '../services/api'
import { authState } from '../stores/auth'

const router = useRouter()

const churches = ref([])
const loading = ref(false)
const message = ref('')
const success = ref(false)
const activeStep = ref(0)
const shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const profileSteps = [
  {
    title: 'Basis',
    summary: 'Vul je naam, telefoonnummer en geboortedatum in.',
    requiredFields: ['firstName', 'lastName', 'phone', 'birthDate']
  },
  {
    title: 'Kerk',
    summary: 'Kies je kerk en eventueel je shirtmaat.',
    requiredFields: ['churchId']
  }
]

const currentStep = computed(() => profileSteps[activeStep.value])

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
  churchId: '',
  shirtSize: '',
  newsletterEnabled: true
})

onMounted(async () => {
  try {
    churches.value = await fetchChurches()

    const profile = await fetchMyProfile()

    if (profile) {
      form.firstName = profile.first_name || ''
      form.lastName = profile.last_name || ''
      form.phone = profile.phone || ''
      form.birthDate = profile.birth_date ? profile.birth_date.slice(0, 10) : ''
      form.churchId = profile.church_id || ''
      form.shirtSize = profile.shirt_size || ''
      form.newsletterEnabled = profile.newsletterEnabled !== 0
    }
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})

function validateStep(stepIndex = activeStep.value) {
  const step = profileSteps[stepIndex]
  const missing = step.requiredFields.filter(field => !form[field])

  if (!missing.length) {
    message.value = ''
    return true
  }

  success.value = false
  message.value = 'Vul eerst de verplichte velden in deze stap in.'
  return false
}

function nextStep() {
  if (!validateStep()) return
  activeStep.value = Math.min(profileSteps.length - 1, activeStep.value + 1)
}

function goToStep(index) {
  if (index <= activeStep.value) {
    activeStep.value = index
    return
  }

  for (let stepIndex = activeStep.value; stepIndex < index; stepIndex += 1) {
    if (!validateStep(stepIndex)) return
  }

  activeStep.value = index
}

async function handleSubmit() {
  if (!validateStep()) return

  loading.value = true
  message.value = ''

  try {
    await updateMyProfile({
      ...form,
      churchId: Number(form.churchId)
    })

    if (authState.user) {
      authState.user.name = `${form.firstName} ${form.lastName}`.trim()
      authState.user.profileCompleted = true
      localStorage.setItem('user', JSON.stringify(authState.user))
    }

    success.value = true
    message.value = 'Profiel succesvol opgeslagen.'

    router.push('/account')
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-height: 100vh;
  padding: 0 0 72px;
  background: #f7f4ee;
}

.profile-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  min-height: 360px;
  padding: 104px max(4vw, 28px) 58px;
  background:
      linear-gradient(90deg, rgba(9, 17, 34, 0.9), rgba(9, 17, 34, 0.58)),
      url('../assets/home.png') center / cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.eyebrow {
  margin-bottom: 14px;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.profile-hero h1 {
  max-width: 820px;
  margin-bottom: 14px;
  color: #ffffff;
  font-size: clamp(2.7rem, 6vw, 5.6rem);
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.profile-hero p {
  max-width: 650px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.05rem;
  line-height: 1.8;
}

.hero-card {
  flex-shrink: 0;
  min-width: 180px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.68);
  color: white;
  box-shadow: var(--shadow-md);
}

.hero-card strong {
  display: block;
  margin-bottom: 6px;
  font-size: 2rem;
  letter-spacing: -0.06em;
}

.hero-card span {
  color: #cbd5e1;
  font-weight: 700;
}

.profile-card {
  width: min(1280px, calc(100% - 56px));
  margin: 0 auto;
  padding: 34px;
  border-radius: 14px;
  background: white;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.step-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}

.step-tabs button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #f8fafc;
  color: var(--text-muted);
  text-align: left;
  font-weight: 900;
}

.step-tabs button span {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #e2e8f0;
  color: #475569;
}

.step-tabs button.active {
  border-color: rgba(37, 99, 235, 0.36);
  background: #eff6ff;
  color: var(--text);
}

.step-tabs button.active span,
.step-tabs button.done span {
  background: var(--primary);
  color: #ffffff;
}

.wizard-section {
  min-height: 360px;
}

.form-section {
  padding: 28px 0;
  border-bottom: 1px solid var(--border);
}

.form-section:first-child {
  padding-top: 0;
}

.section-title {
  display: flex;
  gap: 16px;
  margin-bottom: 22px;
}

.section-title span {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 900;
}

.section-title h2 {
  margin-bottom: 4px;
  color: var(--text);
  font-size: 1.45rem;
}

.section-title p {
  color: var(--text-muted);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--border);
  min-height: 52px;
  border-radius: 10px;
  background: #f8fafc;
  padding: 14px 16px;
  color: var(--text);
  font: inherit;
  outline: none;
  transition: 0.2s ease;
}

select {
  overflow: hidden;
  text-overflow: ellipsis;
}

input:focus,
select:focus,
textarea:focus {
  background: white;
  border-color: rgba(37, 99, 235, 0.5);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

textarea {
  resize: vertical;
}

.newsletter-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 800;
}

.newsletter-toggle input {
  width: auto;
  min-height: auto;
}

.transport-field small {
  display: block;
  margin-top: 7px;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.submit-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 28px;
  padding: 24px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--border);
}

.submit-panel strong {
  display: block;
  margin-bottom: 4px;
  color: var(--text);
  font-size: 1.1rem;
}

.submit-panel p {
  color: var(--text-muted);
}

.submit-btn {
  min-width: 180px;
  min-height: 50px;
}

.step-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 850px) {
  .profile-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 22px;
    padding: 92px 20px 42px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .step-tabs {
    grid-template-columns: 1fr;
  }

  .profile-card {
    width: calc(100% - 28px);
    padding: 20px;
    border-radius: 12px;
  }

  .submit-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .submit-btn {
    width: 100%;
  }

  .step-actions {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .profile-view {
    gap: 18px;
    padding: 0 0 48px;
  }

  .profile-hero h1 {
    font-size: 2.35rem;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .hero-card {
    width: 100%;
    border-radius: 12px;
    padding: 18px;
  }

  .section-title {
    flex-direction: column;
    gap: 10px;
  }

  .section-title h2 {
    font-size: 1.25rem;
  }

  .wizard-section {
    min-height: auto;
  }

  input,
  select,
  textarea {
    min-height: 48px;
    border-radius: 10px;
    padding: 12px;
    font-size: 16px;
  }

  .newsletter-toggle {
    align-items: flex-start;
  }

  .submit-panel {
    margin-top: 18px;
    padding: 16px;
    border-radius: 12px;
  }
}
</style>
