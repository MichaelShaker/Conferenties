<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Wachtwoord vergeten</h1>
      <p>Vul je e-mailadres in. Je ontvangt een reset link.</p>

      <form @submit.prevent="sendResetLink">
        <input
            v-model="email"
            type="email"
            placeholder="E-mailadres"
            required
        />

        <button type="submit" :disabled="loading">
          {{ loading ? "Bezig..." : "Reset link sturen" }}
        </button>
      </form>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>

export default {
  name: "ForgotPasswordView",
  data() {
    return {
      email: "",
      loading: false,
      message: "",
      error: ""
    };
  },
  methods: {
    async sendResetLink() {
      this.loading = true;
      this.message = "";
      this.error = "";

      try {
        const response = await fetch(
            "/api/password/forgot-password",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email: this.email
              })
            }
        );

        const data = await response.json();

        if (!response.ok) {
          this.error = this.formatApiError(data, response.status);
          return;
        }

        this.message = data.message;
      } catch (error) {
        this.error = "Er ging iets mis.\nWat kun je doen: Ververs de pagina en probeer het opnieuw.\nFoutcode: PASSWORD_RESET_REQUEST_ERROR";
      } finally {
        this.loading = false;
      }
    },
    formatApiError(data, status) {
      return [
        data.message || "Er ging iets mis.",
        data.description || "",
        data.action ? `Wat kun je doen: ${data.action}` : "",
        data.code ? `Foutcode: ${data.code}` : `Foutcode: HTTP_${status}`
      ].filter(Boolean).join("\n");
    }
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 24px;
  background:
      radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.12), transparent 35%),
      linear-gradient(135deg, #ffffff, #f8fafc);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 36px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.auth-card h1 {
  margin-bottom: 10px;
  font-size: 1.8rem;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.auth-card p {
  margin-bottom: 22px;
  color: #64748b;
  font-size: 0.95rem;
}

/* FORM */
.auth-card form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* INPUT */
.auth-card input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.95rem;
  transition: 0.2s ease;
}

.auth-card input:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* BUTTON */
.auth-card button {
  margin-top: 6px;
  padding: 14px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  cursor: pointer;
  transition: 0.2s ease;
}

.auth-card button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.28);
}

.auth-card button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* MESSAGES */
.message {
  margin-top: 18px;
  color: #16a34a;
  font-weight: 600;
  white-space: pre-line;
}

.error {
  margin-top: 18px;
  color: #dc2626;
  font-weight: 600;
  white-space: pre-line;
}

/* RESPONSIVE */
@media (max-width: 500px) {
  .auth-card {
    padding: 26px;
    border-radius: 22px;
  }

  .auth-card h1 {
    font-size: 1.5rem;
  }
}
</style>
