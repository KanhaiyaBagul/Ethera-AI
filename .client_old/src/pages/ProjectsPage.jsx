import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject } from '../api/project.api';
import toast from 'react-hot-toast';
import { Plus, Users, LayoutList } from 'lucide-react';
import { format } from 'date-fns';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Project Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      if (res.success) {
        setProjects(res.projects);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createProject({ name, description });
      if (res.success) {
        toast.success('Project created');
        setShowModal(false);
        setName('');
        setDescription('');
        fetchProjects();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading text-text_primary">Projects</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center text-text_muted mb-4">
            <LayoutList size={32} />
          </div>
          <h3 className="text-xl font-heading mb-2">No projects yet</h3>
          <p className="text-text_muted mb-6">Create your first project to start managing tasks.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block group">
              <div className="card p-6 h-full transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-primary/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold font-heading text-text_primary truncate group-hover:text-primary transition-colors">{project.name}</h3>
                </div>
                <p className="text-text_muted text-sm mb-6 line-clamp-2">{project.description || 'No description provided.'}</p>
                
                <div className="flex justify-between items-center text-sm text-text_muted border-t border-border pt-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1" title="Members">
                      <Users size={16} />
                      <span>{project._count?.members || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1" title="Tasks">
                      <LayoutList size={16} />
                      <span>{project._count?.tasks || 0}</span>
                    </div>
                  </div>
                  <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-heading mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text_muted mb-1">Project Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text_muted mb-1">Description (Optional)</label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
