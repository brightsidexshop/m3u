
// =============== pages/api/auth/login.js ===============
// API route to handle web panel login.
import { withSessionRoute } from '../../../lib/session';
import clientPromise from '../../../lib/mongodb';

export default withSessionRoute(async function loginRoute(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { deviceId, accessKey } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('m3u-player-db');
    const device = await db.collection('devices').findOne({
      device_id: deviceId,
      access_key: accessKey,
    });

    if (!device) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session data
    req.session.device = {
      id: device._id.toString(),
      deviceId: device.device_id,
    };
    await req.session.save();

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});