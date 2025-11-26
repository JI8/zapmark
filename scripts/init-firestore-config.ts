/**
 * Initialize Firestore Configuration
 * 
 * Run this script once to set up the credit configuration in Firestore.
 * Usage: npx tsx scripts/init-firestore-config.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore(app)

async function initializeConfig() {
  console.log('Initializing Firestore configuration...')
  
  const configRef = db.collection('config').doc('credits')
  
  const config = {
    costs: {
      grid3x3: 2,
      grid4x4: 3,
      upscale: 1,
      edit: 1,
      variation: 1,
      variety: 1,
    },
    plans: {
      creator: {
        monthlyCredits: 100,
        price: 5.00,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_CREATOR_PLAN_PRICE_ID || '',
      },
      studio: {
        monthlyCredits: 500,
        price: 20.00,
        currency: 'EUR',
        stripePriceId: '', // Coming soon
        enabled: false,
      },
    },
    creditPacks: [
      {
        credits: 200,
        price: 10.00,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_CREDIT_PACK_200_PRICE_ID || '',
      },
      {
        credits: 500,
        price: 20.00,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_CREDIT_PACK_500_PRICE_ID || '',
      },
    ],
    trial: {
      enabled: true,
      maxGenerations: 1,
    },
    updatedAt: new Date(),
  }
  
  await configRef.set(config)
  
  console.log('✅ Configuration initialized successfully!')
  console.log('Credit costs:', config.costs)
  console.log('Plans:', Object.keys(config.plans))
  console.log('Credit packs:', config.creditPacks.map(p => `${p.credits} credits`))
}

initializeConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error initializing configuration:', error)
    process.exit(1)
  })
