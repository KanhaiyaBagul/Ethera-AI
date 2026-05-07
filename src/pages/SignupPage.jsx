import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ArrowUpRight, Zap } from 'lucide-react';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signup({ name, email, password });
      if (res.success) {
        toast.success('Account created successfully');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — dark hero */}
      <div className="hidden lg:flex w-1/2 bg-dark flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-dark" />
          </div>
          <span className="text-xl font-heading font-bold text-white tracking-tight">Flōw</span>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-4 py-2 rounded-full border border-white/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Join 1,500+ teams worldwide
          </div>
          <h2 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            Build smarter,<br />
            ship faster together.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Create your free account and bring your whole team into one unified workspace.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {[
            { label: 'AI Strategy', sub: 'Identify opportunities faster' },
            { label: 'Business Consulting', sub: 'Implement the right strategies' },
            { label: 'Data & Insights', sub: 'Power smarter decisions' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-4">
              <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-dark" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-white/40 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Signup form */}
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
            <h1 className="text-3xl font-heading font-bold text-dark">Create your account</h1>
            <p className="text-text_muted mt-2">Start managing tasks with your team today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Email</label>
              <input
                id="signup-email"
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
                id="signup-password"
                type="password"
                className="input-field"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-dark text-white font-semibold py-3.5 px-6 rounded-full transition-all duration-200 hover:bg-dark/80 focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? 'Creating...' : (
                <>Get Started <ArrowUpRight size={16} className="bg-accent text-dark rounded-full p-0.5" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-text_muted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
