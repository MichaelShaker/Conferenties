<template>
  <main class="account-view">
    <!-- HERO -->
    <section class="account-hero">
      <div class="account-hero__content">
        <p class="eyebrow">Mijn account</p>
        <h1>Welkom terug, {{ firstName }}</h1>
        <p>
          Beheer je gegevens, bekijk je registraties en ontdek nieuwe events.
        </p>

        <div class="hero-actions">
          <RouterLink to="/my-registrations" class="hero-button primary">
            Mijn registraties
          </RouterLink>

          <RouterLink to="/events" class="hero-button secondary">
            Bekijk events
          </RouterLink>
        </div>
      </div>

      <div class="profile-avatar">
        {{ initials }}
      </div>
    </section>

    <!-- ACCOUNT SUMMARY -->
    <section class="account-summary">
      <div>
        <span>Naam</span>
        <strong>{{ user?.name || 'Onbekend' }}</strong>
      </div>

      <div>
        <span>E-mailadres</span>
        <strong>{{ user?.email || 'Onbekend' }}</strong>
      </div>

      <div>
        <span>Accounttype</span>
        <strong>{{ user?.role || 'Onbekend' }}</strong>
      </div>
    </section>

    <!-- MAIN CONTENT -->
    <section class="account-content">
      <div class="profile-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Profielinformatie</p>
            <h2>Jouw gegevens</h2>
            <p>Deze informatie wordt gebruikt bij je aanmeldingen.</p>
          </div>

          <RouterLink to="/edit-profile" class="edit-link">
            Bewerken
          </RouterLink>
        </div>

        <div v-if="loading" class="empty-profile">
          Profielgegevens worden geladen...
        </div>

        <div v-else-if="profile" class="details-grid">
          <div class="detail-item">
            <span>Voornaam</span>
            <strong>{{ profile.first_name || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Achternaam</span>
            <strong>{{ profile.last_name || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Telefoonnummer</span>
            <strong>{{ profile.phone || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Geboortedatum</span>
            <strong>{{ formattedBirthDate }}</strong>
          </div>

          <div class="detail-item">
            <span>Kerk</span>
            <strong>{{ profile.churchName || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Kerkstad</span>
            <strong>{{ profile.churchCity || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Woonplaats</span>
            <strong>{{ profile.city || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Rang / functie</span>
            <strong>{{ profile.rank_title || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Biechtvader</span>
            <strong>{{ profile.confession_father || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span>Allergieën</span>
            <strong>{{ profile.allergies || '-' }}</strong>
          </div>

          <div class="detail-item full">
            <span>Dieetwensen</span>
            <strong>{{ profile.dietary_notes || '-' }}</strong>
          </div>
        </div>

        <div v-else class="empty-profile">
          Je profiel is nog niet ingevuld.
          <RouterLink to="/edit-profile">Vul je profiel aan</RouterLink>
        </div>
      </div>

      <aside class="account-sidebar">
        <h2>Snelle acties</h2>
        <p>Kies snel wat je wilt doen.</p>

        <div class="action-list">
          <RouterLink to="/my-registrations" class="action-item primary">
            <span>
              <strong>Mijn registraties</strong>
              <small>Bekijk je aangemelde events</small>
            </span>
            <b>→</b>
          </RouterLink>

          <RouterLink to="/events" class="action-item">
            <span>
              <strong>Bekijk events</strong>
              <small>Ontdek beschikbare evenementen</small>
            </span>
            <b>→</b>
          </RouterLink>

          <RouterLink to="/edit-profile" class="action-item">
            <span>
              <strong>Profiel aanpassen</strong>
              <small>Wijzig je persoonlijke gegevens</small>
            </span>
            <b>→</b>
          </RouterLink>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { authState } from '../stores/auth'
import { fetchMyProfile } from '../services/api'

const profile = ref(null)
const loading = ref(false)

const user = computed(() => authState.user)

const firstName = computed(() => {
  return user.value?.name?.split(' ')[0] || 'gebruiker'
})

const initials = computed(() => {
  if (!user.value?.name) return '?'

  return user.value.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
})

const formattedBirthDate = computed(() => {
  if (!profile.value?.birth_date) return '-'
  return profile.value.birth_date.slice(0, 10)
})

onMounted(async () => {
  loading.value = true

  try {
    profile.value = await fetchMyProfile()
  } catch (error) {
    console.error('Profiel ophalen mislukt:', error.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.account-view {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 80px;
}

/* HERO */
.account-hero {
  position: relative;
  overflow: hidden;
  min-height: 430px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 90px max(4vw, 32px) 70px;
  background:
      radial-gradient(circle at 85% 20%, rgba(37, 99, 235, 0.18), transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 52%, #eef4ff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.account-hero::after {
  content: "";
  position: absolute;
  right: -120px;
  bottom: -150px;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
}

.account-hero__content {
  position: relative;
  z-index: 2;
  max-width: 760px;
}

.eyebrow {
  margin-bottom: 14px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.account-hero h1 {
  margin-bottom: 18px;
  color: #0f172a;
  font-size: clamp(3rem, 6vw, 5.8rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.account-hero p {
  max-width: 620px;
  color: #64748b;
  font-size: 1.08rem;
  line-height: 1.8;
}

.profile-avatar {
  position: relative;
  z-index: 2;
  width: 150px;
  height: 150px;
  display: grid;
  place-items: center;
  border-radius: 36px;
  background: #0f172a;
  color: #ffffff;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -0.06em;
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.22);
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 28px;
}

.hero-button {
  display: inline-flex;
  justify-content: center;
  padding: 14px 20px;
  border-radius: 16px;
  font-weight: 900;
  text-decoration: none;
}

.hero-button.primary {
  background: #2563eb;
  color: white;
}

.hero-button.secondary {
  background: white;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

/* SUMMARY */
.account-summary {
  position: relative;
  z-index: 3;
  width: min(1180px, 92%);
  margin: -42px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.account-summary div {
  padding: 22px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.09);
}

.account-summary span,
.detail-item span {
  display: block;
  margin-bottom: 7px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.account-summary strong,
.detail-item strong {
  color: #0f172a;
  word-break: break-word;
}

/* CONTENT */
.account-content {
  width: min(1180px, 92%);
  margin: 46px auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 34px;
  align-items: start;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.section-heading h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.section-heading p {
  color: #64748b;
}

.edit-link {
  flex-shrink: 0;
  padding: 11px 16px;
  border-radius: 999px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-item {
  padding: 22px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.detail-item.full {
  grid-column: 1 / -1;
}

/* SIDEBAR */
.account-sidebar {
  position: sticky;
  top: 110px;
  padding: 28px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.account-sidebar h2 {
  margin-bottom: 8px;
  color: #0f172a;
  font-size: 1.5rem;
  letter-spacing: -0.04em;
}

.account-sidebar p {
  margin-bottom: 22px;
  color: #64748b;
  line-height: 1.7;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  text-decoration: none;
  transition: 0.2s ease;
}

.action-item:hover {
  transform: translateY(-2px);
  background: #ffffff;
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
}

.action-item.primary {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.action-item.primary small {
  color: #cbd5e1;
}

.action-item.primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.action-item strong {
  display: block;
  margin-bottom: 4px;
}

.action-item small {
  color: #64748b;
}

.action-item b {
  font-size: 1.3rem;
}

/* EMPTY */
.empty-profile {
  padding: 24px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-weight: 800;
}

.empty-profile a {
  color: #2563eb;
  font-weight: 900;
}

/* RESPONSIVE */
@media (max-width: 1000px) {
  .account-content {
    grid-template-columns: 1fr;
  }

  .account-sidebar {
    position: static;
  }
}

@media (max-width: 780px) {
  .account-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 30px;
    font-size: 2.4rem;
  }

  .account-summary {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .account-hero {
    padding: 70px 24px 58px;
  }

  .account-hero h1 {
    font-size: 3rem;
  }

  .hero-button {
    width: 100%;
  }
}
</style>