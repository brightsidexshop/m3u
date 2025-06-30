// =============== pages/api/devices/playlist.js ===============
// API route for the web panel to update playlist URLs.
import { withSessionRoute } from '../../../lib/session';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).send({ message: 'Only PUT requests allowed' });
  }
  
  const deviceSession = req.session.device;
  if (!deviceSession) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { playlistUrl, epgUrl } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('m3u-player-db');

    await db.collection('devices').updateOne(
      { _id: new ObjectId(deviceSession.id) },
      { $set: { 
          playlist_url: playlistUrl, 
          epg_url: epgUrl,
          last_updated: new Date()
      }}
    );

    res.status(200).json({ message: 'Playlist updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

