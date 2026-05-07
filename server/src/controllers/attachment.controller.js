const multer = require('multer');
const { uploadFile, deleteFile } = require('../utils/storage.util');
const prisma = require('../utils/prisma.util');

// Store files in memory before uploading to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, docs, spreadsheets, text files
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// ─── Get Attachments for a Task ──────────────────────────────────────────────

const getAttachments = async (req, res) => {
  try {
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: req.params.taskId },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, attachments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Upload Attachment ────────────────────────────────────────────────────────

const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { taskId } = req.params;

    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Upload to Supabase Storage
    const { url, fileName } = await uploadFile({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      taskId,
    });

    // Save record in DB
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: req.user.id,
        fileName: req.file.originalname,
        fileUrl: url,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    res.status(201).json({ success: true, attachment });
  } catch (error) {
    console.error('[uploadAttachment]', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
};

// ─── Delete Attachment ────────────────────────────────────────────────────────

const deleteAttachment = async (req, res) => {
  try {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: req.params.attachmentId },
    });

    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

    // Only the uploader or project admin can delete
    if (attachment.uploadedById !== req.user.id && req.memberRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this attachment' });
    }

    // Extract storage path from URL (path after bucket name)
    const urlParts = attachment.fileUrl.split('/');
    const bucketIndex = urlParts.findIndex(p => p === (process.env.SUPABASE_STORAGE_BUCKET || 'flow-attachments'));
    const storagePath = urlParts.slice(bucketIndex + 1).join('/');

    await deleteFile(storagePath);
    await prisma.taskAttachment.delete({ where: { id: req.params.attachmentId } });

    res.status(200).json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('[deleteAttachment]', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAttachments, uploadAttachment, deleteAttachment, upload };
