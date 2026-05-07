import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboard.api';
import toast from 'react-hot-toast';
import { Briefcase, CheckCircle2, Clock, ListTodo, ArrowUpRight, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (error) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statusData = [
    { name: 'To Do', value: stats.tasksByStatus.TODO, color: '#E8E8E8' },
    { name: 'In Progress', value: stats.tasksByStatus.IN_PROGRESS, color: '#3B9BE8' },
    { name: 'Done', value: stats.tasksByStatus.DONE, color: '#C8FF00' },
  ];

  const priorityData = [
    { name: 'Low', count: stats.tasksByPriority.LOW },
    { name: 'Medium', count: stats.tasksByPriority.MEDIUM },
    { name: 'High', count: stats.tasksByPriority.HIGH },
  ];

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-text_muted uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-3xl font-heading font-bold text-dark">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-text_muted mt-1 text-sm">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn-primary hidden sm:flex">
          View Projects <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Stat Cards — mixed color style like reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blue card */}
        <div className="stat-card-blue">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Projects</p>
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
          </div>
          <p className="text-4xl font-heading font-bold text-white">{stats.totalProjects}</p>
          <p className="text-white/50 text-xs mt-2">Total projects</p>
        </div>

        {/* White card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text_muted text-xs font-semibold uppercase tracking-wider">Tasks</p>
            <div className="w-8 h-8 bg-background rounded-xl flex items-center justify-center">
              <ListTodo size={16} className="text-primary" />
            </div>
          </div>
          <p className="text-4xl font-heading font-bold text-dark">{stats.totalTasks}</p>
          <p className="text-text_muted text-xs mt-2">Across all projects</p>
        </div>

        {/* Lime card */}
        <div className="stat-card-lime">
          <div className="flex items-center justify-between mb-3">
            <p className="text-dark/60 text-xs font-semibold uppercase tracking-wider">Completed</p>
            <div className="w-8 h-8 bg-dark/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={16} className="text-dark" />
            </div>
          </div>
          <p className="text-4xl font-heading font-bold text-dark">{stats.completedTasks}</p>
          <p className="text-dark/50 text-xs mt-2">{completionRate}% completion rate</p>
        </div>

        {/* Dark card */}
        <div className="stat-card-dark">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Overdue</p>
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
          </div>
          <p className="text-4xl font-heading font-bold text-white">{stats.overdueTasks}</p>
          <p className="text-white/40 text-xs mt-2">Need attention</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Pie Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-text_muted uppercase tracking-widest mb-1">Distribution</p>
              <h2 className="text-lg font-heading font-bold text-dark">Tasks by Status</h2>
            </div>
            <div className="icon-badge">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#E8E8E8',
                    color: '#0D0D0D',
                    borderRadius: '12px',
                    fontSize: '13px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-text_muted">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-text_muted uppercase tracking-widest mb-1">Breakdown</p>
              <h2 className="text-lg font-heading font-bold text-dark">Tasks by Priority</h2>
            </div>
            <div className="icon-badge">
              <ListTodo size={18} />
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} barSize={32}>
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F8F8F8', radius: 8 }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#E8E8E8',
                    color: '#0D0D0D',
                    borderRadius: '12px',
                    fontSize: '13px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#3B9BE8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overdue Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-text_muted uppercase tracking-widest mb-1">Urgent</p>
              <h2 className="text-lg font-heading font-bold text-dark">Overdue Tasks</h2>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-danger bg-danger/10 px-3 py-1.5 rounded-full">
              <Clock size={12} /> {stats.overdueTasks} overdue
            </span>
          </div>

          {stats.overdueList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle2 size={22} className="text-dark" />
              </div>
              <p className="text-sm font-semibold text-dark">All clear!</p>
              <p className="text-xs text-text_muted mt-1">No overdue tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.overdueList.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background hover:bg-border/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">{task.title}</p>
                    <p className="text-xs text-text_muted mt-0.5">{task.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge label={task.priority} type={task.priority} />
                    <span className="text-xs font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-text_muted uppercase tracking-widest mb-1">Latest</p>
              <h2 className="text-lg font-heading font-bold text-dark">Recent Activity</h2>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              See all <ArrowUpRight size={12} />
            </Link>
          </div>

          {stats.recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center mb-3 border border-border">
                <ListTodo size={22} className="text-text_muted" />
              </div>
              <p className="text-sm font-semibold text-dark">No tasks yet</p>
              <p className="text-xs text-text_muted mt-1">Create a project to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background hover:bg-border/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">{task.title}</p>
                    <p className="text-xs text-text_muted mt-0.5">{task.project?.name}</p>
                  </div>
                  <Badge label={task.status.replace('_', ' ')} type={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
