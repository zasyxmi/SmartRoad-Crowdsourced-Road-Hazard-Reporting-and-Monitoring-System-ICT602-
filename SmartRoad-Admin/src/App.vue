<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { currentUser } from './auth'

const route = useRoute()
const router = useRouter()

async function handleLogout() {
  await signOut(auth)
  router.push('/login')
}
</script>

<template>
  <header v-if="route.name !== 'login'" class="topbar">
    <h1 class="brand">SmartRoad Admin</h1>
    <nav>
      <RouterLink to="/">Dashboard</RouterLink>
      <RouterLink to="/reports">Manage Reports</RouterLink>
    </nav>
    <div class="user-info">
      <span v-if="currentUser">{{ currentUser.email }}</span>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </div>
  </header>

  <main class="content">
    <RouterView />
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #1e293b;
  color: white;
  gap: 1.5rem;
}

.brand {
  font-size: 1.25rem;
  margin: 0;
}

nav {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

nav a {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
}

nav a.router-link-active {
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.logout-btn {
  background: none;
  border: 1px solid #475569;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}

.content {
  padding: 2rem;
}
</style>
