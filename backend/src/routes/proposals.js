const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireLecturer } = require('../middleware/auth');
const { sendPush } = require('../services/push');

// GET /api/proposals/pending — all pending proposals across lecturer's modules
router.get('/pending', authenticate, requireLecturer, async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      where: { lecturerId: req.user.id },
      include: { notes: { select: { id: true } } },
    });
    const noteIds = modules.flatMap((m) => m.notes.map((n) => n.id));

    const proposals = await prisma.editProposal.findMany({
      where: { noteId: { in: noteIds }, status: 'pending' },
      include: {
        proposer: { select: { id: true, fullName: true } },
        note: {
          select: {
            id: true,
            title: true,
            module: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: [{ upvoteCount: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json(proposals);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/proposals/:id/approve (Lecturer only)
router.patch('/:id/approve', authenticate, requireLecturer, async (req, res) => {
  const proposalId = req.params.id;
  try {
    const proposal = await prisma.editProposal.findUnique({
      where: { id: proposalId },
      include: { note: true },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'pending') {
      return res.status(400).json({ error: 'Proposal is already processed' });
    }

    const noteId = proposal.noteId;

    let newVersion = null;
    await prisma.$transaction(async (tx) => {
      const latest = await tx.noteVersion.aggregate({
        where: { noteId },
        _max: { versionNumber: true },
      });
      newVersion = await tx.noteVersion.create({
        data: {
          noteId,
          content: proposal.proposedContent,
          versionNumber: (latest._max.versionNumber ?? 0) + 1,
          savedBy: req.user.id,
        },
      });
      await tx.lectureNote.update({
        where: { id: noteId },
        data: { currentVersionId: newVersion.id },
      });
      await tx.editProposal.update({
        where: { id: proposalId },
        data: {
          status: 'approved',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      });
    });

    // Notify proposer
    const proposer = await prisma.user.findUnique({ where: { id: proposal.proposedBy } });
    if (proposer && proposer.expoPushToken) {
      await sendPush(
        proposer.expoPushToken,
        'Proposal Approved',
        `Your edit to ${proposal.note.title} was approved ✓`
      );
    }

    return res.json({ success: true, version: newVersion });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/proposals/:id/reject (Lecturer only)
router.patch('/:id/reject', authenticate, requireLecturer, async (req, res) => {
  const proposalId = req.params.id;
  const { rejectionReason } = req.body;

  try {
    const proposal = await prisma.editProposal.findUnique({
      where: { id: proposalId },
      include: { note: true },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'pending') {
      return res.status(400).json({ error: 'Proposal is already processed' });
    }

    const updatedProposal = await prisma.editProposal.update({
      where: { id: proposalId },
      data: {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    // Orphan linked images
    await prisma.noteImage.updateMany({
      where: { proposalId },
      data: { isOrphaned: true },
    });

    // Notify proposer
    const proposer = await prisma.user.findUnique({ where: { id: proposal.proposedBy } });
    if (proposer && proposer.expoPushToken) {
      await sendPush(
        proposer.expoPushToken,
        'Proposal Rejected',
        `Your edit to ${proposal.note.title} was not approved: ${rejectionReason || 'No reason provided'}`
      );
    }

    return res.json(updatedProposal);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/proposals/:id/upvote
router.post('/:id/upvote', authenticate, async (req, res) => {
  const proposalId = req.params.id;
  try {
    await prisma.proposalUpvote.create({
      data: {
        proposalId,
        studentId: req.user.id,
      },
    });

    const proposal = await prisma.editProposal.update({
      where: { id: proposalId },
      data: {
        upvoteCount: { increment: 1 },
      },
    });

    return res.json(proposal);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Already upvoted' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/proposals/:id/upvote
router.delete('/:id/upvote', authenticate, async (req, res) => {
  const proposalId = req.params.id;
  try {
    await prisma.proposalUpvote.delete({
      where: {
        proposalId_studentId: {
          proposalId,
          studentId: req.user.id,
        },
      },
    });

    const proposal = await prisma.editProposal.update({
      where: { id: proposalId },
      data: {
        upvoteCount: { decrement: 1 },
      },
    });

    return res.json(proposal);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(400).json({ error: 'Upvote not found' });
    }
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
