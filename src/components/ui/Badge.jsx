const variants = {
  HIGH:        'bg-danger/10 text-danger',
  MEDIUM:      'bg-warning/10 text-warning',
  LOW:         'bg-success/10 text-success',
  TODO:        'bg-border text-text_muted',
  IN_PROGRESS: 'bg-info/10 text-info',
  DONE:        'bg-success/10 text-success',
  ADMIN:       'bg-primary/10 text-primary',
  MEMBER:      'bg-border text-text_muted',
};

const Badge = ({ label, type }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${variants[type] || 'bg-border text-text_muted'}`}>
    {label}
  </span>
);

export default Badge;
