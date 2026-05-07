const prisma = require('../utils/prisma.util');

const roleMiddleware = (...roles) => {
  return async (req, res, next) => {
    // Expects projectId in req.params.id (or req.params.projectId)
    const projectId = req.params.id || req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required for role check' });
    }

    try {
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: projectId,
          },
        },
      });

      if (!projectMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this project' });
      }

      if (roles.length && !roles.includes(projectMember.role)) {
        return res.status(403).json({ success: false, message: `Role ${projectMember.role} is not authorized to perform this action` });
      }

      // Attach member role to request for later use if needed
      req.memberRole = projectMember.role;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error during role check' });
    }
  };
};

module.exports = roleMiddleware;
