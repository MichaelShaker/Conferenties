<template>
  <main class="khelwa-account">
    <section class="account-hero">
      <div>
        <span class="badge">Khelwa account</span>
        <h1>Welkom terug, {{ firstName }}</h1>
        <p>
          Bekijk je accountgegevens en ga snel naar je Khelwa reserveringen.
        </p>

        <div class="hero-actions">
          <RouterLink to="/khelwa/my-reservations" class="main-btn">
            Mijn Khelwa reserveringen
          </RouterLink>

          <RouterLink to="/khelwa" class="ghost-btn">
            Nieuwe reservering
          </RouterLink>
        </div>
      </div>

      <div class="avatar">
        {{ initials }}
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card">
        <span>Naam</span>
        <strong>{{ user?.name || "Onbekend" }}</strong>
      </div>

      <div class="summary-card">
        <span>E-mailadres</span>
        <strong>{{ user?.email || "Onbekend" }}</strong>
      </div>

      <div class="summary-card">
        <span>Accounttype</span>
        <strong>{{ user?.role || "Onbekend" }}</strong>
      </div>
    </section>

    <section class="content-grid">
      <div class="profile-card">
        <div class="section-heading">
          <div>
            <span class="badge">Profielinformatie</span>
            <h2>Jouw gegevens</h2>
            <p>Deze gegevens worden gebruikt voor reserveringen en communicatie.</p>
          </div>

          <RouterLink to="/edit-profile" class="edit-btn">
            Bewerken
          </RouterLink>
        </div>

        <div v-if="loading" class="empty-state">
          Profielgegevens worden geladen...
        </div>

        <div v-else-if="profile" class="details-grid">
          <div class="detail-item">
            <span>Voornaam</span>
            <strong>{{ profile.first_name || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Achternaam</span>
            <strong>{{ profile.last_name || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Telefoonnummer</span>
            <strong>{{ profile.phone || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Geboortedatum</span>
            <strong>{{ formattedBirthDate }}</strong>
          </div>

          <div class="detail-item">
            <span>Kerk</span>
            <strong>{{ profile.churchName || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Kerkstad</span>
            <strong>{{ profile.churchCity || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Woonplaats</span>
            <strong>{{ profile.city || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Rang / functie</span>
            <strong>{{ profile.rank_title || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Biechtvader</span>
            <strong>{{ profile.confession_father || "-" }}</strong>
          </div>

          <div class="detail-item">
            <span>Allergieën</span>
            <strong>{{ profile.allergies || "-" }}</strong>
          </div>

          <div class="detail-item full">
            <span>Dieetwensen</span>
            <strong>{{ profile.dietary_notes || "-" }}</strong>
          </div>
        </div>

        <div v-else class="empty-state">
          Je profiel is nog niet ingevuld.
          <RouterLink to="/edit-profile">Vul je profiel aan</RouterLink>
        </div>
      </div>

      <aside class="side-card">
        <h2>Snelle acties</h2>
        <p>Gebruik dezelfde accountgegevens voor beide websites.</p>

        <div class="action-list">
          <RouterLink to="/khelwa/my-reservations" class="action-item primary">
            <span>
              <strong>Khelwa reserveringen</strong>
              <small>Bekijk jouw aanvragen</small>
            </span>
            <b>→</b>
          </RouterLink>

          <RouterLink to="/khelwa" class="action-item">
            <span>
              <strong>Nieuwe reservering</strong>
              <small>Reserveer een nieuwe datum</small>
            </span>
            <b>→</b>
          </RouterLink>

          <RouterLink to="/account" class="action-item">
            <span>
              <strong>Hoofdaccount</strong>
              <small>Open account van de eerste site</small>
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
import { computed, onMounted, ref } from "vue"
import { authState } from "../stores/auth"
import { fetchMyProfile } from "../services/api"

const profile = ref(null)
const loading = ref(false)

const user = computed(() => authState.user)

const firstName = computed(() => {
  return user.value?.name?.split(" ")[0] || "gebruiker"
})

const initials = computed(() => {
  if (!user.value?.name) return "?"

  return user.value.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
})

const formattedBirthDate = computed(() => {
  if (!profile.value?.birth_date) return "-"
  return profile.value.birth_date.slice(0, 10)
})

onMounted(async () => {
  loading.value = true

  try {
    profile.value = await fetchMyProfile()
  } catch (error) {
    console.error("Profiel ophalen mislukt:", error.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.khelwa-account {
  --dark: #231914;
  --brown: #7a573d;
  --brown-2: #9b7658;

  display: flex;
  flex-direction: column;
  gap: 26px;
  animation: pageIn 0.6s ease both;
}

.account-hero,
.summary-card,
.profile-card,
.side-card {
  position: relative;
  background:
      linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,250,244,0.9)),
      radial-gradient(circle at top right, rgba(122,87,61,0.16), transparent 34%);
  border: 1px solid rgba(122, 87, 61, 0.16);
  box-shadow:
      0 26px 70px rgba(35, 25, 20, 0.12),
      inset 0 1px 0 rgba(255,255,255,0.9);
  overflow: hidden;
  clip-path: polygon(
      0 0,
      calc(100% - 30px) 0,
      100% 30px,
      100% 100%,
      30px 100%,
      0 calc(100% - 30px)
  );
}

.account-hero {
  padding: 46px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 34px;
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

.account-hero h1 {
  margin: 0;
  color: var(--dark);
  font-size: clamp(38px, 5vw, 64px);
  line-height: 0.95;
  letter-spacing: -0.075em;
  font-weight: 950;
}

.account-hero p {
  max-width: 720px;
  margin: 20px 0 0;
  color: rgba(35, 25, 20, 0.68);
  font-size: 16px;
  line-height: 1.8;
  font-weight: 650;
}

.avatar {
  flex-shrink: 0;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  color: white;
  background: linear-gradient(135deg, #2f241d, #7a573d);
  font-size: 44px;
  font-weight: 950;
  clip-path: polygon(
      0 0,
      calc(100% - 22px) 0,
      100% 22px,
      100% 100%,
      22px 100%,
      0 calc(100% - 22px)
  );
  box-shadow: 0 18px 38px rgba(35, 25, 20, 0.24);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.main-btn,
.ghost-btn,
.edit-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  font-weight: 950;
  transition: 0.18s ease;
}

.main-btn,
.ghost-btn,
.edit-btn {
  padding: 14px 20px;
  clip-path: polygon(
      0 0,
      calc(100% - 14px) 0,
      100% 14px,
      100% 100%,
      14px 100%,
      0 calc(100% - 14px)
  );
}

.main-btn,
.edit-btn {
  background: linear-gradient(135deg, #2f241d, #7a573d);
  color: white;
  box-shadow: 0 14px 28px rgba(35,25,20,0.18);
}

.ghost-btn {
  background: rgba(255,255,255,0.78);
  color: var(--dark);
  border: 1px solid rgba(122,87,61,0.16);
}

.main-btn:hover,
.ghost-btn:hover,
.edit-btn:hover,
.action-item:hover {
  transform: translateY(-3px);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.summary-card {
  padding: 24px;
}

.summary-card span,
.detail-item span {
  display: block;
  margin-bottom: 7px;
  color: rgba(35,25,20,0.52);
  font-size: 12px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.summary-card strong,
.detail-item strong {
  color: var(--dark);
  word-break: break-word;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 28px;
  align-items: start;
}

.profile-card,
.side-card {
  padding: 34px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.section-heading h2,
.side-card h2 {
  margin: 0;
  color: var(--dark);
  font-size: clamp(30px, 4vw, 46px);
  line-height: 0.95;
  letter-spacing: -0.07em;
  font-weight: 950;
}

.section-heading p,
.side-card p {
  margin-top: 12px;
  color: rgba(35, 25, 20, 0.68);
  font-weight: 650;
  line-height: 1.7;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-item {
  padding: 22px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(122,87,61,0.1);
  clip-path: polygon(
      0 0,
      calc(100% - 14px) 0,
      100% 14px,
      100% 100%,
      14px 100%,
      0 calc(100% - 14px)
  );
}

.detail-item.full {
  grid-column: 1 / -1;
}

.side-card {
  position: sticky;
  top: 110px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 24px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(122,87,61,0.1);
  color: var(--dark);
  text-decoration: none;
  transition: 0.18s ease;
  clip-path: polygon(
      0 0,
      calc(100% - 14px) 0,
      100% 14px,
      100% 100%,
      14px 100%,
      0 calc(100% - 14px)
  );
}

.action-item.primary {
  background: linear-gradient(135deg, #2f241d, #7a573d);
  color: white;
}

.action-item strong {
  display: block;
  margin-bottom: 4px;
  font-weight: 950;
}

.action-item small {
  color: rgba(35,25,20,0.58);
  font-weight: 700;
}

.action-item.primary small {
  color: rgba(255,255,255,0.76);
}

.action-item b {
  font-size: 22px;
}

.empty-state {
  padding: 24px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(122,87,61,0.1);
  color: rgba(35,25,20,0.68);
  font-weight: 850;
  clip-path: polygon(
      0 0,
      calc(100% - 14px) 0,
      100% 14px,
      100% 100%,
      14px 100%,
      0 calc(100% - 14px)
  );
}

.empty-state a {
  color: var(--brown);
  font-weight: 950;
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1000px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-card {
    position: static;
  }
}

@media (max-width: 780px) {
  .account-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
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
  .account-hero,
  .profile-card,
  .side-card {
    padding: 24px;
  }

  .account-hero h1 {
    font-size: 38px;
  }

  .main-btn,
  .ghost-btn {
    width: 100%;
  }

  .avatar {
    width: 110px;
    height: 110px;
    font-size: 36px;
  }
}
</style>