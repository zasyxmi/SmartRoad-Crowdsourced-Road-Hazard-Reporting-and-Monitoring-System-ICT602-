import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ManageReports from '../views/ManageReports.vue'
import ReportDetails from '../views/ReportDetails.vue'
import Login from '../views/Login.vue'
import { currentUser, isAdmin, waitForAuthReady } from '../auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/reports', name: 'reports', component: ManageReports },
    { path: '/reports/:id', name: 'report-details', component: ReportDetails, props: true },
    { path: '/login', name: 'login', component: Login },
  ],
})

router.beforeEach(async (to) => {
  await waitForAuthReady()
  const authorized = currentUser.value && isAdmin.value

  if (to.name !== 'login' && !authorized) {
    return { name: 'login' }
  }
  if (to.name === 'login' && authorized) {
    return { name: 'dashboard' }
  }
})

export default router
