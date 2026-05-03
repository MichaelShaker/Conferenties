<template>
  <main class="admin-dashboard">
    <!-- HERO -->
    <section class="admin-hero">
      <div class="admin-hero__content">
        <p class="eyebrow">Admin dashboard</p>

        <h1>Beheer events, registraties en betalingen.</h1>

        <p>
          Hier krijg je snel overzicht over wat belangrijk is: nieuwe aanmeldingen,
          openstaande betalingen en acties die aandacht nodig hebben.
        </p>
      </div>

      <div class="admin-hero__badge">
        <strong>Admin</strong>
        <span>beheeromgeving</span>
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
              <p>
                Voeg events toe, wijzig informatie, stel prijzen in en beheer capaciteit.
              </p>
            </div>

            <b>→</b>
          </RouterLink>

          <RouterLink to="/admin/registrations" class="admin-action">
            <div>
              <span>02</span>
              <h3>Registraties beheren</h3>
              <p>
                Bekijk aanmeldingen, controleer betalingen en werk registratiestatussen bij.
              </p>
            </div>

            <b>→</b>
          </RouterLink>
        </div>
      </div>

      <aside class="admin-sidebar">
        <h2>Admin aandachtspunten</h2>

        <div class="check-list">
          <div>
            <strong>Controleer nieuwe registraties</strong>
            <p>Kijk regelmatig of er nieuwe aanmeldingen zijn binnengekomen.</p>
          </div>

          <div>
            <strong>Betaalbewijzen nakijken</strong>
            <p>Bevestig alleen registraties wanneer de betaling klopt.</p>
          </div>

          <div>
            <strong>Capaciteit bewaken</strong>
            <p>Controleer of events niet over hun maximum aantal deelnemers gaan.</p>
          </div>

          <div>
            <strong>Eventinformatie actueel houden</strong>
            <p>Zorg dat datum, locatie, prijs en instructies duidelijk zijn.</p>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f8fafc;
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
      radial-gradient(circle at 86% 16%, rgba(37, 99, 235, 0.18), transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 52%, #eef4ff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.admin-hero::after {
  content: "";
  position: absolute;
  right: -120px;
  bottom: -150px;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
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
  color: #0f172a;
  font-size: clamp(3rem, 6vw, 5.8rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.admin-hero p {
  max-width: 680px;
  color: #64748b;
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
  border-radius: 36px;
  background: #0f172a;
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
  width: min(1180px, 92%);
  margin: -42px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.stat-card {
  padding: 24px;
  border-radius: 24px;
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
  width: min(1180px, 92%);
  margin: 46px auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 34px;
  align-items: start;
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
  gap: 18px;
}

.admin-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 28px;
  border-radius: 28px;
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

/* SIDEBAR */
.admin-sidebar {
  position: sticky;
  top: 110px;
  padding: 28px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.admin-sidebar h2 {
  margin-bottom: 20px;
  color: #0f172a;
  font-size: 1.45rem;
  letter-spacing: -0.04em;
}

.check-list {
  display: grid;
  gap: 16px;
}

.check-list div {
  padding-left: 16px;
  border-left: 3px solid #2563eb;
}

.check-list strong {
  display: block;
  margin-bottom: 4px;
  color: #0f172a;
}

.check-list p {
  color: #64748b;
  line-height: 1.7;
}

/* RESPONSIVE */
@media (max-width: 1000px) {
  .admin-content {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: static;
  }
}

@media (max-width: 780px) {
  .admin-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-hero__badge {
    width: 125px;
    height: 125px;
    border-radius: 30px;
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
    font-size: 3rem;
  }

  .admin-action {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>