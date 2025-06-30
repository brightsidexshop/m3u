// =============== pages/api/stripe/webhook.js ===============
// Listens for successful payment events from Stripe.
import { buffer } from 'micro';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const dbDeviceId = session.metadata.db_device_id;
    
    if(dbDeviceId) {
        try {
            const client = await clientPromise;
            const db = client.db('m3u-player-db');
            
            await db.collection('devices').updateOne(
                { _id: new ObjectId(dbDeviceId) },
                { $set: { 
                    'subscription.status': 'active',
                    'subscription.purchase_date': new Date(),
                    'subscription.stripe_payment_id': session.payment_intent,
                 }}
            );
        } catch(err) {
            console.error('DB update failed after Stripe payment:', err);
            // Optionally, you could email yourself an alert here
        }
    }
  }

  res.status(200).json({ received: true });
}
