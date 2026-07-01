<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { onValue, ref as dbRef } from 'firebase/database'
import { db } from '../firebase'
import { RouterLink } from 'vue-router'

const users = ref({})
const reports = ref({})
let unsubUsers = null
let unsubReports = null

onMounted(() => {
  unsubUsers = onValue(dbRef(db, 'users'), (snapshot) => {
    users.value = snapshot.val() || {}
  })
  unsubReports = onValue(dbRef(db, 'hazard_reports'), (snapshot) => {
    reports.value = snapshot.val() || {}
  })
})

onUnmounted(() => {
  if (unsubUsers) unsubUsers()
  if (unsubReports) unsubReports()
})

const reportList = computed(() =>
  Object.entries(reports.value)
    .map(([id, r]) => ({ id, ...r, username: users.value[r.uid]?.name || 'Unknown' }))
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')),
)

const totalUsers = computed(() => Object.keys(users.value).length)
const totalReports = computed(() => reportList.value.length)
const openReports = computed(
  () => reportList.value.filter((r) => (r.status || 'New') !== 'Resolved').length,
)
const resolvedReports = computed(
  () => reportList.value.filter((r) => r.status === 'Resolved').length,
)

const recentReports = computed(() => reportList.value.slice(0, 10))

function statusClass(status) {
  if (status === 'Resolved') return 'status-resolved'
  if (status === 'Under Investigation') return 'status-investigating'
  return 'status-new'
}
</script>

<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="cards">
      <div class="card">
        <div class="card-value">{{ totalUsers }}</div>
        <div class="card-label">Total Users</div>
      </div>
      <div class="card">
        <div class="card-value">{{ totalReports }}</div>
        <div class="card-label">Total Reports</div>
      </div>
      <div class="card">
        <div class="card-value">{{ openReports }}</div>
        <div class="card-label">Open</div>
      </div>
      <div class="card">
        <div class="card-value">{{ resolvedReports }}</div>
        <div class="card-label">Resolved</div>
      </div>
    </div>

    <h2>Recent Reports</h2>
    <table class="reports-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Reporter</th>
          <th>Status</th>
          <th>Date/Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="recentReports.length === 0">
          <td colspan="4" class="empty">No reports yet.</td>
        </tr>
        <tr v-for="r in recentReports" :key="r.id">
          <td>
            <RouterLink :to="`/reports/${r.id}`">{{ r.type || '—' }}</RouterLink>
          </td>
          <td>{{ r.username }}</td>
          <td>
            <span class="status-badge" :class="statusClass(r.status)">{{ r.status || 'New' }}</span>
          </td>
          <td>{{ r.timestamp || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.card {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.card-label {
  color: #64748b;
  margin-top: 0.25rem;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th,
.reports-table td {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.reports-table a {
  color: #2563eb;
  text-decoration: none;
}

.empty {
  color: #64748b;
  text-align: center;
}

.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.status-new {
  background: #f44336;
}

.status-investigating {
  background: #ff9800;
}

.status-resolved {
  background: #4caf50;
}
</style>
