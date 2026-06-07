<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Nieuw wachtwoord</h1>

      <form @submit.prevent="resetPassword">
        <input
            v-model="password"
            type="password"
            placeholder="Nieuw wachtwoord"
            autocomplete="new-password"
        />

        <input
            v-model="confirmPassword"
            type="password"
            placeholder="Herhaal wachtwoord"
            autocomplete="new-password"
        />

        <button type="submit" :disabled="loading">
          {{ loading ? "Bezig..." : "Wachtwoord wijzigen" }}
        </button>
      </form>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ResetPasswordView",
  data() {
    return {
      password: "",
      confirmPassword: "",
      loading: false,
      message: "",
      error: ""
    };
  },
  methods: {
    async resetPassword() {
      this.message = "";
      this.error = "";

      if (!this.password || !this.confirmPassword) {
        this.error = "Vul beide wachtwoordvelden in.";
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.error = "Wachtwoorden komen niet overeen.";
        return;
      }

      this.loading = true;

      try {
        const token = this.$route.params.token;

        const response = await fetch(
            `/api/password/reset-password/${token}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                password: this.password
              })
            }
        );

        const data = await response.json();

        if (!response.ok) {
          this.error = this.formatApiError(data, response.status);
          return;
        }

        this.message = data.message || "Wachtwoord succesvol gewijzigd.";

        setTimeout(() => {
          this.$router.push("/login");
        }, 1500);
      } catch (error) {
        this.error = "Er ging iets mis.\nWat kun je doen: Ververs de pagina en probeer het opnieuw.\nFoutcode: PASSWORD_RESET_SAVE_ERROR";
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
  min-height: calc(100vh - 90px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f8fbff, #eef4ff);
}

.auth-card {
  width: 100%;
  max-width: 430px;
  background: white;
  padding: 35px;
  border-radius: 18px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
}

.auth-card h1 {
  text-align: center;
  margin-bottom: 25px;
  font-size: 28px;
  color: #1f2937;
}

.auth-card form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-card input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.auth-card input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.auth-card button {
  margin-top: 8px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.auth-card button:hover {
  opacity: 0.9;
}

.auth-card button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message,
.error {
  margin-top: 18px;
  text-align: center;
  font-weight: 600;
  white-space: pre-line;
}

.message {
  color: #16a34a;
}

.error {
  color: #dc2626;
}
</style>
