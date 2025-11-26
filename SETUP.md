# Zapmark AI Setup Guide

## Prerequisites

- Node.js 20+ installed
- Firebase project created
- Stripe account created
- Git installed

## 1. Clone and Install

```bash
git clone <repository-url>
cd zapmark
npm install
```

## 2. Firebase Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication (Google and Email/Password providers)
4. Enable Firestore Database
5. Enable Cloud Storage

### Get Firebase Credentials
1. Go to Project Settings → General
2. Copy your web app configuration
3. Add to `.env.local` (use `.env.example` as template)

### Generate Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract `client_email` and `private_key` to `.env.local`

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Initialize Configuration
```bash
npx tsx scripts/init-firestore-config.ts
```

## 3. Stripe Setup

### Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers → API keys
3. Add to `.env.local`

### Create Products
1. Go to Products in Stripe Dashboard
2. Create "Creator Plan" product
   - Name: Creator Plan
   - Price: €5.00/month
   - Recurring: Monthly
   - Copy the Price ID to `.env.local` as `STRIPE_CREATOR_PLAN_PRICE_ID`

3. Create "200 Credits" product
   - Name: 200 Credits
   - Price: €10.00
   - One-time payment
   - Copy Price ID to `.env.local`

4. Create "500 Credits" product
   - Name: 500 Credits
   - Price: €20.00
   - One-time payment
   - Copy Price ID to `.env.local`

### Set Up Webhooks
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `.env.local`

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Test the Application

### Test Trial Flow
1. Go to landing page
2. Click "Try a free grid"
3. Complete onboarding wizard
4. Generate a grid
5. Try locked actions (should show signup gate)

### Test Signup
1. Click a locked action
2. Sign up with Google or email
3. Verify credits are granted
4. Verify action resumes

### Test Stripe (Use Test Mode)
1. Use test card: 4242 4242 4242 4242
2. Any future expiry date
3. Any CVC
4. Subscribe to Creator plan
5. Verify credits are granted
6. Test credit purchase

## 6. Deploy to Production

### Vercel Deployment
```bash
vercel
```

### Environment Variables
Add all `.env.local` variables to Vercel dashboard

### Update Stripe Webhook
Update webhook URL to production domain

### Update Firebase
Deploy rules to production Firebase project

## Troubleshooting

### Firebase Permission Errors
- Ensure Firestore rules are deployed
- Check that user is authenticated
- Verify userId matches in rules

### Stripe Webhook Not Working
- Verify webhook secret is correct
- Check webhook endpoint is accessible
- Review Stripe dashboard for failed events

### Credits Not Deducting
- Check Firestore transactions are working
- Verify credit configuration exists
- Review console for errors

## Next Steps

1. Review the spec at `.kiro/specs/zapmark-product-launch/`
2. Start implementing tasks from `tasks.md`
3. Test each feature thoroughly
4. Monitor errors in console

## Support

For issues, check:
- Firebase Console for database/auth errors
- Stripe Dashboard for payment issues
- Browser console for client errors
- Server logs for API errors
