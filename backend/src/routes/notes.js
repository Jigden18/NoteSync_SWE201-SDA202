const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireLecturer, verifyEnrolment } = require('../middleware/auth');
const { sendPush } = require('../services/push');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/notes
router.post('/', authenticate, requireLecturer, async (req, res) => {
  const { moduleId, lectureDate, title, content } = req.body;
  if (!moduleId || !lectureDate || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module || module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const initialContent = content || '';
    const note = await prisma.lectureNote.create({
      data: {
        moduleId,
        lectureDate: new Date(lectureDate),
        title,
        isLocked: false,
      },
    });

    const version = await prisma.noteVersion.create({
      data: {
        noteId: note.id,
        content: initialContent,
        versionNumber: 1,
        savedBy: req.user.id,
      },
    });

    const updatedNote = await prisma.lectureNote.update({
      where: { id: note.id },
      data: { currentVersionId: version.id },
    });

    return res.json({ ...updatedNote, currentVersion: version });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id },
      include: { module: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.module.lecturerId !== req.user.id) {
      const enrolled = await verifyEnrolment(req.user.id, note.moduleId);
      if (!enrolled) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let currentVersion = null;
    if (note.currentVersionId) {
      currentVersion = await prisma.noteVersion.findUnique({
        where: { id: note.currentVersionId },
      });
    }

    return res.json({ ...note, currentVersion });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/notes/:id/base
router.post('/:id/base', authenticate, requireLecturer, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id },
      include: { module: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const uploadStream = (buffer, options) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(buffer);
      });
    };

    const isPdf = req.file.mimetype.includes('pdf');
    const options = {
      resource_type: isPdf ? 'raw' : 'image',
      folder: 'notesync_bases',
    };
    const uploadResult = await uploadStream(req.file.buffer, options);

    const updatedNote = await prisma.lectureNote.update({
      where: { id },
      data: {
        baseFileUrl: uploadResult.secure_url,
        baseFileType: req.file.mimetype,
      },
    });

    return res.json(updatedNote);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notes/:id/lock
router.patch('/:id/lock', authenticate, requireLecturer, async (req, res) => {
  const { id } = req.params;
  const { isLocked } = req.body;
  if (isLocked === undefined) return res.status(400).json({ error: 'isLocked is required' });

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id },
      include: { module: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedNote = await prisma.lectureNote.update({
      where: { id },
      data: { isLocked },
    });

    if (isLocked) {
      const enrolments = await prisma.enrolment.findMany({
        where: { moduleId: note.moduleId },
        include: { student: true },
      });
      const tokens = enrolments
        .map((e) => e.student.expoPushToken)
        .filter(Boolean);
      for (const token of tokens) {
        await sendPush(token, note.title, `${note.title} has been locked`);
      }
    }

    return res.json(updatedNote);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notes/:id
router.patch('/:id', authenticate, requireLecturer, async (req, res) => {
  const { id } = req.params;
  const { title, lectureDate } = req.body;

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id },
      include: { module: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (lectureDate !== undefined) data.lectureDate = new Date(lectureDate);

    const updatedNote = await prisma.lectureNote.update({
      where: { id },
      data,
    });

    return res.json(updatedNote);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/notes/:id/proposals
router.post('/:id/proposals', authenticate, async (req, res) => {
  const noteId = req.params.id;
  const { baseVersionId, proposedContent, summary, originalText, suggestedText } = req.body;
  if (!baseVersionId || !proposedContent || !summary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id: noteId },
      include: { module: { include: { lecturer: true } } },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.isLocked) return res.status(403).json({ error: 'Note is locked' });

    // Optimistic Concurrency check
    if (note.currentVersionId !== baseVersionId) {
      return res.status(409).json({ error: 'conflict' });
    }

    const proposal = await prisma.editProposal.create({
      data: {
        noteId,
        proposedBy: req.user.id,
        baseVersionId,
        proposedContent,
        summary,
        status: 'pending',
        isInline: false,
        originalText: originalText || null,
        suggestedText: suggestedText || null,
      },
      include: { proposer: { select: { id: true, fullName: true } } },
    });

    // Notify all room viewers
    if (req.io) {
      req.io.to(`note:${noteId}`).emit('new_proposal', proposal);
    }

    // Notify Lecturer
    if (note.module.lecturer.expoPushToken) {
      await sendPush(
        note.module.lecturer.expoPushToken,
        'New edit proposed',
        `New edit proposed: ${summary}`
      );
    }

    return res.json(proposal);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/notes/:id/proposals/inline
router.post('/:id/proposals/inline', authenticate, async (req, res) => {
  const noteId = req.params.id;
  const {
    baseVersionId,
    proposedContent,
    summary,
    originalText,
    suggestedText,
    highlightStartOffset,
    highlightEndOffset,
    highlightContextBefore,
    highlightContextAfter,
  } = req.body;

  if (!baseVersionId || !proposedContent || !summary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id: noteId },
      include: { module: { include: { lecturer: true } } },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.isLocked) return res.status(403).json({ error: 'Note is locked' });

    // Optimistic Concurrency check
    if (note.currentVersionId !== baseVersionId) {
      return res.status(409).json({ error: 'conflict' });
    }

    const proposal = await prisma.editProposal.create({
      data: {
        noteId,
        proposedBy: req.user.id,
        baseVersionId,
        proposedContent,
        summary,
        status: 'pending',
        isInline: true,
        originalText,
        suggestedText,
        highlightStartOffset,
        highlightEndOffset,
        highlightContextBefore,
        highlightContextAfter,
      },
      include: { proposer: { select: { id: true, fullName: true } } },
    });

    // Notify all room viewers
    if (req.io) {
      req.io.to(`note:${noteId}`).emit('new_proposal', proposal);
    }

    // Notify Lecturer
    if (note.module.lecturer.expoPushToken) {
      await sendPush(
        note.module.lecturer.expoPushToken,
        'New edit proposed',
        `New edit proposed: ${summary}`
      );
    }

    return res.json(proposal);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/proposals
router.get('/:id/proposals', authenticate, async (req, res) => {
  const noteId = req.params.id;
  try {
    const proposals = await prisma.editProposal.findMany({
      where: { noteId },
      include: {
        proposer: { select: { id: true, fullName: true } },
        baseVersion: { select: { content: true } },
        upvotes: {
          where: { studentId: req.user.id },
          select: { studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const proposalsWithUpvotes = proposals.map((p) => {
      const hasUpvoted = p.upvotes.length > 0;
      delete p.upvotes;
      const originalText = p.originalText ?? p.baseVersion?.content ?? "";
      const suggestedText = p.suggestedText ?? p.proposedContent ?? "";
      const baseVersion = p.baseVersion;
      delete p.baseVersion;
      return { ...p, hasUpvoted, originalText, suggestedText };
    });
    return res.json(proposalsWithUpvotes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/proposals/pending
router.get('/:id/proposals/pending', authenticate, async (req, res) => {
  const noteId = req.params.id;
  try {
    const proposals = await prisma.editProposal.findMany({
      where: { noteId, status: 'pending' },
      include: {
        proposer: { select: { id: true, fullName: true } },
        baseVersion: { select: { content: true } },
        upvotes: {
          where: { studentId: req.user.id },
          select: { studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const proposalsWithUpvotes = proposals.map((p) => {
      const hasUpvoted = p.upvotes.length > 0;
      delete p.upvotes;
      const originalText = p.originalText ?? p.baseVersion?.content ?? "";
      const suggestedText = p.suggestedText ?? p.proposedContent ?? "";
      const baseVersion = p.baseVersion;
      delete p.baseVersion;
      return { ...p, hasUpvoted, originalText, suggestedText };
    });
    return res.json(proposalsWithUpvotes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/versions
router.get('/:id/versions', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const versions = await prisma.noteVersion.findMany({
      where: { noteId: id },
      orderBy: { versionNumber: 'desc' },
      include: { savedByUser: { select: { id: true, fullName: true } } },
    });
    return res.json(versions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/versions/:vid
router.get('/:id/versions/:vid', authenticate, async (req, res) => {
  const { id, vid } = req.params;
  try {
    const version = await prisma.noteVersion.findFirst({
      where: { id: vid, noteId: id },
      include: { savedByUser: { select: { id: true, fullName: true } } },
    });
    if (!version) return res.status(404).json({ error: 'Version not found' });
    return res.json(version);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/notes/:id/annotations (Lecturer only)
router.post('/:id/annotations', authenticate, requireLecturer, async (req, res) => {
  const noteId = req.params.id;
  const { versionId, targetLine, annotationText } = req.body;
  if (!versionId || targetLine === undefined || !annotationText) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id: noteId },
      include: { module: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const annotation = await prisma.noteAnnotation.create({
      data: {
        noteId,
        versionId,
        lecturerId: req.user.id,
        targetLine: parseInt(targetLine),
        annotationText,
      },
    });

    return res.json(annotation);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/annotations
router.get('/:id/annotations', authenticate, async (req, res) => {
  const noteId = req.params.id;
  try {
    const annotations = await prisma.noteAnnotation.findMany({
      where: { noteId },
      include: { lecturer: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(annotations);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/notes/:id/comments
router.post('/:id/comments', authenticate, async (req, res) => {
  const noteId = req.params.id;
  const { content, parentCommentId } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id: noteId },
      include: { module: { include: { lecturer: true } } },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const comment = await prisma.comment.create({
      data: {
        noteId,
        authorId: req.user.id,
        content,
        parentCommentId: parentCommentId || null,
      },
      include: { author: { select: { id: true, fullName: true } } },
    });

    // Notify room viewers
    if (req.io) {
      req.io.to(`note:${noteId}`).emit('new_comment', comment);
    }

    // Notify enrolled students + lecturer
    const enrolledStudents = await prisma.enrolment.findMany({
      where: { moduleId: note.moduleId },
      include: { student: true },
    });

    const tokens = enrolledStudents
      .map((e) => e.student)
      .filter((s) => s.id !== req.user.id && s.expoPushToken)
      .map((s) => s.expoPushToken);

    if (note.module.lecturerId !== req.user.id && note.module.lecturer.expoPushToken) {
      tokens.push(note.module.lecturer.expoPushToken);
    }

    const uniqueTokens = [...new Set(tokens)];
    for (const token of uniqueTokens) {
      await sendPush(token, 'New comment', `New comment on ${note.title}`);
    }

    return res.json(comment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/comments
router.get('/:id/comments', authenticate, async (req, res) => {
  const noteId = req.params.id;
  try {
    const comments = await prisma.comment.findMany({
      where: { noteId },
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(comments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id/pdfs
router.get('/:id/pdfs', authenticate, async (req, res) => {
  const noteId = req.params.id;
  try {
    const pdfs = await prisma.exportedPdf.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
      include: { exporter: { select: { id: true, fullName: true } } },
    });
    return res.json(pdfs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
