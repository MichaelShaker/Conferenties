<template>
  <main v-if="event" class="event-detail">
    <!-- HERO -->
    <section class="event-hero">
      <img :src="event.image" :alt="event.title" class="event-hero__image" />

      <div class="event-hero__overlay"></div>

      <div class="event-hero__content">
        <RouterLink to="/events" class="back-link">
          ← Terug naar events
        </RouterLink>

        <span class="event-category">
          {{ event.category }}
        </span>

        <h1>{{ event.title }}</h1>

        <div class="event-hero__meta">
          <span>{{ formattedDate }}</span>
          <span>{{ event.location }}</span>
          <span>{{ priceLabel }}</span>
          <span v-if="isAdmin">{{ event.registeredCount || 0 }} / {{ event.capacity }} plekken</span>
        </div>
      </div>
    </section>

    <!-- INFO STRIP -->
    <section class="event-info-strip">
      <div>
        <span>Datum</span>
        <strong>{{ formattedDate }}</strong>
      </div>

      <div>
        <span>Locatie</span>
        <strong>{{ event.location }}</strong>
      </div>

      <div>
        <span>Prijs</span>
        <strong>{{ priceLabel }}</strong>
      </div>

      <div v-if="isAdmin">
        <span>Capaciteit</span>
        <strong>{{ event.registeredCount || 0 }} / {{ event.capacity }} bezet</strong>
      </div>

      <div>
        <span>Deadline</span>
        <strong>{{ event.registrationDeadline ? event.registrationDeadline.slice(0, 10) : 'Geen deadline' }}</strong>
      </div>
    </section>

    <!-- CONTENT -->
    <section class="event-content">
      <div class="event-main">
        <p class="eyebrow">Beschrijving</p>

        <h2>Over dit event</h2>

        <p class="event-description formatted-text">
          {{ event.description }}
        </p>

        <div class="event-details-grid">
          <div>
            <span>Type event</span>
            <strong>{{ event.eventType === 'local' ? 'Lokaal' : 'Nationaal' }}</strong>
          </div>

          <div>
            <span>Stad</span>
            <strong>{{ event.city || event.location }}</strong>
          </div>

          <div>
            <span>Leeftijd</span>
            <strong>{{ ageText }}</strong>
          </div>

          <div>
            <span>Doelgroep</span>
            <strong>{{ targetText }}</strong>
          </div>
        </div>

        <StatusMessage :message="message" :success="success" />
      </div>

      <aside class="event-sidebar">
        <div class="register-panel">
          <h3>Aanmelden</h3>

          <p v-if="registrationClosed && !isRegistered">
            Aanmelden is gesloten voor dit event.
          </p>

          <p v-else-if="!isRegistered">
            Schrijf je in om jouw aanmelding te starten.
          </p>

          <p v-else-if="registrationStatus === 'confirmed'">
            Je bent officieel ingeschreven voor dit event.
          </p>

          <p v-else>
            Je aanmelding is ontvangen. Rond je betaling af en upload je betaalbewijs.
          </p>

          <div v-if="!isRegistered" class="registration-options">
            <p class="privacy-note">
              Deze gegevens komen in de deelnemerslijst voor dit event en worden gebruikt voor planning op locatie.
            </p>

            <div v-if="canChoosePartialDays" class="attendance-choice">
              <div class="full-event-choice" :class="{ active: !showPartialDaySelector }">
                <div>
                  <span class="choice-label">Aanbevolen</span>
                  <strong>Ik kom de hele periode</strong>
                  <small>{{ fullEventText }}</small>
                </div>

                <div class="choice-price">
                  €{{ Number(selectedPrice).toFixed(2) }}
                </div>
              </div>

              <button
                  v-if="showPartialDaySelector"
                  type="button"
                  class="choice-link"
                  @click="selectFullEvent"
              >
                Toch hele periode kiezen
              </button>

              <button
                  v-else
                  type="button"
                  class="choice-link"
                  @click="startPartialDaySelection"
              >
                Ik kom alleen bepaalde dag(en)
              </button>
            </div>

            <div v-if="canChoosePartialDays && showPartialDaySelector" class="day-choice-panel">
              <div>
                <strong>Kies je dag(en)</strong>
                <span>Vink alleen de dagen aan waarop je aanwezig bent.</span>
              </div>

              <div class="day-choice-grid">
                <button
                    v-for="day in eventDays"
                    :key="day.value"
                    type="button"
                    :class="{ active: selectedDays.includes(day.value) }"
                    @click="toggleSelectedDay(day.value)"
                >
                  <strong>Dag {{ day.value }}</strong>
                  <span>{{ day.label }}</span>
                </button>
              </div>

              <p class="selected-price">
                {{ selectedDays.length }} dag{{ selectedDays.length === 1 ? '' : 'en' }} gekozen ·
                <strong>€{{ Number(selectedPrice).toFixed(2) }}</strong>
              </p>
            </div>

            <label for="shirtSize">Shirtmaat</label>
            <select id="shirtSize" v-model="shirtSize">
              <option value="">Kies je maat</option>
              <option v-for="size in shirtSizes" :key="size" :value="size">
                {{ size }}
              </option>
            </select>

            <label for="transportOption">Vervoer</label>
            <select id="transportOption" v-model="transportOption">
              <option value="">Kies je vervoer</option>
              <option value="own_transport">Eigen vervoer</option>
              <option value="bus">Bus tegen aanvullende kosten</option>
            </select>

          </div>

          <div v-else class="registration-summary">
            <div>
              <span>Dagen</span>
              <strong>{{ selectedDaysText }}</strong>
            </div>
            <div>
              <span>Prijs</span>
              <strong>€{{ Number(selectedPrice).toFixed(2) }}</strong>
            </div>
            <div>
              <span>Shirtmaat</span>
              <strong>{{ shirtSize || '-' }}</strong>
            </div>
            <div>
              <span>Vervoer</span>
              <strong>{{ transportOptionText(transportOption) }}</strong>
            </div>
          </div>

          <button
              v-if="!isRegistered"
              class="action-button primary"
              @click="handleRegister"
              :disabled="loading || registrationClosed"
          >
            {{ loading ? 'Bezig...' : 'Inschrijven' }}
          </button>

          <div v-if="isRegistered" class="signup-confirmation">
            <strong>Aanmelding ontvangen</strong>
            <span>{{ paymentStatus === 'proof_uploaded' ? 'Betaalbewijs staat klaar voor controle.' : 'Volg de betalingsstappen hieronder.' }}</span>
          </div>

          <RouterLink to="/events" class="action-button secondary">
            Bekijk andere events
          </RouterLink>
        </div>

        <div
            v-if="isRegistered && registrationStatus !== 'confirmed'"
            class="payment-panel"
        >
          <h3>Betaling afronden</h3>

          <p>
            Betaal €{{ Number(selectedPrice).toFixed(2) }} voor {{ selectedDaysText }}. Upload daarna hier een screenshot van je betaling.
          </p>

          <a
              v-if="selectedPaymentLink"
              :href="selectedPaymentLink"
              target="_blank"
              class="pay-button"
          >
            Open betaallink
          </a>

          <div v-if="selectedPaymentQrUrl" class="qr-wrapper">
            <img :src="selectedPaymentQrUrl" alt="Betaal QR-code" />
          </div>

          <div class="payment-contact">
            <strong>Betalingsinformatie</strong>
            <p>{{ event.paymentContactName || '-' }}</p>
            <p>{{ event.paymentContactPhone || '-' }}</p>
          </div>

          <p v-if="event.paymentInstructions" class="formatted-text">
            {{ event.paymentInstructions }}
          </p>

          <div class="proof-upload">
            <label for="paymentProof">Upload betaalbewijs</label>

            <input
                id="paymentProof"
                type="file"
                accept="image/*"
                @change="handlePaymentProofChange"
                :disabled="uploadingProof"
            />

            <p v-if="uploadingProof">
              Betaalbewijs uploaden...
            </p>

            <p v-if="paymentStatus === 'proof_uploaded'" class="proof-status">
              Betaalbewijs is ontvangen. Een admin controleert je betaling.
            </p>

            <img
                v-if="proofPreview"
                :src="proofPreview"
                alt="Betaalbewijs voorbeeld"
                class="proof-preview"
            />
          </div>
        </div>
      </aside>
    </section>
  </main>

  <div v-else class="empty-state">
    Event wordt geladen...
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusMessage from '../components/StatusMessage.vue'
import {
  fetchConferenceById,
  createRegistration,
  uploadPaymentProof,
  fetchMyRegistrations,
  fetchMyProfile
} from '../services/api'
import { authState } from '../stores/auth'

