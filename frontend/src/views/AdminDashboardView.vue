<template>
  <main class="admin-dashboard">
    <!-- HERO -->
    <section class="admin-hero">
      <div class="admin-hero__content">
        <p class="eyebrow">Admin dashboard</p>

        <h1>Beheer conferenties zonder ruis.</h1>

        <p>
          Alles wat je hier nodig hebt draait om events aanmaken, aanmeldingen controleren
          en de praktische lijsten klaarzetten.
        </p>
      </div>

      <div class="admin-hero__badge">
        <strong>Admin</strong>
        <span>events en registraties</span>
      </div>
    </section>

    <!-- KPI CARDS -->
    <section class="admin-stats">
      <div class="stat-card">
        <span>Events</span>
        <strong>Beheren</strong>
        <p>Maak nieuwe events aan of pas bestaande events aan.</p>
      </div>

      <div class="stat-card warning">
        <span>Registraties</span>
        <strong>Controleren</strong>
        <p>Bekijk inschrijvingen en controleer betaalbewijzen.</p>
      </div>

      <div class="stat-card success">
        <span>Betalingen</span>
        <strong>Opvolgen</strong>
        <p>Let op openstaande of nog te bevestigen betalingen.</p>
      </div>
    </section>

    <!-- MAIN CONTENT -->
    <section class="admin-content">
      <div class="admin-main">
        <div class="section-heading">
          <p class="eyebrow">Beheer</p>
          <h2>Wat wil je doen?</h2>
          <p>Kies een onderdeel om direct verder te gaan.</p>
        </div>

        <div class="admin-actions">
          <RouterLink to="/admin/events" class="admin-action primary">
            <div>
              <span>01</span>
              <h3>Events beheren</h3>
              <p>Maak events aan, wijzig informatie, stel dagprijzen in en beheer capaciteit.</p>
            </div>

            <b>→</b>
          </RouterLink>

          <RouterLink to="/admin/registrations" class="admin-action">
            <div>
              <span>02</span>
              <h3>Registraties controleren</h3>
              <p>Keur betalingen goed of af en open deelnemerslijsten wanneer je ze nodig hebt.</p>
            </div>

            <b>→</b>
          </RouterLink>

          <RouterLink to="/admin/email-logs" class="admin-action">
            <div>
              <span>03</span>
              <h3>Email geschiedenis</h3>
              <p>Zie welke mails zijn verstuurd en welke eventueel mislukt zijn.</p>
            </div>

            <b>→</b>
          </RouterLink>

          <RouterLink to="/admin/status" class="admin-action">
            <div>
              <span>04</span>
              <h3>Systeemstatus</h3>
              <p>Controleer database, emailconfiguratie, Google Sheets en recente fouten.</p>
            </div>

            <b>→</b>
          </RouterLink>

          <RouterLink to="/admin/audit" class="admin-action">
            <div>
              <span>05</span>
              <h3>Audit log</h3>
              <p>Bekijk wie registraties heeft goedgekeurd, afgewezen of aangepast.</p>
            </div>

            <b>→</b>
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f7f4ee;
  padding-bottom: 80px;
}

/* HERO */
.admin-hero {
  position: relative;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 90px max(4vw, 32px) 70px;
  background:
      linear-gradient(90deg, rgba(9, 17, 34, 0.9), rgba(9, 17, 34, 0.58)),
      url('../assets/home.png') center / cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.admin-hero__content {
  position: relative;
  z-index: 2;
  max-width: 820px;
}

.eyebrow {
  margin-bottom: 14px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.admin-hero h1 {
  margin-bottom: 18px;
  color: #ffffff;
  font-size: clamp(3rem, 6vw, 5.8rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.admin-hero p {
  max-width: 680px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.08rem;
  line-height: 1.8;
}

.admin-hero__badge {
  position: relative;
  z-index: 2;
  width: 155px;
  height: 155px;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.68);
  color: white;
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.22);
}

.admin-hero__badge strong {
  display: block;
  font-size: 2rem;
  line-height: 1;
}

.admin-hero__badge span {
  display: block;
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 0.86rem;
  font-weight: 800;
}

/* STATS */
.admin-stats {
  position: relative;
  z-index: 3;
  width: min(1280px, calc(100% - 56px));
  margin: -42px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.stat-card {
  padding: 24px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.09);
}

.stat-card span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-card strong {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.stat-card p {
  color: #64748b;
  line-height: 1.7;
}

.stat-card.warning {
  border-color: #fed7aa;
  background: #fff7ed;
}

.stat-card.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

/* CONTENT */
.admin-content {
  width: min(1280px, calc(100% - 56px));
  margin: 46px auto 0;
}

.section-heading {
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

.admin-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.admin-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 28px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  text-decoration: none;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
  transition: 0.22s ease;
}

.admin-action:hover {
  transform: translateY(-4px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.11);
}

.admin-action.primary {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.admin-action.primary p,
.admin-action.primary span {
  color: #cbd5e1;
}

.admin-action span {
  display: block;
  margin-bottom: 14px;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.admin-action h3 {
  margin-bottom: 8px;
  font-size: 1.6rem;
  letter-spacing: -0.05em;
}

.admin-action p {
  max-width: 620px;
  color: #64748b;
  line-height: 1.8;
}

.admin-action b {
  font-size: 1.8rem;
}

/* RESPONSIVE */
@media (max-width: 1000px) {
  .admin-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .admin-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-hero__badge {
    width: 100%;
    height: auto;
    min-height: 88px;
    display: flex;
    justify-content: space-between;
    padding: 18px;
    border-radius: 14px;
  }

  .admin-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .admin-hero {
    padding: 70px 24px 58px;
  }

  .admin-hero h1 {
    font-size: 2.55rem;
    letter-spacing: -0.05em;
  }

  .admin-action {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-stats,
  .admin-content {
    width: calc(100% - 28px);
  }
}
</style>
