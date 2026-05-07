import { useState, useEffect, useRef } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { 
  Calendar, User, Folder, Trash2, Edit2, Paperclip, 
  File, Image, FileText, Download, Loader2, X, MessageSquare, Send, CheckSquare, Plus, Trash 
} from 'lucide-react';
import { getTaskAttachments, uploadTaskAttachment, deleteTaskAttachment } from '../../api/attachment.api';
import { getTaskComments, createComment, deleteComment } from '../../api/comment.api';
import { addChecklistItem, updateChecklistItem, deleteChecklistItem } from '../../api/checklist.api';
import { getTaskById } from '../../api/task.api';
import toast from 'react-hot-toast';

const TaskDetailModal = ({ isOpen, onClose, task: initialTask, userRole, currentUserId, onEdit, onDelete, onStatusChange }) => {
  const [task, setTask] = useState(initialTask);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const fileInputRef = useRef();
  const commentsEndRef = useRef();

  useEffect(() => {
    if (isOpen && initialTask?.id) {
      setTask(initialTask);
      fetchFullTaskDetails();
      fetchAttachments();
      fetchComments();
    }
  }, [isOpen, initialTask?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFullTaskDetails = async () => {
    try {
      const res = await getTaskById(initialTask.id);
      if (res.success) {
        setTask(res.task);
        setChecklists(res.task.checklists || []);
      }
    } catch {
      toast.error('Failed to load task details');
    }
  };

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const res = await getTaskAttachments(initialTask.id);
      if (res.success) setAttachments(res.attachments);
    } catch {
      toast.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await getTaskComments(initialTask.id);
      if (res.success) setComments(res.comments);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadTaskAttachment(task.id, file);
      if (res.success) {
        setAttachments([res.attachment, ...attachments]);
        toast.success('File uploaded');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (id) => {
    try {
      await deleteTaskAttachment(id);
      setAttachments(attachments.filter(a => a.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await createComment(task.id, newComment);
      if (res.success) {
        setComments([...comments, res.comment]);
        setNewComment('');
      }
    } catch {
      toast.error('Failed to post');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(id);
      setComments(comments.filter(c => c.id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      const res = await addChecklistItem(task.id, newItem);
      if (res.success) {
        setChecklists([...checklists, res.item]);
        setNewItem('');
      }
    } catch {
      toast.error('Failed to add item');
    }
  };

  const toggleChecklist = async (id, isCompleted) => {
    try {
      const res = await updateChecklistItem(id, { isCompleted: !isCompleted });
      if (res.success) {
        setChecklists(checklists.map(c => c.id === id ? res.item : c));
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteCheckItem = async (id) => {
    try {
      await deleteChecklistItem(id);
      setChecklists(checklists.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  const completedItems = checklists.filter(c => c.isCompleted).length;
  const progressPercent = checklists.length > 0 ? Math.round((completedItems / checklists.length) * 100) : 0;

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image size={16} />;
    if (mimeType?.includes('pdf') || mimeType?.includes('word')) return <FileText size={16} />;
    return <File size={16} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" maxWidth="max-w-3xl">
      <div className="flex h-[80vh]">
        {/* Left Section: Info & Checklists */}
        <div className="flex-1 overflow-y-auto pr-6 border-r border-border space-y-6 custom-scrollbar">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-heading font-bold text-text_primary leading-tight">{task.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge label={task.priority} type={task.priority} />
              <Badge label={task.status.replace('_', ' ')} type={task.status} />
            </div>
          </div>

          {task.description && (
            <div className="bg-background/50 p-4 rounded-xl border border-border">
              <p className="text-text_muted text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text_muted uppercase tracking-wider">Assigned To</label>
              <div className="flex items-center gap-2 text-sm text-text_primary">
                <User size={14} className="text-primary" />
                <span className="font-medium">{task.assignedTo?.name || 'Unassigned'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text_muted uppercase tracking-wider">Due Date</label>
              <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-danger font-bold' : 'text-text_primary'}`}>
                <Calendar size={14} />
                <span className="font-medium">{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}</span>
              </div>
            </div>
          </div>

          {/* Checklist Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-sm font-bold text-text_primary uppercase tracking-tight">
                <CheckSquare size={14} className="text-primary" />
                Subtasks ({completedItems}/{checklists.length})
              </label>
              <span className="text-xs font-bold text-primary">{progressPercent}%</span>
            </div>
            
            <div className="w-full bg-border rounded-full h-1.5 mb-6 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            <div className="space-y-2 mb-4">
              {checklists.map((c) => (
                <div key={c.id} className="group flex items-center gap-3 p-2 hover:bg-background rounded-lg transition-colors">
                  <input 
                    type="checkbox" 
                    checked={c.isCompleted} 
                    onChange={() => toggleChecklist(c.id, c.isCompleted)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className={`text-sm flex-1 ${c.isCompleted ? 'text-text_muted line-through' : 'text-text_primary'}`}>
                    {c.title}
                  </span>
                  <button onClick={() => deleteCheckItem(c.id)} className="opacity-0 group-hover:opacity-100 text-text_muted hover:text-danger transition-all">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="relative">
              <input 
                type="text" 
                placeholder="Add a subtask..." 
                value={newItem} 
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 pl-3 pr-10 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <button type="submit" className="absolute right-2 top-1.5 p-1 text-primary hover:bg-primary/10 rounded-lg">
                <Plus size={18} />
              </button>
            </form>
          </div>

          {/* Attachments */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-text_primary uppercase tracking-tight">
                <Paperclip size={14} className="text-primary" />
                Files ({attachments.length})
              </label>
              <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-primary hover:underline">Upload</button>
              <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="group flex items-center justify-between p-2 rounded-lg border border-border hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded bg-background flex items-center justify-center text-text_muted shrink-0">{getFileIcon(a.mimeType)}</div>
                    <p className="text-[11px] font-medium text-text_primary truncate">{a.fileName}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-text_muted hover:text-primary"><Download size={13} /></a>
                    <button onClick={() => handleDeleteAttachment(a.id)} className="p-1 text-text_muted hover:text-danger"><Trash size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 pb-6 border-t border-border">
            <label className="block text-xs font-bold text-text_muted uppercase tracking-wider mb-2">Change Status</label>
            <select
              className="input-field py-2 text-sm"
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value)}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            
            {userRole === 'ADMIN' && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => { onClose(); onEdit(task); }} className="btn-secondary flex-1 py-2 text-xs"><Edit2 size={12} /> Edit Details</button>
                <button onClick={() => { onClose(); onDelete(task); }} className="btn-danger flex-1 py-2 text-xs"><Trash2 size={12} /> Delete Task</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Discussion */}
        <div className="w-[340px] flex flex-col pl-6">
          <label className="flex items-center gap-2 text-sm font-bold text-text_primary uppercase tracking-tight mb-4">
            <MessageSquare size={14} className="text-primary" />
            Discussion
          </label>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {commentsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary/30" /></div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 bg-background/50 rounded-2xl border border-dashed border-border">
                <p className="text-xs text-text_muted px-6">No comments yet. Start the conversation!</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="space-y-1 group">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-text_primary">{c.user.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text_muted">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      {c.user.id === currentUserId && (
                        <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-text_muted hover:text-danger transition-all">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-background border border-border p-3 rounded-2xl rounded-tl-none text-xs text-text_primary leading-relaxed shadow-sm group-hover:border-primary/20 transition-colors">
                    {c.content}
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          <form onSubmit={handlePostComment} className="relative mt-auto">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Post a comment..."
              className="w-full bg-background border border-border rounded-2xl p-4 pr-12 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-24 shadow-sm"
            />
            <button
              type="submit"
              disabled={postingComment || !newComment.trim()}
              className="absolute bottom-4 right-4 p-2 bg-dark text-white rounded-xl hover:bg-primary transition-all disabled:opacity-50"
            >
              {postingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
