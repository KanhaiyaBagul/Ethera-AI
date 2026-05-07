const prisma = require('../utils/prisma.util');

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, results: { projects: [], tasks: [] } });

    // Find projects where user is a member
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          { members: { some: { userId: req.user.id } } },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      take: 5
    });

    // Find tasks in projects where user is a member
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          { project: { members: { some: { userId: req.user.id } } } },
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      include: {
        project: { select: { name: true } }
      },
      take: 10
    });

    res.status(200).json({ success: true, results: { projects, tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { globalSearch };
