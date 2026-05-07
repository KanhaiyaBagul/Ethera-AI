const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const prisma = require('../utils/prisma.util');
const { sendInviteEmail } = require('../utils/email.util');

// ─── Generate Invite Link (no email sent) ────────────────────────────────────

const generateInviteLink = async (req, res) => {
  try {
    const { email, role = 'MEMBER' } = req.body;
    const projectId = req.params.id;

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const emailLower = email.toLowerCase();

    // If user exists in DB → add directly, no link needed
    const existingUser = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existingUser) {
      const alreadyMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: existingUser.id, projectId } },
      });
      if (alreadyMember) return res.status(400).json({ success: false, message: 'User is already a member' });

      await prisma.projectMember.create({
        data: { userId: existingUser.id, projectId, role },
      });
      return res.status(200).json({ success: true, type: 'added', message: `${email} added to project directly (they have an account)` });
    }

    // Create or refresh invitation token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.projectInvitation.upsert({
      where: { projectId_email: { projectId, email: emailLower } },
      update: { token, expiresAt, status: 'PENDING', role },
      create: { projectId, email: emailLower, token, role, expiresAt },
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/invite/${token}`;
    res.status(200).json({ success: true, type: 'link', inviteUrl, expiresAt });
  } catch (error) {
    console.error('[generateInviteLink]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Single Email Invite ─────────────────────────────────────────────────────

const inviteByEmail = async (req, res) => {
  try {
    const { email, role = 'MEMBER' } = req.body;
    const projectId = req.params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const result = await processSingleInvite({ email, role, projectId, projectName: project.name, inviter: req.user });

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('[inviteByEmail]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── CSV Bulk Invite ──────────────────────────────────────────────────────────

const inviteByCSV = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Parse CSV — expects columns: email (required), name (optional), role (optional)
    let rows;
    try {
      rows = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid CSV format. Expected columns: email, name (optional), role (optional)' });
    }

    if (!rows.length) return res.status(400).json({ success: false, message: 'CSV file is empty' });

    const summary = { addedDirectly: [], invitesSent: [], skipped: [], errors: [] };

    for (const row of rows) {
      const email = (row.email || '').trim().toLowerCase();
      const role = (row.role || 'MEMBER').trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MEMBER';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        summary.errors.push({ email: email || '(empty)', reason: 'Invalid email format' });
        continue;
      }

      try {
        const result = await processSingleInvite({
          email, role, projectId,
          projectName: project.name,
          inviter: req.user,
        });

        if (result.type === 'added') summary.addedDirectly.push(email);
        else if (result.type === 'invited') summary.invitesSent.push(email);
        else if (result.type === 'skipped') summary.skipped.push({ email, reason: result.reason });
      } catch (err) {
        summary.errors.push({ email, reason: err.message });
      }
    }

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('[inviteByCSV]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Accept Invitation Token ──────────────────────────────────────────────────

const validateInviteToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: { select: { name: true, id: true } } },
    });

    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found or already used' });
    if (invitation.status !== 'PENDING') return res.status(400).json({ success: false, message: `Invitation is ${invitation.status.toLowerCase()}` });
    if (new Date() > invitation.expiresAt) {
      await prisma.projectInvitation.update({ where: { token }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }

    res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        projectName: invitation.project.name,
        projectId: invitation.project.id,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error('[validateInviteToken]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const acceptInviteToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.projectInvitation.findUnique({ where: { token } });

    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    if (invitation.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Invitation is no longer valid' });
    if (new Date() > invitation.expiresAt) {
      await prisma.projectInvitation.update({ where: { token }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }

    // The authenticated user must match the invitation email
    if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This invitation was sent to a different email address' });
    }

    // Check if already a member
    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: invitation.projectId } },
    });

    if (!existing) {
      await prisma.projectMember.create({
        data: { userId: req.user.id, projectId: invitation.projectId, role: invitation.role },
      });
    }

    // Mark invitation as accepted
    await prisma.projectInvitation.update({ where: { token }, data: { status: 'ACCEPTED' } });

    res.status(200).json({ success: true, projectId: invitation.projectId });
  } catch (error) {
    console.error('[acceptInviteToken]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get Pending Invitations for a Project ────────────────────────────────────

const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await prisma.projectInvitation.findMany({
      where: { projectId: req.params.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Revoke Invitation ────────────────────────────────────────────────────────

const revokeInvitation = async (req, res) => {
  try {
    await prisma.projectInvitation.delete({ where: { id: req.params.inviteId } });
    res.status(200).json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Shared Helper ────────────────────────────────────────────────────────────

async function processSingleInvite({ email, role, projectId, projectName, inviter }) {
  email = email.toLowerCase();

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    // Already a member?
    const alreadyMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: existingUser.id, projectId } },
    });
    if (alreadyMember) return { type: 'skipped', reason: 'Already a member' };

    // Add directly
    await prisma.projectMember.create({
      data: { userId: existingUser.id, projectId, role },
    });
    return { type: 'added', email };
  }

  // Check for existing pending invite
  const existingInvite = await prisma.projectInvitation.findUnique({
    where: { projectId_email: { projectId, email } },
  });
  if (existingInvite && existingInvite.status === 'PENDING') {
    return { type: 'skipped', reason: 'Invite already sent' };
  }

  // Create invitation token
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.projectInvitation.upsert({
    where: { projectId_email: { projectId, email } },
    update: { token, expiresAt, status: 'PENDING', role },
    create: { projectId, email, token, role, expiresAt },
  });

  // Send email
  const inviteUrl = `${process.env.FRONTEND_URL}/invite/${token}`;
  await sendInviteEmail({
    to: email,
    inviterName: inviter.name,
    projectName,
    inviteUrl,
  });

  return { type: 'invited', email };
}

module.exports = {
  generateInviteLink,
  inviteByEmail,
  inviteByCSV,
  validateInviteToken,
  acceptInviteToken,
  getPendingInvitations,
  revokeInvitation,
};
