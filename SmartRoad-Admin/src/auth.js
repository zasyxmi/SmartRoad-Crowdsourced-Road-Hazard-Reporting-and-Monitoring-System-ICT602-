import { ref, watch } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { ref as dbRef, get } from 'firebase/database'
import { auth, db } from './firebase'

export const currentUser = ref(null)
export const isAdmin = ref(false)
const authReady = ref(false)

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user
  if (user) {
    const snap = await get(dbRef(db, `admins/${user.uid}`))
    isAdmin.value = snap.val() === true
  } else {
    isAdmin.value = false
  }
  authReady.value = true
})

export function waitForAuthReady() {
  if (authReady.value) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(authReady, (ready) => {
      if (ready) {
        stop()
        resolve()
      }
    })
  })
}
