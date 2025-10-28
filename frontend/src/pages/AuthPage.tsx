import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') await login(username, password); else await signup(username, password);
      setMessage('Success! Redirecting...');
      setTimeout(() => window.location.href = '/patient', 800);
    } catch (err: any) { setMessage(err.message); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cliqu-Ease</h1>
          <p className="text-gray-600">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition font-semibold">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-indigo-600 hover:text-indigo-700 font-medium">
            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${message.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>
        )}
      </div>
    </div>
  );
}