const route = useRoute()
const router = useRouter()

const event = ref(null)
const loading = ref(false)
const uploadingProof = ref(false)
const message = ref('')
const success = ref(false)

const isRegistered = ref(false)
const registrationId = ref(null)
const paymentStatus = ref('')
const registrationStatus = ref('')
const proofPreview = ref('')
const shirtSize = ref('')
const transportOption = ref('')
const selectedDays = ref([1])
const showPartialDaySelector = ref(false)

const shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const isAdmin = computed(() => authState.user?.role === 'admin')

const canChoosePartialDays = computed(() => {
  return Number(event.value?.maxEventDays || 1) > 1
      && (event.value?.allowPartialDays === true || event.value?.allowPartialDays === 1)
})

const eventDays = computed(() => {
  const maxDays = Math.min(3, Math.max(1, Number(event.value?.maxEventDays || 1)))
  const startDate = event.value?.date || event.value?.conference_date || event.value?.eventDate

  return Array.from({ length: maxDays }, (_, index) => {
    const value = index + 1
    const date = startDate ? addDays(startDate, index) : null

    return {
      value,
      label: date ? formatDate(date) : `Dag ${value}`
    }
  })
})

const fullEventDays = computed(() => eventDays.value.map(day => day.value))

const selectedDaysText = computed(() => selectedDays.value
    .slice()
    .sort((a, b) => a - b)
    .map(day => {
      const eventDay = eventDays.value.find(option => option.value === day)
      return eventDay ? `Dag ${day} (${eventDay.label})` : `Dag ${day}`
    })
    .join(', '))

