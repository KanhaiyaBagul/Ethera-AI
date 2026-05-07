import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Zap, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import axios from '../api/axios.config';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const InviteAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, signup, login } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | valid | invalid | accepted
  const [invitation, setInvitation] = useState(null);

  // Form fields for new user signup
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Validate the token on mount
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await axios.get(`/invite/token/${token}`);
        setInvitation(res.data.invitation);
        setStatus('valid');
      } catch (err) {
        setStatus('invalid');
      }
    };
    validate();
  }, [token]);

  // 2. If the user is already logged in when they arrive, accept immediately
  useEffect(() => {
    if (status === 'valid' && user) {
      handleAccept();
    }
  }, [status, user]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`/invite/token/${token}/accept`);
      if (res.data.success) {
        toast.success(`You've joined the project!`);
        navigate(`/projects/${res.data.projectId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
      setSubmitting(false);
    }
  };

  const handleSignupAndAccept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Signup with pre-filled email from invitation
      const signupRes = await signup({ name, email: invitation.email, password });
      if (signupRes.success) {
        // Now accept the invite
        const acceptRes = await axios.post(`/invite/token/${token}/accept`);
        if (acceptRes.data.success) {
          toast.success(`Welcome to Flōw! You've joined ${invitation.projectName}`);
          navigate(`/projects/${acceptRes.data.projectId}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-text_muted text-sm">Validating your invite link...</p>
        </div>
      </div>
    );
  }

  // ── Invalid / Expired ─────────────────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-danger" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-dark mb-2">Invite Not Found</h1>
          <p className="text-text_muted mb-6">This invitation link is invalid, has expired, or has already been used.</p>
          <Link to="/login" className="btn-primary justify-center">Go to Login</Link>
        </div>
      </div>
    );
  }

  // ── Valid: Logged-in user accepting ──────────────────────────────────────────
  if (status === 'valid' && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Loader2 size={28} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-text_muted text-sm">Joining project...</p>
        </div>
      </div>
    );
  }

  // ── Valid: New user needs to sign up ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-dark rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-accent" />
          </div>
          <span className="text-xl font-heading font-bold text-white tracking-tight">Flōw</span>
        </div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 size={28} className="text-dark" />
          </div>
          <h2 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            You've been invited to join
          </h2>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Project</p>
            <p className="text-2xl font-heading font-bold text-white">📁 {invitation?.projectName}</p>
            <p className="text-white/60 text-sm mt-2">You'll join as <strong className="text-white">{invitation?.role}</strong></p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-sm">Already on Flōw?{' '}
            <Link to={`/login?redirect=/invite/${token}`} className="text-white font-semibold hover:underline">Sign in instead</Link>
          </p>
        </div>
      </div>

      {/* Right panel — signup form */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-dark rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-accent" />
            </div>
            <span className="text-xl font-heading font-bold text-dark">Flōw</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <CheckCircle2 size={12} /> Invited to: {invitation?.projectName}
            </div>
            <h1 className="text-3xl font-heading font-bold text-dark">Create your account</h1>
            <p className="text-text_muted mt-1">You'll be added to the project automatically after signing up.</p>
          </div>

          <form onSubmit={handleSignupAndAccept} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Full Name</label>
              <input type="text" className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Email</label>
              <input
                type="email"
                className="input-field bg-background/50 cursor-not-allowed opacity-70"
                value={invitation?.email || ''}
                readOnly
              />
              <p className="text-xs text-text_muted mt-1">This email was used in the invitation and cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text_primary mb-1.5">Password</label>
              <input type="password" className="input-field" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-dark text-white font-semibold py-3.5 px-6 rounded-full transition-all duration-200 hover:bg-dark/80 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Accept & Join Project <span className="bg-accent text-dark rounded-full px-1.5 text-sm">↗</span></>}
            </button>
          </form>

          <p className="text-center mt-6 text-text_muted text-sm">
            Already have an account?{' '}
            <Link to={`/login?redirect=/invite/${token}`} className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
