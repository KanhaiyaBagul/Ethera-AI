const prisma = require('../utils/prisma.util');
const { createNotification } = require('./notification.controller');

const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedToId } = req.query;
    
    // Check if user is member
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: req.params.id } }
    });

    let whereClause = { projectId: req.params.id };

    // Apply filters
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    
    // Member sees only assigned tasks, Admin sees all
    if (member.role === 'MEMBER') {
      whereClause.assignedToId = req.user.id;
    } else if (assignedToId) {
      whereClause.assignedToId = assignedToId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        checklists: { select: { id: true, isCompleted: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedToId } = req.body;
    const projectId = req.params.id;
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        createdById: req.user.id,
        assignedToId
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify assignee
    if (assignedToId && assignedToId !== req.user.id) {
      await createNotification({
        userId: assignedToId,
        type: 'ASSIGNMENT',
        title: 'New Task Assigned',
        message: `You've been assigned to "${title}"`,
        link: `/projects/${projectId}`
      });
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        checklists: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Verify access
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
    });

    if (!member) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (member.role === 'MEMBER' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedToId } = req.body;
    
    // First find task to get projectId for role check
    const taskData = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!taskData) return res.status(404).json({ success: false, message: 'Task not found' });

    // Check if user is admin of the project
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: taskData.projectId } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can update task details' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedToId
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify new assignee if changed
    if (assignedToId && assignedToId !== taskData.assignedToId && assignedToId !== req.user.id) {
      await createNotification({
        userId: assignedToId,
        type: 'ASSIGNMENT',
        title: 'Task Reassigned',
        message: `You've been assigned to "${task.title}"`,
        link: `/projects/${task.projectId}`
      });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const taskData = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: { title: true, projectId: true, assignedToId: true, createdById: true }
    });
    
    if (!taskData) return res.status(404).json({ success: false, message: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: taskData.projectId } }
    });

    if (!member) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (member.role === 'MEMBER' && taskData.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only assigned member or admin can update status' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskData = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!taskData) return res.status(404).json({ success: false, message: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: taskData.projectId } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can delete tasks' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const exportTasksCSV = async (req, res) => {
  try {
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: req.params.id } }
    });
    if (!member) return res.status(403).json({ success: false, message: 'Not a member of this project' });

    const project = await prisma.project.findUnique({ where: { id: req.params.id }, select: { name: true } });
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.id },
      include: {
        assignedTo: { select: { name: true, email: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV rows
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Assigned Email', 'Created By', 'Created At'];
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      t.assignedTo?.name || '',
      t.assignedTo?.email || '',
      t.createdBy?.name || '',
      new Date(t.createdAt).toISOString().split('T')[0],
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_tasks_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('[exportTasksCSV]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addChecklistItem = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;
    const item = await prisma.checklistItem.create({
      data: { title, taskId }
    });
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, isCompleted } = req.body;
    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: { title, isCompleted }
    });
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await prisma.checklistItem.delete({ where: { id: itemId } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  getTasks, createTask, getTaskById, updateTask, updateTaskStatus, deleteTask, exportTasksCSV,
  addChecklistItem, updateChecklistItem, deleteChecklistItem 
};

