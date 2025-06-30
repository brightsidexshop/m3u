// =============== pages/api/stripe/create-checkout-session.js ===============
import { withSessionRoute } from '../../../lib/session';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }
  
  const deviceSession = req.session.device;
  if (!deviceSession) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'M3U TV Player - Lifetime License',
              description: `Lifetime player license for device: ${deviceSession.deviceId}`,
            },
            unit_amount: 1000, // Example: $10.00 (in cents)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_canceled=true`,
      metadata: {
          // Pass the internal device DB ID to the webhook
          db_device_id: deviceSession.id,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