const fullEventText = computed(() => {
  if (!eventDays.value.length) return 'Volledig event'

  return eventDays.value.map(day => day.label).join(' t/m ')
})

const selectedPrice = computed(() => {
  const count = selectedDays.value.length || 1

  if (count === 3 && event.value?.priceThreeDays !== null && event.value?.priceThreeDays !== undefined) {
    return Number(event.value.priceThreeDays)
  }

  if (count === 2 && event.value?.priceTwoDays !== null && event.value?.priceTwoDays !== undefined) {
    return Number(event.value.priceTwoDays)
  }

  return Number(event.value?.priceOneDay ?? event.value?.price ?? 0) * count
})

const priceLabel = computed(() => `€${Number(selectedPrice.value).toFixed(2)}`)

const selectedPaymentLink = computed(() => {
  const count = selectedDays.value.length || 1
  if (count === 3) return event.value?.paymentLinkThreeDays || event.value?.paymentLink || ''
  if (count === 2) return event.value?.paymentLinkTwoDays || event.value?.paymentLink || ''
  return event.value?.paymentLinkOneDay || event.value?.paymentLink || ''
})

const selectedPaymentQrUrl = computed(() => {
  const count = selectedDays.value.length || 1
  if (count === 3) return event.value?.paymentQrUrlThreeDays || event.value?.paymentQrUrl || ''
  if (count === 2) return event.value?.paymentQrUrlTwoDays || event.value?.paymentQrUrl || ''
  return event.value?.paymentQrUrlOneDay || event.value?.paymentQrUrl || ''
})

