const prisma = require('../utils/prisma.util');
const { createNotification } = require('./notification.controller');

// ─── Get Comments for a Task ──────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('[getComments]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Create a Comment ────────────────────────────────────────────────────────
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ success: false, message: 'Comment content is required' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assignedToId: true, title: true, projectId: true }
    });

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: req.user.id
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // Notify assignee
    if (task && task.assignedToId && task.assignedToId !== req.user.id) {
      await createNotification({
        userId: task.assignedToId,
        type: 'COMMENT',
        title: 'New Comment',
        message: `${req.user.name} commented on "${task.title}"`,
        link: `/projects/${task.projectId}`
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('[createComment]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Delete a Comment ────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Only author or project admin can delete
    if (comment.userId !== req.user.id && req.memberRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await prisma.comment.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('[deleteComment]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getComments, createComment, deleteComment };
