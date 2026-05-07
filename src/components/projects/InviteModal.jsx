import { useState, useRef } from 'react';
import { X, Mail, Upload, UserPlus, FileText, CheckCircle2, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';
import Papa from 'papaparse';
import axios from '../../api/axios.config';
import toast from 'react-hot-toast';

const InviteModal = ({ isOpen, projectId, projectName, onClose }) => {
  if (!isOpen) return null;
  const [tab, setTab] = useState('email'); // 'email' | 'csv'

  // Email tab state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [emailLoading, setEmailLoading] = useState(false);

  // CSV tab state
  const [csvRows, setCsvRows] = useState(null); // parsed rows for preview
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSummary, setCsvSummary] = useState(null);
  const fileInputRef = useRef();

  // ── Single Email Invite ──────────────────────────────────────────────────────
  const handleEmailInvite = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await axios.post(`/projects/${projectId}/invite`, { email, role });
      const { result } = res.data;
      if (result.type === 'added') {
        toast.success(`${email} added to project directly`);
      } else if (result.type === 'invited') {
        toast.success(`Invite email sent to ${email}`);
      } else {
        toast(`${email}: ${result.reason}`, { icon: 'ℹ️' });
      }
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── CSV Parse & Preview ──────────────────────────────────────────────────────
  const handleCSVSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.map(row => ({
          email: (row.email || row.Email || '').trim().toLowerCase(),
          name: (row.name || row.Name || '').trim(),
          role: (row.role || row.Role || 'MEMBER').trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        })).filter(r => r.email);
        setCsvRows(rows);
      },
      error: () => toast.error('Failed to parse CSV'),
    });
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvSummary(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await axios.post(`/projects/${projectId}/invite/csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCsvSummary(res.data.summary);
      setCsvRows(null);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV upload failed');
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface rounded-2xl shadow-card-hover w-full max-w-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-heading font-bold text-dark">Invite Members</h2>
            <p className="text-sm text-text_muted mt-0.5">Add people to <strong>{projectName}</strong></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-text_muted hover:text-dark transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 border-b border-border">
          <button
            onClick={() => setTab('email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'email' ? 'bg-dark text-white' : 'bg-background text-text_muted hover:text-dark'
            }`}
          >
            <Mail size={15} /> Email Invite
          </button>
          <button
            onClick={() => setTab('csv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'csv' ? 'bg-dark text-white' : 'bg-background text-text_muted hover:text-dark'
            }`}
          >
            <FileText size={15} /> CSV Bulk Invite
          </button>
        </div>

        <div className="p-6">
          {/* ── Email Tab ── */}
          {tab === 'email' && (
            <form onSubmit={handleEmailInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text_primary mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-text_muted mt-1.5">
                  If they don't have a Flōw account yet, they'll receive an email invitation link.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text_primary mb-1.5">Role</label>
                <select
                  className="input-field"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="MEMBER">Member — Can view & update assigned tasks</option>
                  <option value="ADMIN">Admin — Full access to all tasks & members</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-dark text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-dark/80 transition-all text-sm uppercase tracking-wider"
              >
                {emailLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><UserPlus size={16} /> Send Invite <span className="bg-accent text-dark rounded-full px-1.5 py-0.5 text-xs">↗</span></>
                )}
              </button>
            </form>
          )}

          {/* ── CSV Tab ── */}
          {tab === 'csv' && (
            <div className="space-y-4">
              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Upload size={28} className="mx-auto text-text_muted mb-2" />
                <p className="text-sm font-semibold text-dark">Click to upload CSV</p>
                <p className="text-xs text-text_muted mt-1">Columns: <code className="bg-background px-1 py-0.5 rounded text-xs">email</code>, <code className="bg-background px-1 py-0.5 rounded text-xs">name</code> (optional), <code className="bg-background px-1 py-0.5 rounded text-xs">role</code> (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVSelect}
                />
              </div>

              {/* CSV template download hint */}
              <p className="text-xs text-text_muted text-center">
                Need a template?{' '}
                <button
                  type="button"
                  onClick={() => {
                    const csv = 'email,name,role\njohn@example.com,John Doe,MEMBER\njane@example.com,Jane Smith,ADMIN';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'flow_invite_template.csv';
                    a.click();
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Download template CSV
                </button>
              </p>

              {/* Preview table */}
              {csvRows && csvRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text_muted uppercase tracking-wider mb-2">{csvRows.length} rows detected</p>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border text-sm">
                    <table className="w-full">
                      <thead className="bg-background sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-text_muted">Email</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-text_muted">Name</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-text_muted">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 text-dark truncate max-w-[160px]">{row.email}</td>
                            <td className="px-3 py-2 text-text_muted">{row.name || '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.role === 'ADMIN' ? 'bg-dark text-white' : 'bg-background text-text_muted'}`}>
                                {row.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={handleCSVUpload}
                    disabled={csvLoading}
                    className="w-full mt-3 bg-dark text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-dark/80 transition-all text-sm uppercase tracking-wider"
                  >
                    {csvLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Processing...</>
                    ) : (
                      <><Upload size={16} /> Send {csvRows.length} Invites</>
                    )}
                  </button>
                </div>
              )}

              {/* Summary result */}
              {csvSummary && (
                <div className="space-y-2 bg-background rounded-xl p-4 border border-border">
                  <p className="text-sm font-semibold text-dark mb-3">📋 Invite Summary</p>
                  {csvSummary.addedDirectly.length > 0 && (
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 size={15} />
                      <span><strong>{csvSummary.addedDirectly.length}</strong> added directly (had account)</span>
                    </div>
                  )}
                  {csvSummary.invitesSent.length > 0 && (
                    <div className="flex items-center gap-2 text-primary text-sm">
                      <Mail size={15} />
                      <span><strong>{csvSummary.invitesSent.length}</strong> invite emails sent</span>
                    </div>
                  )}
                  {csvSummary.skipped.length > 0 && (
                    <div className="flex items-center gap-2 text-text_muted text-sm">
                      <ArrowUpRight size={15} />
                      <span><strong>{csvSummary.skipped.length}</strong> skipped (already member or invite pending)</span>
                    </div>
                  )}
                  {csvSummary.errors.length > 0 && (
                    <div className="flex items-center gap-2 text-danger text-sm">
                      <AlertCircle size={15} />
                      <span><strong>{csvSummary.errors.length}</strong> errors (invalid emails)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
