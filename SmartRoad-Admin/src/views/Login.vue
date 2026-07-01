<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ref as dbRef, get } from 'firebase/database'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
    const snap = await get(dbRef(db, `admins/${cred.user.uid}`))
    if (snap.val() !== true) {
      await signOut(auth)
      error.value = 'This account is not authorized as an admin.'
      return
    }
    router.push('/')
  } catch {
    error.value = 'Login failed. Check your email and password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleLogin">
      <h1>SmartRoad Admin</h1>
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="username" />
      </label>
      <label>
        Password
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}

.login-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 320px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-card h1 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
  text-align: center;
}

.login-card label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: #334155;
}

.login-card input {
  padding: 0.5rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.login-card button {
  padding: 0.6rem;
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.login-card button:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}
</style>
