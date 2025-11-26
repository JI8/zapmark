import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const db = getAdminFirestore();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (!userId) {
                    console.error('No userId in session metadata');
                    break;
                }

                // Handle subscription or one-time payment
                if (session.mode === 'subscription') {
                    const subscriptionId = session.subscription as string;
                    const customerId = session.customer as string;

                    await db.collection('users').doc(userId).set({
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        isPro: true,
                        subscriptionStatus: 'active',
                        // Reset or set monthly tokens - assuming Creator plan gives 100 tokens
                        remainingTokens: 100,
                        lastRefillDate: FieldValue.serverTimestamp(),
                    }, { merge: true });
                } else if (session.mode === 'payment') {
                    // Handle one-time credit purchase
                    const credits = parseInt(session.metadata?.credits || '0');
                    if (credits > 0) {
                        await db.collection('users').doc(userId).update({
                            remainingTokens: FieldValue.increment(credits)
                        });
                    }
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                // Find user by subscription ID
                const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();

                if (snapshot.empty) {
                    console.error('No user found for subscription', subscription.id);
                    break;
                }

                const userDoc = snapshot.docs[0];

                await userDoc.ref.update({
                    subscriptionStatus: subscription.status,
                    isPro: subscription.status === 'active',
                });
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();

                if (snapshot.empty) {
                    console.error('No user found for subscription', subscription.id);
                    break;
                }

                const userDoc = snapshot.docs[0];

                await userDoc.ref.update({
                    subscriptionStatus: 'canceled',
                    isPro: false,
                });
                break;
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
