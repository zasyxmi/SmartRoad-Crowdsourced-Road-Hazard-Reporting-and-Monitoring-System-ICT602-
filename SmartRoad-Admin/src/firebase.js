import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAhQn8_XAqc-eAVLqwHv7aiy3pWpkLHBxE',
  authDomain: 'smartroad-1bf13.firebaseapp.com',
  databaseURL: 'https://smartroad-1bf13-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'smartroad-1bf13',
  storageBucket: 'smartroad-1bf13.firebasestorage.app',
  messagingSenderId: '428556923249',
  appId: '1:428556923249:android:a3dc546ed4cbc1570bc6d0',
}

const app = initializeApp(firebaseConfig)

export const db = getDatabase(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
