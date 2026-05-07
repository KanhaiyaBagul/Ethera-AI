import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ArrowUpRight, Zap } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.success) {
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Sky blue hero */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-dark rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-accent" />
          </div>
          <span className="text-xl font-heading font-bold text-white tracking-tight">Flōw</span>
        </div>

        {/* Hero content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            Manage your team's work,<br />
            smarter and faster.
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Collaborate with your team, track project progress, and hit every deadline with confidence.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['AI Strategy', 'Team Collaboration', 'Real-time Insights'].map((f) => (
              <span key={f} className="flex items-center gap-2 bg-white/10 text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20">
                <span className="w-4 h-4 rounded bg-accent flex items-center justify-center">
                  <Zap size={10} className="text-dark" />
                </span>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stat cards at bottom */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
            <p className="text-3xl font-heading font-bold text-white">520k+</p>
            <p className="text-white/60 text-xs mt-1">Tasks managed monthly</p>
          </div>
          <div className="bg-accent rounded-2xl p-4">
            <p className="text-3xl font-heading font-bold text-dark">100%</p>
            <p className="text-dark/60 text-xs mt-1">Commitment to delivery</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-dark rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-accent" />
            </div>
            <span className="text-xl font-heading font-bold text-dark">Flōw</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-dark">Welcome back</h1>
            <p className="text-text_muted mt-2">Sign in to continue to your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-dark text-white font-semibold py-3.5 px-6 rounded-full transition-all duration-200 hover:bg-dark/80 focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? 'Signing in...' : (
                <>Sign In <ArrowUpRight size={16} className="bg-accent text-dark rounded-full p-0.5" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-text_muted text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
