import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Folder, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { globalSearch } from '../../api/search.api';
import Modal from '../ui/Modal';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        handleSearch();
      } else {
        setResults({ projects: [], tasks: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await globalSearch(query);
      if (res.success) {
        setResults(res.results);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text_muted" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Search projects, tasks..."
            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all font-heading"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={20} />}
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {query.length > 2 && !loading && results.projects.length === 0 && results.tasks.length === 0 && (
            <div className="text-center py-10">
              <p className="text-text_muted">No results found for "{query}"</p>
            </div>
          )}

          {results.projects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-text_muted uppercase tracking-widest px-1">Projects</h3>
              <div className="grid grid-cols-1 gap-2">
                {results.projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNavigate(`/projects/${p.id}`)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-surface hover:bg-primary/5 border border-border hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Folder size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-text_primary">{p.name}</p>
                        <p className="text-xs text-text_muted line-clamp-1">{p.description || 'No description'}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-text_muted group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.tasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-text_muted uppercase tracking-widest px-1">Tasks</h3>
              <div className="grid grid-cols-1 gap-2">
                {results.tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleNavigate(`/projects/${t.projectId}`)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-surface hover:bg-primary/5 border border-border hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                        <CheckSquare size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-text_primary">{t.title}</p>
                        <p className="text-[10px] text-text_muted uppercase font-black tracking-tighter">In {t.project.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                        t.priority === 'HIGH' ? 'bg-danger/10 border-danger/20 text-danger' : 
                        t.priority === 'MEDIUM' ? 'bg-warning/10 border-warning/20 text-warning' : 
                        'bg-success/10 border-success/20 text-success'
                      }`}>
                        {t.priority}
                      </span>
                      <ArrowRight size={16} className="text-text_muted group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SearchModal;
