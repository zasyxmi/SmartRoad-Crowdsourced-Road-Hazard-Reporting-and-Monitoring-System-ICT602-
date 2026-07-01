<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { onValue, ref as dbRef, remove, set, increment } from 'firebase/database'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { RouterLink } from 'vue-router'
import PhotoModal from '../components/PhotoModal.vue'

const HAZARD_TYPES = ['Pothole', 'Flood', 'Accident', 'Fallen Tree', 'Traffic Light']
const STATUS_OPTIONS = ['New', 'Under Investigation', 'Resolved']

const lightboxUrl = ref(null)

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

const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterDate = ref('')

const reportList = computed(() =>
  Object.entries(reports.value)
    .map(([id, r]) => ({ id, ...r, username: users.value[r.uid]?.name || 'Unknown' }))
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')),
)

const filteredReports = computed(() =>
  reportList.value.filter((r) => {
    if (filterType.value && r.type !== filterType.value) return false
    if (filterStatus.value && (r.status || 'New') !== filterStatus.value) return false
    if (filterDate.value && !(r.timestamp || '').startsWith(filterDate.value)) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      const haystack = `${r.type || ''} ${r.description || ''} ${r.username || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  }),
)

function statusClass(status) {
  if (status === 'Resolved') return 'status-resolved'
  if (status === 'Under Investigation') return 'status-investigating'
  return 'status-new'
}

const updatingId = ref(null)

async function updateStatus(report, newStatus) {
  if (newStatus === report.status) return
  updatingId.value = report.id
  try {
    await set(dbRef(db, `hazard_reports/${report.id}/status`), newStatus)
    const wasResolved = report.status === 'Resolved'
    const isResolved = newStatus === 'Resolved'
    if (wasResolved !== isResolved && report.uid) {
      await set(
        dbRef(db, `users/${report.uid}/resolvedReports`),
        increment(isResolved ? 1 : -1),
      )
    }
  } catch (e) {
    alert(`Failed to update status: ${e.message}`)
  } finally {
    updatingId.value = null
  }
}

async function deleteReport(report) {
  if (!confirm(`Delete this ${report.type} report? This cannot be undone.`)) return
  try {
    if (report.photoUrl) {
      try {
        await deleteObject(storageRef(storage, report.photoUrl))
      } catch (e) {
        if (e.code !== 'storage/object-not-found') throw e
      }
    }
    await remove(dbRef(db, `hazard_reports/${report.id}`))
    if (report.uid) {
      await set(dbRef(db, `users/${report.uid}/totalReports`), increment(-1))
      if (report.status === 'Resolved') {
        await set(dbRef(db, `users/${report.uid}/resolvedReports`), increment(-1))
      }
    }
  } catch (e) {
    alert(`Failed to delete report: ${e.message}`)
  }
}
</script>

<template>
  <div>
    <h1>Manage Reports</h1>

    <div class="filters">
      <input v-model="search" type="text" placeholder="Search type, description, reporter…" />
      <select v-model="filterType">
        <option value="">All types</option>
        <option v-for="t in HAZARD_TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filterStatus">
        <option value="">All statuses</option>
        <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="filterDate" type="date" />
    </div>

    <div class="table-wrap">
      <table class="reports-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Type</th>
            <th>Description</th>
            <th>Reporter</th>
            <th>GPS</th>
            <th>Date/Time</th>
            <th>User-Agent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredReports.length === 0">
            <td colspan="9" class="empty">No reports match.</td>
          </tr>
          <tr v-for="r in filteredReports" :key="r.id">
            <td>
              <button v-if="r.photoUrl" class="thumb-btn" @click="lightboxUrl = r.photoUrl">
                <img :src="r.photoUrl" class="thumb" alt="" />
              </button>
              <span v-else>—</span>
            </td>
            <td>{{ r.type || '—' }}</td>
            <td class="description">{{ r.description || '—' }}</td>
            <td>{{ r.username }}</td>
            <td>{{ r.latitude?.toFixed(6) }}, {{ r.longitude?.toFixed(6) }}</td>
            <td>{{ r.timestamp || '—' }}</td>
            <td>{{ r.userAgent || '—' }}</td>
            <td>
              <select
                :value="r.status || 'New'"
                :disabled="updatingId === r.id"
                :class="['status-select', statusClass(r.status)]"
                @change="updateStatus(r, $event.target.value)"
              >
                <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
              </select>
            </td>
            <td class="actions">
              <RouterLink :to="`/reports/${r.id}`">View</RouterLink>
              <button class="link-btn danger" @click="deleteReport(r)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PhotoModal v-if="lightboxUrl" :src="lightboxUrl" @close="lightboxUrl = null" />
  </div>
</template>

<style scoped>
.thumb-btn {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  display: block;
}

.filters {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0 1.5rem;
  flex-wrap: wrap;
}

.filters input,
.filters select {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.filters input[type='text'] {
  flex: 1;
  min-width: 220px;
}

.table-wrap {
  overflow-x: auto;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.reports-table th,
.reports-table td {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.description {
  max-width: 240px;
  white-space: normal;
}

.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}

.empty {
  color: #64748b;
  text-align: center;
}

.status-select {
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  border: none;
  color: white;
  font-weight: 600;
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

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.actions a {
  color: #2563eb;
  text-decoration: none;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

.link-btn.danger {
  color: #dc2626;
}
</style>
