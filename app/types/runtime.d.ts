import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $firebaseApp: FirebaseApp
    $firebaseAuth: Auth
    $firebaseFirestore: Firestore
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $firebaseApp: FirebaseApp
    $firebaseAuth: Auth
    $firebaseFirestore: Firestore
  }
}

export {}
