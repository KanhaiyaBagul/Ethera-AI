import { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/dashboard.api';
import toast from 'react-hot-toast';
import { Briefcase, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!stats) return null;

  const statusData = [
    { name: 'To Do', value: stats.tasksByStatus.TODO, color: '#94A3B8' },
    { name: 'In Progress', value: stats.tasksByStatus.IN_PROGRESS, color: '#3B82F6' },
    { name: 'Done', value: stats.tasksByStatus.DONE, color: '#10B981' },
  ];

  const priorityData = [
    { name: 'Low', count: stats.tasksByPriority.LOW },
    { name: 'Medium', count: stats.tasksByPriority.MEDIUM },
    { name: 'High', count: stats.tasksByPriority.HIGH },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-text_primary mb-8">Dashboard</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 flex items-center space-x-4 border-l-4 border-l-primary">
          <div className="p-3 rounded-full bg-primary/10 text-primary"><Briefcase size={24} /></div>
          <div>
            <p className="text-text_muted text-sm">Total Projects</p>
            <h3 className="text-2xl font-bold">{stats.totalProjects}</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4 border-l-4 border-l-info">
          <div className="p-3 rounded-full bg-info/10 text-info"><ListTodo size={24} /></div>
          <div>
            <p className="text-text_muted text-sm">Total Tasks</p>
            <h3 className="text-2xl font-bold">{stats.totalTasks}</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4 border-l-4 border-l-success">
          <div className="p-3 rounded-full bg-success/10 text-success"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-text_muted text-sm">Completed Tasks</p>
            <h3 className="text-2xl font-bold">{stats.completedTasks}</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4 border-l-4 border-l-danger">
          <div className="p-3 rounded-full bg-danger/10 text-danger"><Clock size={24} /></div>
          <div>
            <p className="text-text_muted text-sm">Overdue Tasks</p>
            <h3 className="text-2xl font-bold">{stats.overdueTasks}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Status Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-heading mb-6 border-b border-border pb-2">Tasks by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1D2E', borderColor: '#2D3148', color: '#F1F5F9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="text-sm text-text_muted">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-heading mb-6 border-b border-border pb-2">Tasks by Priority</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip cursor={{ fill: '#2D3148' }} contentStyle={{ backgroundColor: '#1A1D2E', borderColor: '#2D3148' }} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
