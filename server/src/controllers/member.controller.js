const prisma = require('../utils/prisma.util');

const getMembers = async (req, res) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(200).json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.id } }
    });

    if (existingMember) return res.status(400).json({ success: false, message: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: req.params.id,
        role: role || 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.id } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(200).json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.id } }
    });
    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMembers, addMember, updateMemberRole, removeMember };
