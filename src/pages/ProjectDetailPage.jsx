import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, Settings, Users, Kanban, Trash2, Edit2, ArrowLeft, 
  Search, CheckCircle2, MessageSquare, Paperclip, BarChart3, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { getProjectById, updateProject, deleteProject } from '../api/project.api';
import { getProjectTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '../api/task.api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TaskForm from '../components/tasks/TaskForm';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import MemberManagement from '../components/projects/MemberManagement';
import ProjectAnalytics from '../components/projects/ProjectAnalytics';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];
const COLUMN_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

const SortableTaskCard = ({ task, onClick, isOverdue }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  const completedItems = task.checklists?.filter(c => c.isCompleted).length || 0;
  const totalItems = task.checklists?.length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="card p-4 group hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing border-l-4"
      style={{ ...style, borderLeftColor: task.priority === 'HIGH' ? '#ef4444' : task.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge label={task.priority} type={task.priority} />
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Clock size={12} className="text-text_muted" />
          <span className={`text-[10px] font-bold ${isOverdue ? 'text-danger' : 'text-text_muted'}`}>
            {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}
          </span>
        </div>
      </div>
      
      <h4 className="font-heading font-bold text-text_primary mb-1.5 text-sm line-clamp-2">{task.title}</h4>
      
      {totalItems > 0 && (
        <div className="mt-3 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-text_muted uppercase tracking-wider">Progress</span>
            <span className="text-[10px] font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-1 overflow-hidden">
            <div className="bg-primary h-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-text_muted">
            <MessageSquare size={12} />
            <span className="text-[10px] font-bold">{task._count?.comments || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-text_muted">
            <Paperclip size={12} />
            <span className="text-[10px] font-bold">{task._count?.attachments || 0}</span>
          </div>
        </div>
        <div 
          className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black border border-primary/20 shadow-sm"
          title={task.assignedTo?.name}
        >
          {task.assignedTo?.name?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>
    </div>
  );
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ TODO: [], IN_PROGRESS: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('MEMBER');
  const [activeTab, setActiveTab] = useState('board');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Task modals
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // Project modals
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [projectLoading, setProjectLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeDragTask, setActiveDragTask] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        getProjectById(id),
        getProjectTasks(id),
      ]);
      if (projectRes.success) {
        setProject(projectRes.project);
        setProjectForm({ name: projectRes.project.name, description: projectRes.project.description || '' });
        const memberData = projectRes.project.members.find((m) => m.userId === user.id);
        if (memberData) setUserRole(memberData.role);
      }
      if (tasksRes.success) {
        const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] };
        tasksRes.tasks.forEach((t) => { if (grouped[t.status]) grouped[t.status].push(t); });
        setTasks(grouped);
      }
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id, user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterTasks = (taskList) => {
    return taskList.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  };

  // Sub-component for Droppable Column
  const DroppableColumn = ({ status, tasks, onTaskClick }) => {
    const { setNodeRef, isOver } = useSortable({
      id: status,
      data: { type: 'column', status }
    });

    const filtered = filterTasks(tasks);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'DONE' ? 'bg-success' : status === 'IN_PROGRESS' ? 'bg-warning' : 'bg-primary'}`} />
            <h3 className="font-heading font-black text-text_primary uppercase tracking-widest text-xs">
              {COLUMN_LABELS[status]}
            </h3>
          </div>
          <span className="text-[10px] font-black bg-surface border border-border text-text_muted py-1 px-2.5 rounded-lg shadow-sm">
            {filtered.length}
          </span>
        </div>

        <div 
          ref={setNodeRef}
          className={`bg-surface/30 rounded-2xl p-3 border-2 border-dashed transition-all min-h-[600px] ${
            isOver ? 'border-primary/50 bg-primary/5' : 'border-border/50'
          }`}
        >
          <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 h-full">
              {filtered.map((task) => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={onTaskClick}
                  isOverdue={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    );
  };

  // Task CRUD handlers
  const handleCreateTask = async (data) => {
    setTaskLoading(true);
    try {
      const res = await createTask(id, data);
      if (res.success) {
        toast.success('Task created');
        setShowTaskForm(false);
        setTasks((prev) => ({ ...prev, TODO: [res.task, ...prev.TODO] }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleEditTask = async (data) => {
    setTaskLoading(true);
    try {
      const res = await updateTask(editingTask.id, data);
      if (res.success) {
        toast.success('Task updated');
        setEditingTask(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    setTaskLoading(true);
    try {
      await deleteTask(deletingTask.id);
      toast.success('Task deleted');
      setDeletingTask(null);
      setTasks((prev) => {
        const col = deletingTask.status;
        return { ...prev, [col]: prev[col].filter((t) => t.id !== deletingTask.id) };
      });
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus, currentStatus) => {
    const taskToMove = tasks[currentStatus]?.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;
    
    setTasks((prev) => ({
      ...prev,
      [currentStatus]: prev[currentStatus].filter((t) => t.id !== taskId),
      [newStatus]: [{ ...taskToMove, status: newStatus }, ...prev[newStatus]],
    }));
    
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  // DND handlers
  const onDragStart = (event) => {
    const { active } = event;
    const task = Object.values(tasks).flat().find(t => t.id === active.id);
    setActiveDragTask(task);
  };

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeStatus = Object.keys(tasks).find(status => tasks[status].some(t => t.id === activeId));
    const overStatus = COLUMNS.includes(overId) 
      ? overId 
      : Object.keys(tasks).find(status => tasks[status].some(t => t.id === overId));

    if (!activeStatus || !overStatus || (activeStatus === overStatus && activeId === overId)) {
      setActiveDragTask(null);
      return;
    }

    const taskToMove = tasks[activeStatus].find(t => t.id === activeId);
    
    setTasks(prev => {
      const newTasks = { ...prev };
      newTasks[activeStatus] = newTasks[activeStatus].filter(t => t.id !== activeId);
      
      if (activeStatus === overStatus) {
        const oldIndex = prev[activeStatus].findIndex(t => t.id === activeId);
        const newIndex = prev[activeStatus].findIndex(t => t.id === overId);
        newTasks[activeStatus] = arrayMove(prev[activeStatus], oldIndex, newIndex);
      } else {
        newTasks[overStatus] = [...newTasks[overStatus], { ...taskToMove, status: overStatus }];
      }
      return newTasks;
    });

    if (activeStatus !== overStatus) {
      try {
        await updateTaskStatus(activeId, overStatus);
      } catch {
        toast.error('Sync failed');
        fetchData();
      }
    }
    setActiveDragTask(null);
  };

  // Project CRUD
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setProjectLoading(true);
    try {
      const res = await updateProject(id, projectForm);
      if (res.success) {
        toast.success('Project updated');
        setShowEditProject(false);
        setProject((p) => ({ ...p, ...projectForm }));
      }
    } catch {
      toast.error('Failed to update project');
    } finally {
      setProjectLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    setProjectLoading(true);
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
      setProjectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-text_muted animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  if (!project) return null;

  const members = project.members || [];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-surface rounded-xl text-text_muted transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-heading font-black text-text_primary tracking-tight">{project.name}</h1>
              <Badge label={userRole} type={userRole} />
            </div>
            {project.description && <p className="text-text_muted text-sm mt-1 max-w-xl">{project.description}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-4">
            {members.slice(0, 5).map((m, i) => (
              <div 
                key={m.id} 
                className="w-8 h-8 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-bold text-primary shadow-sm"
                title={m.user?.name}
              >
                {m.user?.name?.charAt(0)}
              </div>
            ))}
          </div>
          {userRole === 'ADMIN' && (
            <div className="flex gap-2">
              <button onClick={() => setShowEditProject(true)} className="p-2 hover:bg-surface rounded-xl text-text_muted transition-all"><Settings size={20} /></button>
              <button onClick={() => setShowDeleteProject(true)} className="p-2 hover:bg-danger/10 rounded-xl text-danger transition-all"><Trash2 size={20} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation & Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 bg-surface p-1 rounded-2xl border border-border shadow-sm">
            {[
              { key: 'board', label: 'Kanban Board', icon: <Kanban size={18} /> },
              { key: 'members', label: 'Team', icon: <Users size={18} /> },
              { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text_muted hover:text-text_primary hover:bg-background'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text_muted" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <select 
              className="bg-surface border border-border rounded-xl py-2.5 px-4 text-sm font-bold text-text_primary outline-none focus:ring-2 focus:ring-primary/10"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            {userRole === 'ADMIN' && (
              <button onClick={() => setShowTaskForm(true)} className="btn-primary py-2.5 px-6 shadow-lg shadow-primary/25">
                <Plus size={18} /> New Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'board' && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COLUMNS.map((status) => (
              <DroppableColumn 
                key={status} 
                status={status} 
                tasks={tasks[status]} 
                onTaskClick={setViewingTask} 
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeDragTask ? (
              <div className="card p-4 border-primary border-2 shadow-2xl scale-105 pointer-events-none rotate-2">
                <Badge label={activeDragTask.priority} type={activeDragTask.priority} />
                <h4 className="font-heading font-bold text-text_primary mt-2">{activeDragTask.title}</h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {activeTab === 'analytics' && <ProjectAnalytics tasks={Object.values(tasks).flat()} members={members} />}

      {activeTab === 'members' && (
        userRole === 'ADMIN' ? (
          <MemberManagement
            projectId={id}
            projectName={project.name}
            members={members}
            currentUserId={user.id}
            onUpdate={fetchData}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">{m.user?.name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-text_primary">{m.user?.name}</p>
                    <p className="text-[10px] text-text_muted uppercase tracking-wider">{m.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      <TaskForm isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} onSubmit={handleCreateTask} members={members} loading={taskLoading} />
      <TaskForm isOpen={!!editingTask} onClose={() => setEditingTask(null)} onSubmit={handleEditTask} members={members} initialData={editingTask} loading={taskLoading} />
      <TaskDetailModal 
        isOpen={!!viewingTask} 
        onClose={() => setViewingTask(null)} 
        task={viewingTask} 
        userRole={userRole} 
        currentUserId={user.id} 
        onEdit={setEditingTask} 
        onDelete={setDeletingTask} 
        onStatusChange={(taskId, newStatus) => handleStatusChange(taskId, newStatus, viewingTask?.status)} 
      />
      <ConfirmDialog isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleDeleteTask} loading={taskLoading} title="Delete Task" message={`Delete "${deletingTask?.title}"?`} />
      
      <Modal isOpen={showEditProject} onClose={() => setShowEditProject(false)} title="Edit Project">
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <input className="input-field" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} placeholder="Project Name" required />
          <textarea className="input-field" value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} placeholder="Description" />
          <button type="submit" className="btn-primary w-full py-3">Save Changes</button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDeleteProject} onClose={() => setShowDeleteProject(false)} onConfirm={handleDeleteProject} loading={projectLoading} title="Delete Project" message={`Delete "${project.name}"?`} />
    </div>
  );
};

export default ProjectDetailPage;
