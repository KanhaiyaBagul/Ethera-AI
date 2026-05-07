import { useState } from 'react';
import { updateProjectMemberRole, removeProjectMember } from '../../api/project.api';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { UserPlus, Trash2, Users as UsersIcon } from 'lucide-react';
import InviteModal from './InviteModal';

const MemberManagement = ({ projectId, projectName, members, currentUserId, onUpdate }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateProjectMemberRole(projectId, userId, newRole);
      toast.success('Role updated');
      onUpdate();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeProjectMember(projectId, removeTarget.userId);
      toast.success('Member removed');
      setRemoveTarget(null);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Header */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <UsersIcon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-text_primary">Project Members</h3>
            <p className="text-sm text-text_muted">Manage roles and invite new collaborators to this workspace.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)} 
          className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} />
          Invite New Members
        </button>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-center text-text_muted py-8 bg-background rounded-xl border border-dashed border-border">
            No members yet.
          </p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  {m.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text_primary">{m.user?.name}</p>
                  <p className="text-xs text-text_muted">{m.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.userId === currentUserId ? (
                  <Badge label={m.role} type={m.role} />
                ) : (
                  <select
                    className="bg-background border border-border text-xs rounded px-2 py-1 text-text_muted outline-none focus:border-primary"
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}
                {m.userId !== currentUserId && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    className="text-text_muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <InviteModal 
        isOpen={showInviteModal} 
        onClose={() => {
          setShowInviteModal(false);
          onUpdate(); 
        }}
        projectId={projectId}
        projectName={projectName}
      />

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        loading={removing}
        title="Remove Member"
        message={`Remove ${removeTarget?.user?.name} from this project?`}
        confirmLabel="Remove"
      />
    </div>
  );
};

export default MemberManagement;
