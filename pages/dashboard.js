// =============== pages/dashboard.js ===============
// The user's dashboard for managing their subscription and playlists.
import { useState } from 'react';
import { withSessionSsr } from '../lib/session';
import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export default function Dashboard({ device }) {
  const [playlistUrl, setPlaylistUrl] = useState(device.playlist_url || '');
  const [epgUrl, setEpgUrl] = useState(device.epg_url || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/devices/playlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl, epgUrl }),
      });
      
      const data = await res.json();
      if(res.ok) {
          setMessage('URLs updated successfully!');
      } else {
          setMessage(data.message || 'Failed to update URLs.');
      }

    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
        });
        const { url } = await res.json();
        window.location.href = url;
    } catch(err) {
        setMessage('Could not initiate payment. Please try again.');
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {/* Subscription Panel */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">
                Your player status is: 
                <span className={`font-bold ml-2 px-3 py-1 rounded-full text-sm ${
                    device.subscription.status === 'active' ? 'bg-green-500 text-white' : 
                    device.subscription.status === 'trial' ? 'bg-yellow-500 text-black' :
                    'bg-red-500 text-white'
                }`}>
                    {device.subscription.status.toUpperCase()}
                </span>
              </p>
              {device.subscription.status === 'trial' && (
                <p className="text-gray-400 mt-1">Expires on: {new Date(device.subscription.trial_expires_at).toLocaleDateString()}</p>
              )}
            </div>
            {(device.subscription.status === 'trial' || device.subscription.status === 'expired') && (
                <button 
                  onClick={handlePayment} 
                  disabled={loading}
                  className="px-6 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500"
                >
                    {loading ? 'Processing...' : 'Buy Lifetime Player'}
                </button>
            )}
          </div>
        </div>

        {/* Playlist Management Panel */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Playlist Management</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="playlistUrl" className="block text-sm font-medium text-gray-300">
                M3U Playlist URL
              </label>
              <input
                id="playlistUrl"
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="epgUrl" className="block text-sm font-medium text-gray-300">
                EPG (XMLTV) URL <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="epgUrl"
                type="url"
                value={epgUrl}
                onChange={(e) => setEpgUrl(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
             {message && <p className="text-green-400 text-sm text-center">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-500"
            >
              {loading ? 'Saving...' : 'Save Playlist Configuration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Fetch device data on the server side before rendering the page.
export const getServerSideProps = withSessionSsr(async function ({ req, res }) {
  const deviceSession = req.session.device;

  if (!deviceSession) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  const client = await clientPromise;
  const db = client.db('m3u-player-db'); // Use your DB name
  const device = await db.collection('devices').findOne({
    _id: new ObjectId(deviceSession.id)
  });

  if (!device) {
    req.session.destroy();
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // Convert MongoDB specific types to JSON serializable types
  const serializableDevice = JSON.parse(JSON.stringify(device));

  return {
    props: { device: serializableDevice },
  };
});

