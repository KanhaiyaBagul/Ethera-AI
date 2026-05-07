import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const ProjectAnalytics = ({ tasks, members }) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'DONE').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    highPriority: tasks.filter(t => t.priority === 'HIGH').length,
  };

  const statusData = [
    { name: 'To Do', value: stats.todo },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Done', value: stats.completed },
  ];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'HIGH').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'MEDIUM').length },
    { name: 'Low', value: tasks.filter(t => t.priority === 'LOW').length },
  ];

  // Workload by member
  const memberWorkload = members.map(m => ({
    name: m.user?.name || 'Unknown',
    tasks: tasks.filter(t => t.assignedToId === m.userId).length,
    completed: tasks.filter(t => t.assignedToId === m.userId && t.status === 'DONE').length,
  }));

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: stats.total, icon: <TrendingUp className="text-primary" />, color: 'bg-primary/10' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="text-success" />, color: 'bg-success/10' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: <TrendingUp className="text-warning" />, color: 'bg-warning/10' },
          { label: 'High Priority', value: stats.highPriority, icon: <AlertCircle className="text-danger" />, color: 'bg-danger/10' },
        ].map((s, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-text_muted uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className="text-3xl font-heading font-black text-text_primary">{s.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-heading font-bold text-text_primary mb-8">Task Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-bold text-text_muted">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-heading font-bold text-text_primary mb-8">Priority Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'High' ? '#ef4444' : entry.name === 'Medium' ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Member Workload */}
      <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
        <h3 className="text-lg font-heading font-bold text-text_primary mb-8">Team Workload & Completion</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={memberWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }} />
              <Bar dataKey="tasks" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} name="Total Tasks" />
              <Bar dataKey="completed" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
