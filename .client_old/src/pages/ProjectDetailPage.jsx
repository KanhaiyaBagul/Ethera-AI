import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../api/project.api';
import { getProjectTasks, updateTaskStatus } from '../api/task.api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ TODO: [], IN_PROGRESS: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('MEMBER');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          getProjectById(id),
          getProjectTasks(id)
        ]);

        if (projectRes.success) {
          setProject(projectRes.project);
          const memberData = projectRes.project.members.find(m => m.userId === user.id);
          if (memberData) setUserRole(memberData.role);
        }

        if (tasksRes.success) {
          // Group tasks
          const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] };
          tasksRes.tasks.forEach(t => {
            if (grouped[t.status]) grouped[t.status].push(t);
          });
          setTasks(grouped);
        }
      } catch (error) {
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
  }, [id, user.id]);

  const handleStatusChange = async (taskId, newStatus, currentStatus) => {
    try {
      // Optimistic update
      const taskToMove = tasks[currentStatus].find(t => t.id === taskId);
      setTasks(prev => ({
        ...prev,
        [currentStatus]: prev[currentStatus].filter(t => t.id !== taskId),
        [newStatus]: [{ ...taskToMove, status: newStatus }, ...prev[newStatus]]
      }));

      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      toast.error('Failed to update status');
      // Revert in real app
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-heading text-text_primary">{project.name}</h1>
          <p className="text-text_muted mt-1">{project.description}</p>
        </div>
        <div className="flex space-x-2">
          {userRole === 'ADMIN' && (
            <button className="btn-primary">Add Task</button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
          <div key={status} className="bg-surface/50 rounded-xl p-4 border border-border h-[calc(100vh-250px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-heading font-bold text-text_primary">
                {status.replace('_', ' ')}
              </h3>
              <span className="bg-background text-text_muted text-xs py-1 px-2 rounded-full border border-border">
                {tasks[status].length}
              </span>
            </div>

            <div className="space-y-3">
              {tasks[status].map((task) => (
                <div key={task.id} className="card p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      task.priority === 'HIGH' ? 'bg-danger/10 text-danger' : 
                      task.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' : 
                      'bg-success/10 text-success'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="font-medium text-text_primary mb-1">{task.title}</h4>
                  <p className="text-xs text-text_muted line-clamp-2 mb-3">{task.description}</p>
                  
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold" title={task.assignedTo?.name || 'Unassigned'}>
                      {task.assignedTo?.name?.charAt(0) || '?'}
                    </div>
                    <select 
                      className="bg-background border border-border text-xs rounded p-1 text-text_muted outline-none focus:border-primary"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value, task.status)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
