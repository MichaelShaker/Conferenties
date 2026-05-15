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
              <h2>Kerkgegevens</h2>
              <p>Dit gebruiken we later voor lokale events en nieuwsbrieven.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
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
              <label>Woonplaats</label>
              <input v-model="form.city" type="text" placeholder="Bijv. Amsterdam" />
            </div>

            <div class="form-group">
              <label>Rang / functie</label>
              <input v-model="form.rankTitle" type="text" placeholder="Bijv. lid, diaken, servant" />
            </div>

            <div class="form-group">
              <label>Biechtvader</label>
              <input v-model="form.confessionFather" type="text" placeholder="Bijv. Abouna..." />
            </div>
          </div>
        </div>

        <div v-if="activeStep === 2" class="form-section wizard-section">
          <div class="section-title">
            <span>03</span>
            <div>
              <h2>Extra informatie</h2>
              <p>Handig bij diners, kampen en conferenties.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Shirtmaat</label>
              <select v-model="form.shirtSize">
                <option value="">Kies je maat</option>
                <option v-for="size in shirtSizes" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>

            <div class="form-group transport-field">
              <label>Vervoer naar conferenties</label>
              <select v-model="form.transportOption">
                <option value="">Kies vervoer</option>
                <option value="own_transport">Eigen vervoer</option>
                <option value="bus">Bus (+ kosten)</option>
              </select>
              <small>Je kunt dit per inschrijving nog aanpassen als dat nodig is.</small>
            </div>

            <div class="form-group full">
              <label>Allergieën</label>
              <textarea v-model="form.allergies" rows="3" placeholder="Bijv. noten, lactose, geen"></textarea>
            </div>

            <div class="form-group full">
              <label>Dieetwensen</label>
              <textarea v-model="form.dietaryNotes" rows="3" placeholder="Bijv. vegetarisch, geen"></textarea>
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
    summary: 'Koppel je profiel aan je kerk en woonplaats.',
    requiredFields: ['churchId']
  },
  {
    title: 'Voorkeuren',
    summary: 'Deze gegevens helpen bij praktische voorbereidingen voor events.',
    requiredFields: []
  }
]

const currentStep = computed(() => profileSteps[activeStep.value])

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
  churchId: '',
  city: '',
  rankTitle: '',
  confessionFather: '',
  allergies: '',
  dietaryNotes: '',
  shirtSize: '',
  transportOption: '',
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
      form.city = profile.city || ''
      form.rankTitle = profile.rank_title || ''
      form.confessionFather = profile.confession_father || ''
      form.allergies = profile.allergies || ''
      form.dietaryNotes = profile.dietary_notes || ''
      form.shirtSize = profile.shirt_size || ''
      form.transportOption = profile.transport_option || ''
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
  padding: 32px 0 72px;
}

.profile-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 48px;
  border-radius: 38px;
  background:
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 34%),
      linear-gradient(135deg, #ffffff, #f8fafc);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
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
  color: var(--text);
  font-size: clamp(2.7rem, 6vw, 5.6rem);
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.profile-hero p {
  max-width: 650px;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.8;
}

.hero-card {
  flex-shrink: 0;
  min-width: 180px;
  padding: 24px;
  border-radius: 28px;
  background: #0f172a;
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
  padding: 34px;
  border-radius: 34px;
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
  border-radius: 18px;
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
  border-radius: 26px;
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
    padding: 30px 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .step-tabs {
    grid-template-columns: 1fr;
  }

  .profile-card {
    padding: 20px;
    border-radius: 8px;
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
    padding: 16px 0 48px;
  }

  .profile-hero {
    border-radius: 8px;
  }

  .profile-hero h1 {
    font-size: 2.25rem;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .hero-card {
    width: 100%;
    border-radius: 8px;
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
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
  }

  .newsletter-toggle {
    align-items: flex-start;
  }

  .submit-panel {
    margin-top: 18px;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>
