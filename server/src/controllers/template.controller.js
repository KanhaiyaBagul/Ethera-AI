const prisma = require('../utils/prisma.util');

// ─── Save Project as Template ─────────────────────────────────────────────────

const createTemplate = async (req, res) => {
  try {
    const { name, description, projectId } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Template name is required' });

    let tasks = [];

    if (projectId) {
      // Copy task structure from an existing project (no personal data — just shape)
      const projectTasks = await prisma.task.findMany({
        where: { projectId },
        select: { title: true, description: true, priority: true, status: true },
      });
      tasks = projectTasks;
    } else if (req.body.tasks) {
      tasks = req.body.tasks;
    }

    const template = await prisma.projectTemplate.create({
      data: {
        name,
        description,
        createdById: req.user.id,
        tasks,
      },
      include: { createdBy: { select: { name: true } } },
    });

    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('[createTemplate]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── List My Templates ────────────────────────────────────────────────────────

const listTemplates = async (req, res) => {
  try {
    const templates = await prisma.projectTemplate.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Delete Template ──────────────────────────────────────────────────────────

const deleteTemplate = async (req, res) => {
  try {
    const template = await prisma.projectTemplate.findUnique({ where: { id: req.params.id } });

    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    if (template.createdById !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.projectTemplate.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Create Project from Template ────────────────────────────────────────────

const createProjectFromTemplate = async (req, res) => {
  try {
    const { name, description } = req.body;
    const template = await prisma.projectTemplate.findUnique({ where: { id: req.params.templateId } });

    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || template.description,
        createdById: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
    });

    // Create tasks from template
    const tasks = template.tasks;
    if (tasks && tasks.length > 0) {
      await prisma.task.createMany({
        data: tasks.map((t) => ({
          title: t.title,
          description: t.description || null,
          priority: t.priority || 'MEDIUM',
          status: 'TODO', // always reset to TODO on new project
          projectId: project.id,
          createdById: req.user.id,
        })),
      });
    }

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('[createProjectFromTemplate]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createTemplate, listTemplates, deleteTemplate, createProjectFromTemplate };
