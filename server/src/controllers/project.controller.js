const prisma = require('../utils/prisma.util');

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: req.user.id }
        }
      },
      include: {
        members: { select: { role: true, userId: true } },
        _count: { select: { tasks: true, members: true } }
      }
    });
    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
          }
        }
      }
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      }
    });
    
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description }
    });
    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    // Delete related tasks and members first due to foreign keys, or rely on cascade
    // In Prisma with SQLite, cascade delete is configured via schema or done manually.
    // Let's manually delete members and tasks to be safe, or just project if cascade works.
    await prisma.task.deleteMany({ where: { projectId: req.params.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: req.params.id } });
    await prisma.project.delete({ where: { id: req.params.id } });
    
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProjects, createProject, getProjectById, updateProject, deleteProject };
