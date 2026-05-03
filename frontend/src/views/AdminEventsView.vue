<template>
  <main class="admin-events">
    <!-- HERO -->
    <section class="admin-events-hero">
      <div>
        <p class="eyebrow">Admin - Events</p>
        <h1>Events aanmaken en beheren.</h1>
        <p>
          Voeg nieuwe events toe, bepaal de doelgroep, stel betaling in en controleer bestaande events.
        </p>
      </div>

      <div class="hero-count">
        <strong>{{ events.length }}</strong>
        <span>bestaande events</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <!-- CREATE EVENT -->
    <section class="create-layout">
      <!-- FORM -->
      <form @submit.prevent="handleCreateEvent" class="event-form">
        <div class="form-header">
          <p class="eyebrow">Nieuw event</p>
          <h2>Event toevoegen</h2>
          <p>Vul de gegevens stap voor stap in. Rechts zie je direct een korte preview.</p>
        </div>

        <!-- BASIS -->
        <section class="form-section">
          <div class="section-title">
            <span>01</span>
            <div>
              <h3>Basisinformatie</h3>
              <p>Deze informatie ziet de gebruiker als eerste.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="title">Titel</label>
              <input id="title" v-model="form.title" type="text" placeholder="Bijv. Paas Diner 2026" required />
            </div>

            <div class="form-group">
              <label for="category">Categorie</label>
              <input id="category" v-model="form.category" type="text" placeholder="Bijv. Kerk evenement" required />
            </div>

            <div class="form-group">
              <label for="date">Datum</label>
              <input id="date" v-model="form.date" type="date" required />
            </div>

            <div class="form-group">
              <label for="location">Locatie</label>
              <input id="location" v-model="form.location" type="text" placeholder="Bijv. Amstelveen" required />
            </div>

            <div class="form-group">
              <label for="price">Prijs</label>
              <input id="price" v-model="form.price" type="number" step="0.01" required />
            </div>

            <div class="form-group">
              <label for="capacity">Capaciteit</label>
              <input id="capacity" v-model="form.capacity" type="number" required />
            </div>
          </div>
        </section>

        <!-- DOELGROEP -->
        <section class="form-section">
          <div class="section-title">
            <span>02</span>
            <div>
              <h3>Doelgroep</h3>
              <p>Bepaal wie zich mag aanmelden voor dit event.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="eventType">Event type</label>
              <select id="eventType" v-model="form.eventType">
                <option value="national">Nationaal</option>
                <option value="local">Lokaal</option>
              </select>
            </div>

            <div class="form-group">
              <label for="city">Stad van event</label>
              <input id="city" v-model="form.city" type="text" placeholder="Bijv. Den Haag" />
            </div>

            <div class="form-group">
              <label for="churchId">Organiserende kerk</label>
              <select id="churchId" v-model="form.churchId">
                <option value="">Geen specifieke kerk</option>
                <option v-for="church in churches" :key="church.id" :value="church.id">
                  {{ church.name }} - {{ church.city }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="targetChurchId">Alleen voor kerk</label>
              <select id="targetChurchId" v-model="form.targetChurchId">
                <option value="">Iedereen</option>
                <option v-for="church in churches" :key="church.id" :value="church.id">
                  {{ church.name }} - {{ church.city }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="minAge">Minimale leeftijd</label>
              <input id="minAge" v-model="form.minAge" type="number" placeholder="Bijv. 19" />
            </div>

            <div class="form-group">
              <label for="maxAge">Maximale leeftijd</label>
              <input id="maxAge" v-model="form.maxAge" type="number" placeholder="Bijv. 23" />
            </div>

            <div class="form-group">
              <label for="targetCity">Alleen voor stad</label>
              <input id="targetCity" v-model="form.targetCity" type="text" placeholder="Leeg = iedereen" />
            </div>

            <div class="form-group">
              <label for="targetRank">Alleen voor rang/functie</label>
              <input id="targetRank" v-model="form.targetRank" type="text" placeholder="Bijv. diaken" />
            </div>
          </div>
        </section>

        <!-- MEDIA -->
        <section class="form-section">
          <div class="section-title">
            <span>03</span>
            <div>
              <h3>Media en beschrijving</h3>
              <p>Voeg een duidelijke afbeelding en beschrijving toe.</p>
            </div>
          </div>

          <div class="form-group">
            <label for="image">Afbeelding uploaden</label>
            <input id="image" type="file" accept="image/*" @change="handleImageChange" />

            <div v-if="imagePreview" class="image-focus-wrapper" @click="setImageFocus">
              <img
                  :src="imagePreview"
                  alt="Voorbeeld afbeelding"
                  class="image-preview"
                  :style="{ objectPosition: `${form.imageFocusX}% ${form.imageFocusY}%` }"
              />

              <span
                  class="focus-dot"
                  :style="{ left: `${form.imageFocusX}%`, top: `${form.imageFocusY}%` }"
              ></span>
            </div>

            <p v-if="imagePreview" class="focus-help">
              Klik op de afbeelding om te bepalen welk deel zichtbaar moet blijven.
            </p>
          </div>

          <div class="form-group">
            <label for="description">Beschrijving</label>
            <textarea id="description" v-model="form.description" rows="5" placeholder="Beschrijf kort en duidelijk wat bezoekers kunnen verwachten..." required />
          </div>
        </section>

        <!-- BETALING -->
        <section class="form-section">
          <div class="section-title">
            <span>04</span>
            <div>
              <h3>Betaling</h3>
              <p>Voeg betaalinformatie toe zodat deelnemers makkelijk kunnen betalen.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="paymentLink">Betaallink</label>
              <input id="paymentLink" v-model="form.paymentLink" type="text" placeholder="Tikkie of betaal URL" />
            </div>

            <div class="form-group">
              <label for="paymentContactName">Contactpersoon naam</label>
              <input id="paymentContactName" v-model="form.paymentContactName" type="text" />
            </div>

            <div class="form-group">
              <label for="paymentContactPhone">Telefoonnummer</label>
              <input id="paymentContactPhone" v-model="form.paymentContactPhone" type="text" />
            </div>

            <div class="form-group">
              <label for="paymentQrUrl">QR-code uploaden</label>
              <input id="paymentQrUrl" type="file" accept="image/*" @change="handleQrChange" />

              <img
                  v-if="qrPreview"
                  :src="qrPreview"
                  alt="QR-code voorbeeld"
                  class="qr-preview"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="paymentInstructions">Extra instructies</label>
            <textarea id="paymentInstructions" v-model="form.paymentInstructions" placeholder="Bijv. Zet je naam in de omschrijving bij betaling." />
          </div>
        </section>

        <!-- REQUIREMENTS -->
        <section class="requirements-panel">
          <div>
            <span>05</span>
            <h3>Vereiste profielgegevens</h3>
            <p>Kies welke profielgegevens verplicht zijn voordat iemand zich mag inschrijven.</p>
          </div>

          <div class="requirements-list">
            <label class="requirement-row">
              <input v-model="form.requiresChurch" type="checkbox" />
              <span>Kerk verplicht</span>
            </label>

            <label class="requirement-row">
              <input v-model="form.requiresRank" type="checkbox" />
              <span>Rang/functie verplicht</span>
            </label>

            <label class="requirement-row">
              <input v-model="form.requiresConfessionFather" type="checkbox" />
              <span>Biechtvader verplicht</span>
            </label>

            <label class="requirement-row">
              <input v-model="form.requiresAllergies" type="checkbox" />
              <span>Allergieën verplicht</span>
            </label>
          </div>
        </section>

        <div class="submit-bar">
          <p>Controleer alles goed voordat je het event toevoegt.</p>

          <button class="submit-button" type="submit" :disabled="loading">
            {{ loading ? 'Bezig...' : 'Event toevoegen' }}
          </button>
        </div>
      </form>

      <!-- PREVIEW -->
      <aside class="preview-panel">
        <div class="preview-sticky">
          <p class="eyebrow">Preview</p>
          <h2>Zo ziet je event eruit</h2>

          <div class="event-preview-card">
            <div class="preview-image">
              <img
                  v-if="imagePreview"
                  :src="imagePreview"
                  alt="Event preview"
                  :style="{ objectPosition: `${form.imageFocusX}% ${form.imageFocusY}%` }"
              />

              <span v-else>Geen afbeelding</span>
            </div>

            <div class="preview-content">
              <span class="preview-category">
                {{ form.category || 'Categorie' }}
              </span>

              <h3>{{ form.title || 'Event titel' }}</h3>

              <div class="preview-info">
                <div>
                  <span>Datum</span>
                  <strong>{{ form.date || '-' }}</strong>
                </div>

                <div>
                  <span>Locatie</span>
                  <strong>{{ form.location || '-' }}</strong>
                </div>

                <div>
                  <span>Prijs</span>
                  <strong>€{{ Number(form.price || 0).toFixed(2) }}</strong>
                </div>

                <div>
                  <span>Capaciteit</span>
                  <strong>{{ form.capacity || '-' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="admin-help">
            <h3>Checklist</h3>

            <ul>
              <li>Heeft het event een duidelijke titel?</li>
              <li>Klopt de datum en locatie?</li>
              <li>Is de doelgroep goed ingesteld?</li>
              <li>Is de betaalinformatie duidelijk?</li>
            </ul>
          </div>
        </div>
      </aside>
    </section>

    <!-- EXISTING EVENTS -->
    <section class="events-overview">
      <div class="overview-heading">
        <div>
          <p class="eyebrow">Overzicht</p>
          <h2>Bestaande events</h2>
          <p>Bekijk snel welke events al in het systeem staan.</p>
        </div>
      </div>

      <div class="events-table-wrapper">
        <table>
          <thead>
          <tr>
            <th>Titel</th>
            <th>Type</th>
            <th>Datum</th>
            <th>Locatie</th>
            <th>Categorie</th>
            <th>Leeftijd</th>
            <th>Prijs</th>
            <th>Capaciteit</th>
            <th>Actie</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>
              <strong>{{ event.title }}</strong>
            </td>

            <td>{{ event.event_type || event.eventType || 'national' }}</td>
            <td>{{ formatDate(event.date) }}</td>
            <td>{{ event.location }}</td>
            <td>{{ event.category }}</td>

            <td>
                <span v-if="event.min_age || event.max_age">
                  {{ event.min_age || '-' }} - {{ event.max_age || '-' }}
                </span>
              <span v-else>Iedereen</span>
            </td>

            <td>€{{ Number(event.price).toFixed(2) }}</td>
            <td>{{ event.capacity }}</td>

            <td>
              <button class="delete-button" @click="removeEvent(event.id)">
                Verwijderen
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import {
  fetchConferences,
  createConference,
  deleteConference,
  fetchChurches
} from '../services/api'

const message = ref('')
const success = ref(false)
const loading = ref(false)
const events = ref([])
const churches = ref([])
const imagePreview = ref('')
const qrPreview = ref('')

const form = reactive({
  title: '',
  category: '',
  date: '',
  location: '',
  price: 0,
  capacity: 100,
  image: '',
  imageFocusX: 50,
  imageFocusY: 50,
  description: '',

  eventType: 'national',
  city: '',
  churchId: '',
  minAge: '',
  maxAge: '',
  requiresChurch: false,
  requiresRank: false,
  requiresConfessionFather: false,
  requiresAllergies: false,
  targetChurchId: '',
  targetCity: '',
  targetRank: '',

  paymentLink: '',
  paymentQrUrl: '',
  paymentContactName: '',
  paymentContactPhone: '',
  paymentInstructions: ''
})

function formatDate(date) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

async function loadEvents() {
  events.value = await fetchConferences()
}

async function loadChurches() {
  churches.value = await fetchChurches()
}

onMounted(async () => {
  try {
    await loadEvents()
    await loadChurches()
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})

function compressImage(file, maxWidth = 800, quality = 0.55) {
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

async function handleImageChange(event) {
  const file = event.target.files[0]

  if (!file) {
    form.image = ''
    imagePreview.value = ''
    form.imageFocusX = 50
    form.imageFocusY = 50
    return
  }

  const compressedImage = await compressImage(file, 800, 0.55)

  form.image = compressedImage
  imagePreview.value = compressedImage
  form.imageFocusX = 50
  form.imageFocusY = 50
}

async function handleQrChange(event) {
  const file = event.target.files[0]

  if (!file) {
    form.paymentQrUrl = ''
    qrPreview.value = ''
    return
  }

  const compressedQr = await compressImage(file, 400, 0.65)

  form.paymentQrUrl = compressedQr
  qrPreview.value = compressedQr
}

function setImageFocus(event) {
  const rect = event.currentTarget.getBoundingClientRect()

  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  form.imageFocusX = Math.round(Math.min(100, Math.max(0, x)))
  form.imageFocusY = Math.round(Math.min(100, Math.max(0, y)))
}

function resetForm() {
  form.title = ''
  form.category = ''
  form.date = ''
  form.location = ''
  form.price = 0
  form.capacity = 100
  form.image = ''
  form.imageFocusX = 50
  form.imageFocusY = 50
  form.description = ''

  form.eventType = 'national'
  form.city = ''
  form.churchId = ''
  form.minAge = ''
  form.maxAge = ''
  form.requiresChurch = false
  form.requiresRank = false
  form.requiresConfessionFather = false
  form.requiresAllergies = false
  form.targetChurchId = ''
  form.targetCity = ''
  form.targetRank = ''

  form.paymentLink = ''
  form.paymentQrUrl = ''
  form.paymentContactName = ''
  form.paymentContactPhone = ''
  form.paymentInstructions = ''

  imagePreview.value = ''
  qrPreview.value = ''
}

async function handleCreateEvent() {
  loading.value = true
  message.value = ''

  try {
    const payload = {
      ...form,
      price: Number(form.price || 0),
      capacity: Number(form.capacity || 100),
      churchId: form.churchId ? Number(form.churchId) : null,
      targetChurchId: form.targetChurchId ? Number(form.targetChurchId) : null,
      minAge: form.minAge ? Number(form.minAge) : null,
      maxAge: form.maxAge ? Number(form.maxAge) : null,
      imageFocusX: Number(form.imageFocusX || 50),
      imageFocusY: Number(form.imageFocusY || 50)
    }

    const response = await createConference(payload)

    events.value.unshift(response.data)
    resetForm()

    success.value = true
    message.value = 'Event succesvol toegevoegd.'
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
}

async function removeEvent(id) {
  try {
    await deleteConference(id)
    events.value = events.value.filter(event => event.id !== id)
    success.value = true
    message.value = 'Event verwijderd.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}
</script>

<style scoped>
.admin-events {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 80px;
}

/* HERO */
.admin-events-hero {
  position: relative;
  overflow: hidden;
  min-height: 390px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 90px max(4vw, 32px) 66px;
  background:
      radial-gradient(circle at 86% 16%, rgba(37, 99, 235, 0.18), transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 52%, #eef4ff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.admin-events-hero::after {
  content: "";
  position: absolute;
  right: -120px;
  bottom: -150px;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
}

.admin-events-hero > div {
  position: relative;
  z-index: 2;
}

.eyebrow {
  margin-bottom: 12px;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.admin-events-hero h1 {
  max-width: 820px;
  margin-bottom: 18px;
  color: #0f172a;
  font-size: clamp(3rem, 6vw, 5.5rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.admin-events-hero p {
  max-width: 680px;
  color: #64748b;
  font-size: 1.08rem;
  line-height: 1.8;
}

.hero-count {
  width: 155px;
  height: 155px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 36px;
  background: #0f172a;
  color: white;
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.22);
}

.hero-count strong {
  display: block;
  font-size: 3.2rem;
  line-height: 1;
}

.hero-count span {
  display: block;
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 0.88rem;
  font-weight: 800;
}

/* LAYOUT */
.create-layout {
  width: min(1280px, 92%);
  margin: 46px auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 34px;
  align-items: start;
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-header {
  margin-bottom: 6px;
}

.form-header h2,
.overview-heading h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.form-header p,
.overview-heading p {
  color: #64748b;
}

/* FORM SECTIONS */
.form-section,
.requirements-panel,
.submit-bar,
.events-overview {
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.form-section {
  padding: 28px;
}

.section-title {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.section-title span,
.requirements-panel > div:first-child span {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #0f172a;
  color: #ffffff;
  font-weight: 900;
}

.section-title h3,
.requirements-panel h3 {
  margin-bottom: 5px;
  color: #0f172a;
  font-size: 1.25rem;
  letter-spacing: -0.04em;
}

.section-title p,
.requirements-panel p {
  color: #64748b;
  line-height: 1.7;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.form-group label {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

input,
select,
textarea {
  width: 100%;
  min-height: 50px;
  padding: 13px 15px;
  border-radius: 16px;
  border: 1px solid #dbe3ef;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  outline: none;
  transition: 0.2s ease;
}

textarea {
  resize: vertical;
  min-height: 140px;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

/* IMAGE PREVIEW */
.image-focus-wrapper {
  position: relative;
  height: 260px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  cursor: crosshair;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.focus-dot {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 3px solid white;
  border-radius: 999px;
  background: #2563eb;
  transform: translate(-50%, -50%);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.35);
}

.focus-help {
  margin-top: 10px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
}

.qr-preview {
  width: 130px;
  margin-top: 12px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

/* REQUIREMENTS */
.requirements-panel {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 24px;
  padding: 28px;
  background: #0f172a;
  color: white;
}

.requirements-panel h3 {
  color: white;
}

.requirements-panel p {
  color: #cbd5e1;
}

.requirements-panel > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.requirements-panel > div:first-child span {
  background: #2563eb;
}

.requirements-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.requirement-row {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 54px;
  padding: 13px 15px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  cursor: pointer;
}

.requirement-row input {
  width: 17px;
  height: 17px;
  min-height: unset;
  box-shadow: none;
}

.requirement-row span {
  font-size: 0.92rem;
  font-weight: 800;
}

/* SUBMIT */
.submit-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;
  padding: 20px 22px;
}

.submit-bar p {
  color: #64748b;
  font-weight: 700;
}

.submit-button {
  min-width: 180px;
  padding: 14px 20px;
  border-radius: 16px;
  background: #2563eb;
  color: white;
  font-weight: 900;
  transition: 0.2s ease;
}

.submit-button:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
}

.submit-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* PREVIEW */
.preview-panel {
  position: relative;
}

.preview-sticky {
  position: sticky;
  top: 110px;
}

.preview-sticky h2 {
  margin-bottom: 20px;
  color: #0f172a;
  font-size: 1.7rem;
  letter-spacing: -0.05em;
}

.event-preview-card,
.admin-help {
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.preview-image {
  height: 220px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 900;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-content {
  padding: 22px;
}

.preview-category {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
}

.preview-content h3 {
  margin-bottom: 18px;
  color: #0f172a;
  font-size: 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.05em;
}

.preview-info {
  display: grid;
  gap: 10px;
}

.preview-info div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.preview-info span {
  color: #64748b;
  font-weight: 800;
}

.preview-info strong {
  color: #0f172a;
  text-align: right;
}

.admin-help {
  margin-top: 18px;
  padding: 22px;
}

.admin-help h3 {
  margin-bottom: 12px;
  color: #0f172a;
}

.admin-help ul {
  display: grid;
  gap: 10px;
  padding-left: 18px;
  color: #64748b;
  line-height: 1.6;
}

/* OVERVIEW */
.events-overview {
  width: min(1280px, 92%);
  margin: 48px auto 0;
  padding: 30px;
}

.overview-heading {
  margin-bottom: 24px;
}

.events-table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 15px;
  color: #64748b;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 16px 15px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}

td strong {
  color: #0f172a;
}

.delete-button {
  padding: 10px 14px;
  border-radius: 14px;
  background: #fee2e2;
  color: #dc2626;
  font-weight: 900;
  transition: 0.2s ease;
}

.delete-button:hover {
  background: #dc2626;
  color: white;
}

/* RESPONSIVE */
@media (max-width: 1100px) {
  .create-layout {
    grid-template-columns: 1fr;
  }

  .preview-sticky {
    position: static;
  }
}

@media (max-width: 780px) {
  .admin-events-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-count {
    width: 125px;
    height: 125px;
    border-radius: 30px;
  }

  .form-grid,
  .requirements-panel,
  .requirements-list {
    grid-template-columns: 1fr;
  }

  .submit-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .submit-button {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .admin-events-hero {
    padding: 70px 24px 58px;
  }

  .admin-events-hero h1 {
    font-size: 3rem;
  }

  .form-section,
  .requirements-panel,
  .events-overview {
    padding: 22px;
    border-radius: 22px;
  }

  .section-title {
    flex-direction: column;
  }
}
</style>