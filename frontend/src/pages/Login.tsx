import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome to Steno Draft');
        navigate('/');
      } else {
        if (!name) {
          toast.error('Please provide your full name');
          setLoading(false);
          return;
        }
        await register(email, password, name);
        toast.success('Account created successfully. Welcome to Steno Draft!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-steno-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-heading font-bold text-steno-navy mb-2">
            Steno Draft
          </h1>
          <p className="text-center text-sm text-steno-teal font-medium mb-4">
            Generate demand letters in minutes, not hours.
          </p>
          <h2 className="mt-6 text-center text-2xl font-heading font-semibold text-steno-charcoal">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-steno-charcoal-light">
            {isLogin 
              ? 'Access your firm\'s demand letter workspace'
              : 'Join your firm\'s AI-powered demand letter platform'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-steno-gray-300 placeholder-steno-gray-400 text-steno-charcoal rounded-t-md focus:outline-none focus:ring-steno-teal focus:border-steno-teal focus:z-10 sm:text-sm"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-steno-gray-300 placeholder-steno-gray-400 text-steno-charcoal ${
                  !isLogin ? '' : 'rounded-t-md'
                } focus:outline-none focus:ring-steno-teal focus:border-steno-teal focus:z-10 sm:text-sm`}
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-steno-gray-300 placeholder-steno-gray-400 text-steno-charcoal rounded-b-md focus:outline-none focus:ring-steno-teal focus:border-steno-teal focus:z-10 sm:text-sm"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-steno-navy hover:bg-steno-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steno-teal disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-sm text-steno-teal hover:text-steno-teal-dark font-medium"
            >
              {isLogin
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

