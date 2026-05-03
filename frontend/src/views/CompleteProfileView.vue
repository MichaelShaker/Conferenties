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
        <strong>Stap 1</strong>
        <span>Profielgegevens</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section class="profile-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-section">
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

        <div class="form-section">
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

        <div class="form-section">
          <div class="section-title">
            <span>03</span>
            <div>
              <h2>Extra informatie</h2>
              <p>Handig bij diners, kampen en conferenties.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full">
              <label>Allergieën</label>
              <textarea v-model="form.allergies" rows="3" placeholder="Bijv. noten, lactose, geen"></textarea>
            </div>

            <div class="form-group full">
              <label>Dieetwensen</label>
              <textarea v-model="form.dietaryNotes" rows="3" placeholder="Bijv. vegetarisch, geen"></textarea>
            </div>
          </div>
        </div>

        <div class="submit-panel">
          <div>
            <strong>Bijna klaar</strong>
            <p>Je kunt deze gegevens later altijd aanpassen.</p>
          </div>

          <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? 'Opslaan...' : 'Profiel opslaan' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchChurches, fetchMyProfile, updateMyProfile } from '../services/api'
import { authState } from '../stores/auth'

const router = useRouter()

const churches = ref([])
const loading = ref(false)
const message = ref('')
const success = ref(false)

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
  dietaryNotes: ''
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
    }
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})

async function handleSubmit() {
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
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #f8fafc;
  padding: 14px 16px;
  color: var(--text);
  font: inherit;
  outline: none;
  transition: 0.2s ease;
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

@media (max-width: 850px) {
  .profile-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 34px 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .profile-card {
    padding: 24px;
  }

  .submit-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .profile-view {
    padding: 20px 0 56px;
  }

  .profile-hero {
    border-radius: 28px;
  }

  .profile-hero h1 {
    font-size: 3rem;
  }

  .hero-card {
    width: 100%;
  }

  .section-title {
    flex-direction: column;
  }
}
</style>