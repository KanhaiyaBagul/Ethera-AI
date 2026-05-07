import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboard.api';
import { updateTaskStatus } from '../api/task.api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Badge from '../components/ui/Badge';
import { Calendar, Folder } from 'lucide-react';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDashboardStats();
        if (res.success) {
          // Combine recent + overdue into a deduplicated list
          const all = [...res.stats.recentTasks, ...res.stats.overdueList];
          const seen = new Set();
          const unique = all.filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
          setTasks(unique);
        }
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleStatusChange = async (task, newStatus) => {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await updateTaskStatus(task.id, newStatus);
    } catch {
      toast.error('Failed to update status');
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    return true;
  });

  if (loading) return (
    <div className="flex justify-center mt-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-text_primary">My Tasks</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="input-field w-auto"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          className="input-field w-auto"
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text_muted">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
            return (
              <div key={task.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={task.priority} type={task.priority} />
                    <Badge label={task.status.replace('_', ' ')} type={task.status} />
                  </div>
                  <p className="font-medium text-text_primary truncate">{task.title}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {task.project && (
                      <Link
                        to={`/projects/${task.projectId}`}
                        className="flex items-center gap-1 text-xs text-text_muted hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Folder size={12} /> {task.project.name}
                      </Link>
                    )}
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-text_muted'}`}>
                        <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        {isOverdue && ' · Overdue'}
                      </span>
                    )}
                  </div>
                </div>
                <select
                  className="bg-background border border-border text-xs rounded p-1 text-text_muted outline-none focus:border-primary shrink-0"
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
