// =============== pages/index.js ===============
// The main login page for the web panel.
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [deviceId, setDeviceId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, accessKey }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Player Web Panel</h1>
        <p className="text-center text-gray-400">
          Enter the credentials displayed on your TV screen.
        </p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-300">
              Device Identifier
            </label>
            <input
              id="deviceId"
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-300">
              Access Key
            </label>
            <input
              id="accessKey"
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-500"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

