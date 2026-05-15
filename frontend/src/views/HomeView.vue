<template>
  <main class="home-view">

    <!-- HERO -->
    <section class="hero-full">
      <div class="hero-overlay"></div>

      <div class="hero-content">
        <!-- LEFT TEXT -->
        <div class="hero-text">
          <p class="eyebrow light">Conferenties · Events · Community</p>

          <h1>
            Welkom bij<br />
            Conferentie<br />
            Aanmeldingen
          </h1>

          <p class="hero-description">
            Ontdek conferenties, seminars, kerkevents en kampen.
            Meld je eenvoudig aan voor events die bij jou passen.
          </p>

          <div class="hero-actions">
            <RouterLink to="/events" class="hero-btn primary">
              Bekijk events
            </RouterLink>

            <RouterLink to="/register" class="hero-btn secondary">
              Account maken
            </RouterLink>
          </div>
        </div>

        <!-- RIGHT CARD -->
        <div class="hero-info-card">
          <p class="card-label">Aanmelden</p>
          <h3>Snel en overzichtelijk inschrijven</h3>
          <p>
            Maak een account aan, kies een event en beheer je aanmelding eenvoudig online.
          </p>
          <strong>{{ events.length || '2–4' }} events beschikbaar</strong>
        </div>
      </div>
    </section>

    <!-- FEATURED EVENTS -->
    <section class="featured-section">
      <div class="section-intro">
        <p class="eyebrow">Aankomende selectie</p>
        <h2>Events die extra aandacht verdienen.</h2>
        <p>
          Omdat er maar een paar events tegelijk beschikbaar zijn,
          krijgt elk event de ruimte om echt op te vallen.
        </p>
      </div>

      <div v-if="events.length" class="featured-events">
        <EventCard
            v-for="event in events.slice(0, 4)"
            :key="event.id"
            :event="event"
        />
      </div>

      <div v-else class="empty-feature">
        <span>✦</span>
        <h3>Nog geen events beschikbaar</h3>
        <p>Binnenkort verschijnen hier nieuwe conferenties en bijeenkomsten.</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="final-cta">
      <div>
        <p class="eyebrow light">Begin vandaag</p>
        <h2>Mis het volgende bijzondere event niet.</h2>
        <p>
          Maak een account aan en schrijf je in zodra er een event beschikbaar komt
          dat bij jou past.
        </p>
      </div>

      <RouterLink to="/register" class="cta-button">
        Registreren
      </RouterLink>
    </section>

  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchConferences } from '../services/api'
import EventCard from '../components/EventCard.vue'

const events = ref([])

onMounted(async () => {
  try {
    events.value = await fetchConferences()
  } catch (error) {
    console.error('Fout bij ophalen van events:', error)
  }
})
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* HERO */
.hero-full {
  position: relative;
  min-height: calc(100vh - 86px);
  display: flex;
  align-items: center;
  overflow: hidden;
  background-image: url('../assets/home.png');
  background-size: cover;
  background-position: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
      90deg,
      rgba(15, 23, 42, 0.85) 0%,
      rgba(15, 23, 42, 0.65) 45%,
      rgba(15, 23, 42, 0.25) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  width: min(1200px, 92%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 64px;
  align-items: end;
  padding: 110px 0 80px;
}

.hero-text h1 {
  margin-bottom: 26px;
  color: white;
  font-size: clamp(4rem, 8vw, 7rem);
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.hero-description {
  max-width: 600px;
  margin-bottom: 38px;
  color: #e2e8f0;
  font-size: 1.15rem;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 14px;
}

.hero-btn {
  padding: 14px 26px;
  border-radius: 999px;
  font-weight: 900;
}

.hero-btn.primary {
  background: var(--primary);
  color: white;
}

.hero-btn.secondary {
  color: white;
  border: 1px solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.1);
}

.hero-info-card {
  padding: 34px;
  border-radius: 32px;
  color: white;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(18px);
}

.card-label {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  color: #bfdbfe;
  margin-bottom: 12px;
}

.hero-info-card h3 {
  margin-bottom: 12px;
}

.hero-info-card p {
  margin-bottom: 18px;
  color: #dbeafe;
}

/* FEATURED */
.featured-section {
  width: min(1200px, 92%);
  margin: 0 auto;
  padding: 90px 0;
  display: flex;
  flex-direction: column;
  gap: 36px;
  border-top: 1px solid var(--border);
}

.section-intro {
  max-width: 760px;
}

.section-intro .eyebrow {
  margin-bottom: 12px;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.section-intro h2 {
  margin-bottom: 16px;
  color: var(--text);
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.section-intro p:not(.eyebrow) {
  max-width: 620px;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.8;
}

.featured-events {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26px;
}

.empty-feature {
  padding: 72px 32px;
  text-align: center;
  border-radius: 34px;
  background: white;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

/* CTA */
.final-cta {
  width: min(1200px, 92%);
  margin: 0 auto 80px;
  padding: 64px;
  border-radius: 42px;
  color: white;
  background:
      radial-gradient(circle at top right, rgba(96, 165, 250, 0.32), transparent 32%),
      linear-gradient(135deg, #020617, #1d4ed8);
  box-shadow: 0 32px 90px rgba(30, 64, 175, 0.25);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 36px;
}

.final-cta h2 {
  max-width: 720px;
  margin-bottom: 16px;
  font-size: clamp(2.2rem, 4vw, 4.2rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.final-cta p:not(.eyebrow) {
  max-width: 600px;
  color: #dbeafe;
  line-height: 1.8;
}

.cta-button {
  flex-shrink: 0;
  padding: 16px 26px;
  border-radius: 999px;
  background: white;
  color: var(--primary);
  font-weight: 900;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .hero-full {
    min-height: calc(100svh - 132px);
    align-items: flex-start;
  }

  .hero-content {
    grid-template-columns: 1fr;
    padding: 44px 0 64px;
    gap: 34px;
  }

  .hero-text h1 {
    font-size: clamp(2.8rem, 12vw, 4.6rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .hero-description {
    font-size: 1rem;
    line-height: 1.7;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn {
    width: 100%;
    text-align: center;
  }

  .hero-info-card {
    border-radius: 8px;
    padding: 24px;
  }

  .featured-events {
    grid-template-columns: 1fr;
  }

  .final-cta {
    flex-direction: column;
    align-items: flex-start;
    padding: 42px 28px;
  }
}
</style>
