<template>
  <main class="admin-events">
    <section class="page-hero">
      <div>
        <p class="eyebrow">Admin - Events</p>
        <h1>{{ editingEventId ? 'Event aanpassen' : 'Nieuw event maken' }}</h1>
        <p>Vul alleen in wat nodig is. Extra regels en betaling staan apart.</p>
      </div>

      <div class="hero-count">
        <strong>{{ events.length }}</strong>
        <span>events</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section class="event-builder">
      <form class="event-form" @submit.prevent="handleSubmitEvent">
        <nav class="builder-steps" aria-label="Event stappen">
          <button
              v-for="(step, index) in eventSteps"
              :key="step.title"
              type="button"
              :class="{ active: activeEventStep === index, done: index < activeEventStep }"
              @click="goToEventStep(index)"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ step.title }}</strong>
            <small>{{ step.caption }}</small>
          </button>
        </nav>

        <section v-if="activeEventStep === 0" class="form-panel">
          <div class="panel-heading">
            <span>1</span>
            <div>
              <h2>Wat is het event?</h2>
              <p>Naam, datum, plek, prijs en capaciteit.</p>
            </div>
          </div>

          <div class="field-grid">
            <label class="field wide">
              <span>Eventnaam</span>
              <input v-model="form.title" type="text" placeholder="Bijv. Jongerenweekend 2026" required />
            </label>

            <label class="field">
              <span>Categorie</span>
              <input v-model="form.category" type="text" placeholder="Bijv. Kamp" required />
            </label>

            <label class="field">
              <span>Datum</span>
              <input v-model="form.date" type="date" required />
            </label>

            <label class="field">
              <span>Locatie</span>
              <input v-model="form.location" type="text" placeholder="Bijv. Apeldoorn" required />
            </label>

            <label class="field">
              <span>Stad</span>
              <input v-model="form.city" type="text" placeholder="Bijv. Apeldoorn" />
            </label>

            <label class="field">
              <span>Prijs</span>
              <input v-model="form.price" type="number" step="0.01" min="0" required />
            </label>

            <label class="field">
              <span>Plekken</span>
              <input v-model="form.capacity" type="number" min="1" required />
            </label>

            <label class="field">
              <span>Deadline aanmelden</span>
              <input v-model="form.registrationDeadline" type="date" />
            </label>
          </div>
        </section>

        <section v-if="activeEventStep === 1" class="form-panel">
          <div class="panel-heading">
            <span>2</span>
            <div>
              <h2>Wat zien deelnemers?</h2>
              <p>Beschrijving en afbeelding voor de eventpagina.</p>
            </div>
          </div>

          <div class="field-grid">
            <label class="field wide">
              <span>Beschrijving</span>
              <textarea
                  v-model="form.description"
                  rows="7"
                  placeholder="Schrijf hier de tekst die op de eventpagina komt."
                  required
              />
            </label>

            <label class="field wide">
              <span>Email onderwerp</span>
              <input v-model="form.emailSubject" type="text" placeholder="Leeg = standaard onderwerp" />
            </label>

            <label class="field wide">
              <span>Email bericht</span>
              <textarea
                  v-model="form.emailBody"
                  rows="5"
                  placeholder="Los bericht voor de uitnodigingsmail. Leeg = standaard tekst."
              />
            </label>

            <label class="field wide">
              <span>Afbeelding</span>
              <input type="file" accept="image/*" @change="handleImageChange" />
            </label>
          </div>

          <div v-if="imagePreview" class="image-focus" @click="setImageFocus">
            <img
                :src="imagePreview"
                alt="Voorbeeld afbeelding"
                :style="{ objectPosition: `${form.imageFocusX}% ${form.imageFocusY}%` }"
            />
            <span
                class="focus-dot"
                :style="{ left: `${form.imageFocusX}%`, top: `${form.imageFocusY}%` }"
            ></span>
          </div>
        </section>

        <section v-if="activeEventStep === 2" class="form-panel">
          <div class="panel-heading">
            <span>3</span>
            <div>
              <h2>Wie mag aanmelden?</h2>
              <p>Laat leeg als iedereen welkom is.</p>
            </div>
          </div>

          <div class="simple-choice">
            <button
                type="button"
                :class="{ active: form.eventType === 'national' }"
                @click="form.eventType = 'national'"
            >
              Nationaal
            </button>
            <button
                type="button"
                :class="{ active: form.eventType === 'local' }"
                @click="form.eventType = 'local'"
            >
              Lokaal
            </button>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Organiserende kerk</span>
              <select v-model="form.churchId">
                <option value="">Geen specifieke kerk</option>
                <option v-for="church in churches" :key="church.id" :value="church.id">
                  {{ church.name }} - {{ church.city }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Alleen voor kerk</span>
              <select v-model="form.targetChurchId">
                <option value="">Iedereen</option>
                <option v-for="church in churches" :key="church.id" :value="church.id">
                  {{ church.name }} - {{ church.city }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Minimum leeftijd</span>
              <input v-model="form.minAge" type="number" min="0" placeholder="Geen minimum" />
            </label>

            <label class="field">
              <span>Maximum leeftijd</span>
              <input v-model="form.maxAge" type="number" min="0" placeholder="Geen maximum" />
            </label>

            <label class="field">
              <span>Alleen voor stad</span>
              <input v-model="form.targetCity" type="text" placeholder="Leeg = iedereen" />
            </label>

            <label class="field">
              <span>Alleen voor rang/functie</span>
              <input v-model="form.targetRank" type="text" placeholder="Bijv. diaken" />
            </label>
          </div>

          <div class="checkbox-group">
            <label>
              <input v-model="form.requiresChurch" type="checkbox" />
              <span>Kerk verplicht</span>
            </label>
            <label>
              <input v-model="form.requiresRank" type="checkbox" />
              <span>Rang/functie verplicht</span>
            </label>
            <label>
              <input v-model="form.requiresConfessionFather" type="checkbox" />
              <span>Biechtvader verplicht</span>
            </label>
            <label>
              <input v-model="form.requiresAllergies" type="checkbox" />
              <span>Allergieën verplicht</span>
            </label>
          </div>
        </section>

        <section v-if="activeEventStep === 3" class="form-panel">
          <div class="panel-heading">
            <span>4</span>
            <div>
              <h2>Hoe betalen ze?</h2>
              <p>Tikkie, QR-code en contactpersoon.</p>
            </div>
          </div>

          <div class="field-grid">
            <label class="field wide">
              <span>Betaallink</span>
              <input v-model="form.paymentLink" type="url" placeholder="https://..." />
            </label>

            <label class="field">
              <span>Contactpersoon</span>
              <input v-model="form.paymentContactName" type="text" placeholder="Naam" />
            </label>

            <label class="field">
              <span>Telefoonnummer</span>
              <input v-model="form.paymentContactPhone" type="text" placeholder="+31..." />
            </label>

            <label class="field wide">
              <span>QR-code</span>
              <input type="file" accept="image/*" @change="handleQrChange" />
            </label>
          </div>

          <img v-if="qrPreview" :src="qrPreview" alt="QR-code voorbeeld" class="qr-preview" />

          <label class="field">
            <span>Betaalinstructies</span>
            <textarea
                v-model="form.paymentInstructions"
                rows="4"
                placeholder="Bijv. Zet je naam in de omschrijving."
            />
          </label>
        </section>

        <section v-if="activeEventStep === 4" class="form-panel review-panel">
          <div class="panel-heading">
            <span>5</span>
            <div>
              <h2>Controleer en publiceer</h2>
              <p>Loop de belangrijkste keuzes nog één keer na voordat het live gaat.</p>
            </div>
          </div>

          <div class="review-grid">
            <div>
              <span>Event</span>
              <strong>{{ form.title || '-' }}</strong>
              <small>{{ form.category || 'Geen categorie' }}</small>
            </div>

            <div>
              <span>Datum en locatie</span>
              <strong>{{ form.date || '-' }}</strong>
              <small>{{ form.location || 'Geen locatie' }}</small>
            </div>

            <div>
              <span>Prijs</span>
              <strong>€{{ Number(form.price || 0).toFixed(2) }}</strong>
              <small>{{ form.capacity || 0 }} plekken</small>
            </div>

            <div>
              <span>Doelgroep</span>
              <strong>{{ form.eventType === 'local' ? 'Lokaal' : 'Nationaal' }}</strong>
              <small>{{ form.targetCity || form.targetRank || form.targetChurchId ? 'Met filters' : 'Iedereen welkom' }}</small>
            </div>
          </div>
        </section>

        <div class="submit-panel">
          <div>
            <strong>{{ currentEventStep.title }}</strong>
            <span>{{ currentEventStep.help }}</span>
          </div>

          <div class="builder-actions">
            <button
                v-if="activeEventStep > 0"
                class="ghost-button"
                type="button"
                @click="activeEventStep -= 1"
            >
              Terug
            </button>

            <button
                v-if="activeEventStep < eventSteps.length - 1"
                class="submit-button"
                type="button"
                @click="nextEventStep"
            >
              Volgende
            </button>

            <button
                v-else
                class="submit-button"
                type="submit"
                :disabled="loading"
            >
              {{ loading ? 'Even bezig...' : (editingEventId ? 'Event opslaan' : 'Event toevoegen') }}
            </button>
          </div>

          <button v-if="editingEventId" class="cancel-edit-button" type="button" @click="cancelEdit">
            Annuleren
          </button>
        </div>
      </form>

      <aside class="side-panel">
        <div class="preview-box">
          <p class="eyebrow">Preview</p>
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
            <span>{{ form.category || 'Categorie' }}</span>
            <h2>{{ form.title || 'Eventnaam' }}</h2>
            <dl>
              <div>
                <dt>Stap</dt>
                <dd>{{ activeEventStep + 1 }}/{{ eventSteps.length }}</dd>
              </div>
              <div>
                <dt>Datum</dt>
                <dd>{{ form.date || '-' }}</dd>
              </div>
              <div>
                <dt>Prijs</dt>
                <dd>€{{ Number(form.price || 0).toFixed(2) }}</dd>
              </div>
              <div>
                <dt>Plekken</dt>
                <dd>{{ form.capacity || '-' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>
    </section>

    <section class="events-overview">
      <div class="overview-heading">
        <div>
          <p class="eyebrow">Overzicht</p>
          <h2>Bestaande events</h2>
          <p>Alle events die nu in het systeem staan.</p>
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
            <th>Plekken</th>
            <th>Actie</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="event in events" :key="event.id">
            <td><strong>{{ event.title }}</strong></td>
            <td>{{ event.event_type || event.eventType || 'national' }}</td>
            <td>{{ formatDate(event.date) }}</td>
            <td>{{ event.location }}</td>
            <td>{{ event.category }}</td>
            <td>
              <span v-if="event.minAge || event.maxAge">
                {{ event.minAge || '-' }} - {{ event.maxAge || '-' }}
              </span>
              <span v-else>Iedereen</span>
            </td>
            <td>€{{ Number(event.price).toFixed(2) }}</td>
            <td>{{ event.registeredCount || 0 }} / {{ event.capacity }}</td>
            <td>
              <button class="delete-button" @click="removeEvent(event.id)">
                Archiveren
              </button>
              <button class="edit-button" @click="startEdit(event)">
                Bewerken
              </button>
              <button class="mail-button" @click="resendEventMail(event)">
                Mail opnieuw
              </button>
              <button class="edit-button" @click="sendTestMail(event)">
                Test mail
              </button>
              <button class="edit-button" @click="syncEventSheet(event)">
                Sheet sync
              </button>
              <a v-if="event.googleSheetUrl" class="sheet-link" :href="event.googleSheetUrl" target="_blank">
                Open Sheet
              </a>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import {
  fetchConferences,
  createConference,
  updateConference,
  resendConferenceEmail,
  sendConferenceTestEmail,
  syncGoogleSheetForEvent,
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
const editingEventId = ref(null)
const activeEventStep = ref(0)

const eventSteps = [
  {
    title: 'Basis',
    caption: 'Naam en datum',
    help: 'Leg eerst de kern vast: wat, waar, wanneer en hoeveel plekken.',
    requiredFields: ['title', 'category', 'date', 'location', 'price', 'capacity']
  },
  {
    title: 'Presentatie',
    caption: 'Tekst en beeld',
    help: 'Maak de eventpagina en uitnodigingsmail duidelijk en aantrekkelijk.',
    requiredFields: ['description']
  },
  {
    title: 'Doelgroep',
    caption: 'Regels',
    help: 'Bepaal wie zich kan aanmelden en welke extra profielgegevens nodig zijn.',
    requiredFields: []
  },
  {
    title: 'Betaling',
    caption: 'Instructies',
    help: 'Voeg betaalinformatie toe als deelnemers moeten betalen.',
    requiredFields: []
  },
  {
    title: 'Controle',
    caption: 'Publiceren',
    help: 'Controleer de samenvatting en publiceer het event.',
    requiredFields: []
  }
]

const currentEventStep = computed(() => eventSteps[activeEventStep.value])

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
  paymentInstructions: '',
  registrationDeadline: '',
  emailSubject: '',
  emailBody: ''
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
  form.registrationDeadline = ''
  form.emailSubject = ''
  form.emailBody = ''
  editingEventId.value = null
  activeEventStep.value = 0

  imagePreview.value = ''
  qrPreview.value = ''
}

function normalizeDateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function startEdit(event) {
  editingEventId.value = event.id

  form.title = event.title || ''
  form.category = event.category || ''
  form.date = normalizeDateInput(event.date)
  form.location = event.location || ''
  form.price = Number(event.price || 0)
  form.capacity = Number(event.capacity || 100)
  form.image = event.image || ''
  form.description = event.description || ''

  form.eventType = event.eventType || 'national'
  form.city = event.city || ''
  form.churchId = event.churchId || ''
  form.minAge = event.minAge || ''
  form.maxAge = event.maxAge || ''
  form.requiresChurch = !!event.requiresChurch
  form.requiresRank = !!event.requiresRank
  form.requiresConfessionFather = !!event.requiresConfessionFather
  form.requiresAllergies = !!event.requiresAllergies
  form.targetChurchId = event.targetChurchId || ''
  form.targetCity = event.targetCity || ''
  form.targetRank = event.targetRank || ''

  form.paymentLink = event.paymentLink || ''
  form.paymentQrUrl = event.paymentQrUrl || ''
  form.paymentContactName = event.paymentContactName || ''
  form.paymentContactPhone = event.paymentContactPhone || ''
  form.paymentInstructions = event.paymentInstructions || ''
  form.registrationDeadline = normalizeDateInput(event.registrationDeadline)
  form.emailSubject = event.emailSubject || ''
  form.emailBody = event.emailBody || ''

  imagePreview.value = form.image
  qrPreview.value = form.paymentQrUrl
  activeEventStep.value = 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  resetForm()
}

function validateEventStep(stepIndex = activeEventStep.value) {
  const step = eventSteps[stepIndex]
  const missing = step.requiredFields.filter(field => {
    const value = form[field]
    return value === '' || value === null || value === undefined
  })

  if (!missing.length) {
    message.value = ''
    return true
  }

  success.value = false
  message.value = 'Vul eerst de verplichte velden in deze stap in.'
  return false
}

function nextEventStep() {
  if (!validateEventStep()) return
  activeEventStep.value = Math.min(eventSteps.length - 1, activeEventStep.value + 1)
}

function goToEventStep(index) {
  if (index <= activeEventStep.value) {
    activeEventStep.value = index
    return
  }

  for (let stepIndex = activeEventStep.value; stepIndex < index; stepIndex += 1) {
    if (!validateEventStep(stepIndex)) return
  }

  activeEventStep.value = index
}

async function handleSubmitEvent() {
  for (let stepIndex = 0; stepIndex < eventSteps.length; stepIndex += 1) {
    if (!validateEventStep(stepIndex)) {
      activeEventStep.value = stepIndex
      return
    }
  }

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
      imageFocusY: Number(form.imageFocusY || 50),
      registrationDeadline: form.registrationDeadline || null,
      emailSubject: form.emailSubject || null,
      emailBody: form.emailBody || null
    }

    const wasEditing = !!editingEventId.value
    const eventId = editingEventId.value
    const response = wasEditing
        ? await updateConference(editingEventId.value, payload)
        : await createConference(payload)

    if (wasEditing) {
      events.value = events.value.map(event => event.id === eventId ? response.data : event)
    } else {
      events.value.unshift(response.data)

      if (response.data.googleSheetUrl) {
        message.value = 'Event succesvol toegevoegd. De Google Sheet is automatisch aangemaakt.'
      }
    }
    resetForm()

    success.value = true
    if (!message.value) {
      message.value = wasEditing ? 'Event succesvol bijgewerkt.' : 'Event succesvol toegevoegd.'
    }
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
}

async function resendEventMail(event) {
  try {
    const response = await resendConferenceEmail(event.id)

    success.value = true
    message.value = `Email opnieuw verstuurd naar ${response.data.sentCount} gebruikers.`
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function sendTestMail(event) {
  try {
    const response = await sendConferenceTestEmail(event.id)

    success.value = true
    message.value = `Testmail verstuurd naar ${response.data.email}.`
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function syncEventSheet(event) {
  try {
    const response = await syncGoogleSheetForEvent(event.id)

    events.value = events.value.map(existingEvent => (
      existingEvent.id === event.id
        ? {
          ...existingEvent,
          googleSheetId: response.spreadsheetId || existingEvent.googleSheetId,
          googleSheetUrl: response.spreadsheetUrl || existingEvent.googleSheetUrl,
          googleSheetLastSyncedAt: new Date().toISOString(),
          googleSheetLastError: null
        }
        : existingEvent
    ))

    success.value = true
    message.value = `Sheet bijgewerkt met ${response.rowCount} registraties.`
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function removeEvent(id) {
  try {
    await deleteConference(id)
    events.value = events.value.filter(event => event.id !== id)
    success.value = true
    message.value = 'Event gearchiveerd. Registraties blijven bewaard.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}
</script>

<style scoped>
.admin-events {
  min-height: 100vh;
  background: #f6f8fb;
  padding-bottom: 72px;
}

.page-hero {
  min-height: 330px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 84px max(4vw, 28px) 54px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.page-hero > div:first-child {
  max-width: 820px;
}

.eyebrow {
  margin-bottom: 10px;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-hero h1 {
  margin-bottom: 14px;
  color: #0f172a;
  font-size: clamp(3rem, 6vw, 5.4rem);
  line-height: 0.95;
}

.page-hero p {
  color: #64748b;
  font-size: 1.06rem;
  line-height: 1.7;
}

.hero-count {
  min-width: 132px;
  min-height: 132px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 8px;
  background: #0f172a;
  color: #ffffff;
}

.hero-count strong {
  display: block;
  font-size: 3rem;
  line-height: 1;
}

.hero-count span {
  display: block;
  margin-top: 7px;
  color: #cbd5e1;
  font-weight: 800;
}

.event-builder {
  width: min(1240px, 92%);
  margin: 34px auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}

.event-form {
  display: grid;
  gap: 18px;
}

.builder-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.builder-steps button {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 4px 10px;
  align-items: center;
  min-height: 74px;
  padding: 11px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  color: #64748b;
  text-align: left;
}

.builder-steps span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  grid-row: span 2;
  border-radius: 8px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 900;
}

.builder-steps strong,
.builder-steps small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.builder-steps strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.builder-steps small {
  color: #64748b;
  font-weight: 800;
}

.builder-steps button.active {
  border-color: rgba(37, 99, 235, 0.42);
  background: #eff6ff;
}

.builder-steps button.active span,
.builder-steps button.done span {
  background: #2563eb;
  color: #ffffff;
}

.form-panel,
.submit-panel,
.preview-box,
.events-overview {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.form-panel {
  padding: 24px;
}

.panel-heading {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
}

.panel-heading > span {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #0f172a;
  color: #ffffff;
  font-weight: 900;
}

.panel-heading h2,
.overview-heading h2 {
  margin-bottom: 5px;
  color: #0f172a;
  font-size: clamp(1.45rem, 2.4vw, 2rem);
  line-height: 1.1;
}

.panel-heading p,
.overview-heading p {
  color: #64748b;
  line-height: 1.6;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field.wide {
  grid-column: 1 / -1;
}

.field span {
  color: #334155;
  font-size: 0.86rem;
  font-weight: 900;
}

input,
select,
textarea {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 12px 13px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  outline: none;
}

select {
  overflow: hidden;
  text-overflow: ellipsis;
}

textarea {
  min-height: 132px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.image-focus {
  position: relative;
  height: 240px;
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: crosshair;
}

.image-focus img,
.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.focus-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 3px solid #ffffff;
  border-radius: 999px;
  background: #2563eb;
  transform: translate(-50%, -50%);
}

.simple-choice {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.simple-choice button,
.submit-button,
.delete-button {
  border-radius: 8px;
  font-weight: 900;
}

.simple-choice button {
  padding: 12px;
  background: #f1f5f9;
  color: #0f172a;
}

.simple-choice button.active {
  background: #2563eb;
  color: #ffffff;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 11px 12px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
  font-weight: 800;
}

.checkbox-group input {
  width: 18px;
  min-height: 18px;
}

.qr-preview {
  width: 130px;
  margin: 14px 0;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
}

.review-panel {
  min-height: 360px;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.review-grid div {
  min-height: 112px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
}

.review-grid span,
.review-grid strong,
.review-grid small {
  display: block;
}

.review-grid span {
  margin-bottom: 10px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.review-grid strong {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1.15rem;
}

.review-grid small {
  color: #64748b;
  font-weight: 800;
}

.submit-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
}

.submit-panel strong,
.submit-panel span {
  display: block;
}

.submit-panel strong {
  color: #0f172a;
}

.submit-panel span {
  margin-top: 4px;
  color: #64748b;
}

.builder-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.submit-button {
  min-width: 180px;
  padding: 13px 18px;
  background: #2563eb;
  color: #ffffff;
}

.submit-button:hover {
  background: #1d4ed8;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost-button,
.cancel-edit-button {
  min-width: 120px;
  padding: 13px 18px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 900;
}

.ghost-button:hover,
.cancel-edit-button:hover {
  background: #e2e8f0;
}

.side-panel {
  position: sticky;
  top: 100px;
}

.preview-box {
  overflow: hidden;
}

.preview-box > .eyebrow {
  padding: 18px 18px 0;
}

.preview-image {
  height: 190px;
  display: grid;
  place-items: center;
  margin: 14px 18px 0;
  overflow: hidden;
  border-radius: 8px;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 900;
}

.preview-content {
  padding: 18px;
}

.preview-content > span {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 9px;
  border-radius: 999px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
}

.preview-content h2 {
  margin-bottom: 14px;
  color: #0f172a;
  font-size: 1.45rem;
  line-height: 1.1;
}

.preview-content dl {
  display: grid;
  gap: 9px;
  margin: 0;
}

.preview-content dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 9px;
  border-bottom: 1px solid #e2e8f0;
}

.preview-content dt,
.preview-content dd {
  margin: 0;
}

.preview-content dt {
  color: #64748b;
  font-weight: 800;
}

.preview-content dd {
  color: #0f172a;
  text-align: right;
  font-weight: 900;
}

.events-overview {
  width: min(1240px, 92%);
  margin: 36px auto 0;
  padding: 24px;
}

.overview-heading {
  margin-bottom: 18px;
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
  padding: 14px;
  color: #64748b;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 15px 14px;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
}

td strong {
  color: #0f172a;
}

.delete-button {
  padding: 10px 12px;
  background: #fee2e2;
  color: #dc2626;
}

.delete-button:hover {
  background: #dc2626;
  color: #ffffff;
}

@media (max-width: 1100px) {
  .event-builder {
    grid-template-columns: 1fr;
  }

  .builder-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .side-panel {
    position: static;
  }
}

@media (max-width: 760px) {
  .admin-events {
    padding-bottom: 48px;
  }

  .event-builder,
  .events-overview {
    width: min(100% - 24px, 1240px);
  }

  .page-hero,
  .submit-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-hero {
    min-height: auto;
    gap: 20px;
    padding: 82px 18px 34px;
  }

  .page-hero h1 {
    font-size: 2.35rem;
    line-height: 1;
  }

  .page-hero p {
    font-size: 1rem;
  }

  .hero-count {
    width: 100%;
    min-height: 86px;
    grid-auto-flow: column;
    justify-content: space-between;
    padding: 18px;
  }

  .hero-count strong {
    font-size: 2.1rem;
  }

  .field-grid,
  .checkbox-group,
  .review-grid {
    grid-template-columns: 1fr;
  }

  .builder-steps {
    grid-template-columns: 1fr;
  }

  .builder-steps button {
    min-height: 58px;
  }

  .submit-button,
  .ghost-button,
  .cancel-edit-button,
  .builder-actions {
    width: 100%;
  }

  input,
  select,
  textarea {
    min-height: 48px;
    font-size: 16px;
  }

  .image-focus {
    height: 190px;
  }

  .preview-image {
    height: 160px;
  }
}

@media (max-width: 560px) {
  .page-hero {
    padding: 78px 14px 30px;
  }

  .page-hero h1 {
    font-size: 2.15rem;
  }

  .form-panel,
  .events-overview {
    padding: 14px;
  }

  .panel-heading {
    gap: 10px;
  }

  .panel-heading h2,
  .overview-heading h2 {
    font-size: 1.28rem;
  }

  .checkbox-group label {
    align-items: flex-start;
  }

  .review-grid div {
    min-height: auto;
  }
}
</style>
