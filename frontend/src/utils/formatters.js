export const formatStage = (stage) => {
  if (!stage) return '';
  const map = {
    REQUIREMENT_SPECIFICATION: 'Requirement Specification',
    BASIC_LAYOUT_PLANNING: 'Layout and Planning',
    TECH_STACK_APPROVAL: 'Tech Stack Approval',
    DEVELOPMENT: 'Development',
    TESTING: 'Testing',
    DEPLOYMENT: 'Deployment',
    MAINTENANCE: 'Maintenance',
    FEATURE_ENHANCEMENTS: 'Feature Enhancements'
  };
  return map[stage] || stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export const formatStatus = (status) => {
  if (!status) return '';
  const map = { ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
  return map[status] || status.replace(/_/g, ' ');
};

export const formatPriority = (priority) => priority ? priority.charAt(0) + priority.slice(1).toLowerCase() : '';
export const formatUserType = (type) => type ? type.replace(/_/g, ' ') : '';
export const formatBugSeverity = (severity) => severity ? severity.charAt(0) + severity.slice(1).toLowerCase() : '';
export const formatBugStatus = (status) => status ? status.replace(/_/g, ' ') : '';
export const formatMaintenanceStatus = (status) => status ? status.replace(/_/g, ' ') : '';
export const formatFeatureStatus = (status) => status ? status.replace(/_/g, ' ') : '';
export const formatSprintStatus = (status) => status ? status.replace(/_/g, ' ') : '';

export const formatTaskStatus = (status) => {
  const map = { NOT_STARTED: 'To Do', IN_PROGRESS: 'In Progress', UNDER_REVIEW: 'In Review', BLOCKED: 'Blocked', COMPLETED: 'Done' };
  return map[status] || status;
};

export const getStatusColor = (status) => {
  const map = {
    ACTIVE: 'bg-green-500 text-white',
    ON_HOLD: 'bg-amber-500 text-white',
    COMPLETED: 'bg-blue-500 text-white',
    CANCELLED: 'bg-red-500 text-white line-through',
  };
  return map[status] || 'bg-slate-200 text-slate-800';
};

export const getPriorityColor = (priority) => {
  const map = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-400 text-slate-900',
    LOW: 'bg-slate-200 text-slate-900',
  };
  return map[priority] || 'bg-slate-100 text-slate-800';
};

export const getStageStatusColor = (status) => {
  const map = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CHANGES_REQUESTED: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-200 text-green-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return 'just now';
};

export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < new Date().getTime();
};