const formattedDate = computed(() => {
  const startDate = event.value?.date || event.value?.conference_date || event.value?.eventDate
  const endDate = event.value?.dateEnd || event.value?.event_end_date || event.value?.eventDateEnd

  if (!startDate) return '-'

  return formatDateRange(startDate, endDate)
})

function formatDateRange(startValue, endValue) {
  if (!startValue) return '-'

  if (!endValue || String(startValue).slice(0, 10) === String(endValue).slice(0, 10)) {
    return formatDate(startValue)
  }

  return `${formatDate(startValue)} t/m ${formatDate(endValue)}`
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function transportOptionText(option) {
  if (option === 'own_transport') return 'Eigen vervoer'
  if (option === 'bus') return 'Bus tegen aanvullende kosten'

  return '-'
}

const ageText = computed(() => {
  const min = event.value?.minAge
  const max = event.value?.maxAge

  if (min && max) return `${min} t/m ${max} jaar`
  if (min) return `Vanaf ${min} jaar`
  if (max) return `Tot ${max} jaar`

  return 'Iedereen'
})

const targetText = computed(() => {
  if (event.value?.targetCity) return `Alleen voor ${event.value.targetCity}`
  if (event.value?.targetRank) return `Alleen voor ${event.value.targetRank}`

  return 'Iedereen'
})

const registrationClosed = computed(() => {
  if (!event.value?.registrationDeadline) return false

  const deadline = new Date(event.value.registrationDeadline)
  deadline.setHours(23, 59, 59, 999)

  return new Date() > deadline
})

onMounted(async () => {
  try {
    event.value = await fetchConferenceById(route.params.id)
    setDefaultSelectedDays()

    if (authState.token) {
      await loadProfileDefaults()
      await checkExistingRegistration()
    }
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})

async function loadProfileDefaults() {
  const profile = await fetchMyProfile()

  if (!profile) return

  shirtSize.value = profile.shirt_size || ''
}

async function checkExistingRegistration() {
  const registrations = await fetchMyRegistrations()
  const existingRegistration = registrations.find(
      registration => Number(registration.eventId) === Number(route.params.id)
  )

  if (!existingRegistration) return

  isRegistered.value = true
  registrationId.value = existingRegistration.id
  paymentStatus.value = existingRegistration.paymentStatus
  registrationStatus.value = existingRegistration.registrationStatus
  shirtSize.value = existingRegistration.shirtSize || ''
  transportOption.value = existingRegistration.transportOption || ''
  selectedDays.value = parseSelectedDays(existingRegistration.selectedDays)
}

async function handleRegister() {
  if (!authState.token) {
    router.push('/login')
    return
  }

  loading.value = true
  message.value = ''

  try {
    if (!shirtSize.value || !transportOption.value) {
      throw new Error('Kies je shirtmaat en vervoer voordat je inschrijft.')
    }

    if (selectedDays.value.length === 0) {
      throw new Error('Kies minimaal één dag waarop je aanwezig bent.')
    }

    const result = await createRegistration(event.value.id, {
      shirtSize: shirtSize.value,
      transportOption: transportOption.value,
      selectedDays: selectedDays.value
    })

    registrationId.value = result.data.id
    isRegistered.value = true
    paymentStatus.value = 'pending'
    registrationStatus.value = 'pending'

    success.value = true
    message.value = 'Je aanmelding is gelukt. Betaal via de Tikkie en upload daarna je betaalbewijs.'
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
}

function setDefaultSelectedDays() {
  selectedDays.value = fullEventDays.value
  showPartialDaySelector.value = false
}

function startPartialDaySelection() {
  showPartialDaySelector.value = true
  selectedDays.value = selectedDays.value.length === fullEventDays.value.length ? [1] : (selectedDays.value.length ? selectedDays.value : [1])
}

function selectFullEvent() {
  showPartialDaySelector.value = false
  selectedDays.value = fullEventDays.value
}

function toggleSelectedDay(day) {
  if (!canChoosePartialDays.value) return

  if (selectedDays.value.includes(day)) {
    selectedDays.value = selectedDays.value.filter(selectedDay => selectedDay !== day)
    return
  }

  selectedDays.value = [...selectedDays.value, day].sort((a, b) => a - b)
}

function parseSelectedDays(value) {
  if (!value) return canChoosePartialDays.value ? [1] : fullEventDays.value

  const days = String(value)
      .split(',')
      .map(day => Number(day))
      .filter(day => Number.isInteger(day) && day >= 1 && day <= 3)

  return days.length ? days : (canChoosePartialDays.value ? [1] : fullEventDays.value)
}

function addDays(value, amount) {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

function compressPaymentProof(file, maxWidth = 900, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxWidth / img.width, 1)

        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }

      img.onerror = reject
      img.src = reader.result
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handlePaymentProofChange(eventInput) {
  const file = eventInput.target.files[0]

  if (!file) return

  if (!registrationId.value) {
    success.value = false
    message.value = 'Geen registratie gevonden. Schrijf je eerst in.'
    return
  }

  uploadingProof.value = true
  message.value = ''

  try {
    const proof = await compressPaymentProof(file)

    await uploadPaymentProof(registrationId.value, proof)

    proofPreview.value = proof
    paymentStatus.value = 'proof_uploaded'

    success.value = true
    message.value = 'Betaalbewijs geüpload. Een admin controleert je betaling.'
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    uploadingProof.value = false
  }
}
</script>

<style scoped>
.event-detail {
  min-height: 100vh;
  background: #f7f4ee;
}

/* HERO */
.event-hero {
  position: relative;
  min-height: 560px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: #0f172a;
}

.event-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-hero__overlay {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(to top, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.2)),
      linear-gradient(to right, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.15));
}

.event-hero__content {
  position: relative;
  z-index: 2;
  width: min(1280px, calc(100% - 56px));
  margin: 0 auto;
  padding: 80px 0 64px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 2px;
  margin-bottom: 28px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 900;
  text-decoration: none;
}

.back-link:hover {
  color: #ffffff;
}

.event-category {
  display: inline-flex;
  margin-bottom: 18px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.event-hero h1 {
  max-width: 900px;
  margin-bottom: 22px;
  color: #ffffff;
  font-size: clamp(3.2rem, 7vw, 6.4rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.event-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.event-hero__meta span {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

/* INFO STRIP */
.event-info-strip {
  width: min(1280px, calc(100% - 56px));
  margin: -40px auto 0;
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.event-info-strip div {
  padding: 22px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.event-info-strip span,
.event-details-grid span {
  display: block;
  margin-bottom: 7px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.event-info-strip strong,
.event-details-grid strong {
  color: #0f172a;
  font-size: 1.05rem;
}

/* CONTENT */
.event-content {
  width: min(1280px, calc(100% - 56px));
  margin: 44px auto 0;
  padding-bottom: 80px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 34px;
  align-items: start;
}

.event-main {
  padding: 8px 0;
}

.eyebrow {
  margin-bottom: 12px;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.event-main h2 {
  margin-bottom: 18px;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.event-description {
  max-width: 780px;
  color: #475569;
  font-size: 1.12rem;
  line-height: 1.9;
}

.formatted-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.event-details-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 34px;
}

.event-details-grid div {
  padding: 18px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

/* SIDEBAR */
.event-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: sticky;
  top: 110px;
}

.register-panel,
.payment-panel {
  padding: 28px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.register-panel h3,
.payment-panel h3 {
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 1.45rem;
  letter-spacing: -0.04em;
}

.register-panel p,
.payment-panel p {
  color: #64748b;
  line-height: 1.8;
}

.registration-options,
.registration-summary {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.registration-options label,
.registration-summary span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.registration-options select {
  width: 100%;
  min-height: 52px;
  padding: 0 15px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  font-weight: 800;
  transition: 0.18s ease;
}

.registration-options select:focus {
  outline: 3px solid rgba(37, 99, 235, 0.18);
  border-color: #2563eb;
  background: #ffffff;
}

.attendance-choice {
  display: grid;
  gap: 10px;
}

.full-event-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff, #ffffff 76%);
}

.full-event-choice strong,
.full-event-choice small,
.choice-label {
  display: block;
}

.full-event-choice strong {
  color: #0f172a;
}

.full-event-choice small {
  margin-top: 4px;
  color: #64748b;
  line-height: 1.45;
}

.choice-label {
  margin-bottom: 6px;
  color: #2563eb;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.choice-price {
  flex: 0 0 auto;
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 900;
}

.choice-link {
  width: 100%;
  min-height: 48px;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #2563eb;
  font-weight: 900;
  text-align: center;
}

.choice-link:hover {
  background: #f8fafc;
}

.day-choice-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  background: #f8fafc;
}

.day-choice-panel strong {
  color: #0f172a;
}

.day-choice-panel span {
  display: block;
  color: #64748b;
  font-size: 0.9rem;
}

.day-choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
}

.day-choice-grid button {
  display: grid;
  gap: 4px;
  min-height: 82px;
  padding: 12px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
  transition: 0.2s ease;
}

.day-choice-grid button.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #2563eb;
}

.selected-price {
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  color: #334155 !important;
}

.registration-summary div {
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.registration-summary span {
  display: block;
  margin-bottom: 6px;
}

.registration-summary strong {
  color: #0f172a;
}

.action-button {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 16px;
  min-height: 52px;
  padding: 14px 18px;
  border-radius: 10px;
  font-weight: 900;
  text-decoration: none;
  transition: 0.2s ease;
}

.action-button.primary {
  background: #2563eb;
  color: #ffffff;
}

.action-button.primary:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
}

.action-button.secondary {
  background: #f1f5f9;
  color: #0f172a;
}

.action-button.secondary:hover {
  background: #e2e8f0;
}

/* PAYMENT */
.pay-button {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 16px;
  min-height: 52px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #16a34a;
  color: white;
  font-weight: 900;
  text-decoration: none;
}

.qr-wrapper {
  margin-top: 18px;
  text-align: center;
}

.qr-wrapper img {
  width: 190px;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
}

.payment-contact {
  margin-top: 18px;
  padding: 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.payment-contact strong {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
}

.proof-upload {
  margin-top: 18px;
}

.proof-upload label {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
  font-weight: 900;
}

.proof-status {
  margin-top: 10px;
  color: #16a34a !important;
  font-weight: 900;
}

.proof-preview {
  width: 100%;
  margin-top: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

/* RESPONSIVE */
@media (max-width: 1000px) {
  .event-info-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .event-details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .event-content {
    grid-template-columns: 1fr;
  }

  .event-sidebar {
    position: static;
  }
}

@media (max-width: 620px) {
  .event-hero {
    min-height: 480px;
  }

  .event-hero h1 {
    font-size: 2.55rem;
    letter-spacing: -0.05em;
  }

  .event-info-strip,
  .event-details-grid {
    grid-template-columns: 1fr;
  }

  .event-hero__content,
  .event-info-strip,
  .event-content {
    width: calc(100% - 28px);
  }

  .event-content {
    margin-top: 34px;
    gap: 24px;
  }

  .event-main h2 {
    font-size: 2rem;
  }

  .register-panel,
  .payment-panel {
    padding: 20px;
  }

  .full-event-choice {
    align-items: flex-start;
    flex-direction: column;
  }

  .choice-price {
    width: 100%;
    padding-top: 10px;
    border-top: 1px solid #bfdbfe;
  }
}
</style>
