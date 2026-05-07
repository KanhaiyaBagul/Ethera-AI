const prisma = require('../utils/prisma.util');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all projects the user is a member of
    const projectMemberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, role: true }
    });

    const projectIds = projectMemberships.map(pm => pm.projectId);
    const totalProjects = projectIds.length;

    // Fetch all relevant tasks (For ADMIN: all tasks in project, For MEMBER: only assigned tasks)
    // To simplify: we fetch tasks where projectId is in projectIds, AND (user is ADMIN of that project OR assignedTo is user)
    // But since Prisma doesn't support complex OR with aggregations easily, let's fetch raw tasks or use multiple queries.
    
    const adminProjectIds = projectMemberships.filter(pm => pm.role === 'ADMIN').map(pm => pm.projectId);
    const memberProjectIds = projectMemberships.filter(pm => pm.role === 'MEMBER').map(pm => pm.projectId);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { projectId: { in: adminProjectIds } },
          { projectId: { in: memberProjectIds }, assignedToId: userId }
        ]
      },
      include: {
        project: { select: { name: true } }
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    
    const now = new Date();
    const overdueList = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE');
    const overdueTasks = overdueList.length;

    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: completedTasks
    };

    const tasksByPriority = {
      LOW: tasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length
    };

    // Sort for recent tasks
    const recentTasks = [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksByStatus,
        tasksByPriority,
        overdueList,
        recentTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDashboardStats };
