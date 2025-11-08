import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header />
      <main className="flex-1 flex items-center justify-center px-20 py-10">
        <div id="card" className="flex flex-row bg-container-primary shadow-lg rounded-xl overflow-hidden" style={{ maxWidth: '1200px', width: '100%' }}>
          {/* Left Section - Sign In Form */}
          <div className="flex-1 px-20 py-25">
            <h1 className="mb-2">Sign in</h1>
            <h2 className="text-text-secondary font-normal mb-8">
              Don't have an account?{' '}
              <Link to="/signup" className="text-text-dark underline">
                Sign up
              </Link>
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Please enter your email"
                  className="w-full px-4 py-2 border border-container-stroke rounded-lg bg-background-light text-text-dark"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Please enter your password"
                  className="w-full px-4 py-2 border border-container-stroke rounded-lg bg-background-light text-text-dark"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-text-light py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Or Separator */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-container-stroke"></div>
              <span className="px-4 text-text-dark text-sm">Or</span>
              <div className="flex-1 border-t border-container-stroke"></div>
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-background-light border border-container-stroke rounded-lg py-2 px-4 hover:bg-container-secondary transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-text-dark font-medium">Continue with Google</span>
            </button>
          </div>

          {/* Right Section - Red Block */}
          <div className="w-1/2 bg-primary"></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

