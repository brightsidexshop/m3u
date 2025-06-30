
// =============== pages/api/devices/register.js ===============
// API route for the TV app to register itself.
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { device_id, access_key, mac_address } = req.body;

  if (!device_id || !access_key) {
    return res.status(400).json({ message: 'Device ID and access key are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('m3u-player-db');

    const existingDevice = await db.collection('devices').findOne({ device_id });
    if (existingDevice) {
      // Device already exists, maybe update the access key or just confirm.
      return res.status(200).json({ message: 'Device already registered' });
    }
    
    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + 1);

    const newDevice = {
      device_id,
      access_key,
      mac_address: mac_address || null,
      subscription: {
        status: 'trial',
        trial_expires_at: trialEndDate,
        purchase_date: null,
        stripe_payment_id: null,
      },
      playlist_url: '',
      epg_url: '',
      createdAt: new Date(),
      last_updated: new Date(),
    };

    await db.collection('devices').insertOne(newDevice);

    res.status(201).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

