const functions = require('firebase-functions');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    const { userId, email, priceId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            customer_email: email,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${req.headers.origin}/?success=true`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
            metadata: { userId }
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET';

    try {
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            await admin.firestore().collection('users').doc(session.metadata.userId).update({
                plan: 'pro',
                subscriptionId: session.subscription,
                customerId: session.customer
            });
        }
        
        res.json({ received: true });
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
