// =============== pages/api/devices/me.js ===============
// API route for the TV app to fetch its details.
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  const deviceId = req.headers['x-device-id'];

  if (!deviceId) {
    return res.status(401).json({ message: 'Device ID header missing' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('m3u-player-db');
    const device = await db.collection('devices').findOne({ device_id: deviceId });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Check for expired trial
    if (device.subscription.status === 'trial' && new Date() > new Date(device.subscription.trial_expires_at)) {
        // Update status to expired
        await db.collection('devices').updateOne(
            { _id: device._id },
            { $set: { 'subscription.status': 'expired' } }
        );
        device.subscription.status = 'expired'; // Reflect change in response
    }

    // Return only necessary fields
    const responseData = {
        device_id: device.device_id,
        subscription: device.subscription,
        playlist_url: device.playlist_url,
        epg_url: device.epg_url
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

