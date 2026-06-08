const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireLecturer, verifyEnrolment } = require('../middleware/auth');

// Create module (lecturer only)
router.post('/', authenticate, requireLecturer, async (req, res) => {
  const { code, name, enrollCode } = req.body;
  if (!code || !name || !enrollCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const module = await prisma.module.create({
      data: {
        code,
        name,
        enrollCode,
        lecturerId: req.user.id,
      },
    });
    return res.json(module);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Enroll code already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// Get modules
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'lecturer') {
      const modules = await prisma.module.findMany({
        where: { lecturerId: req.user.id },
        include: {
          lecturer: { select: { fullName: true } },
          _count: { select: { enrolments: true, notes: true } },
        },
      });
      return res.json(modules.map((m) => ({
        ...m,
        lecturerName: m.lecturer.fullName,
        studentCount: m._count.enrolments,
        lectureCount: m._count.notes,
      })));
    } else {
      const enrolments = await prisma.enrolment.findMany({
        where: { studentId: req.user.id },
        include: {
          module: {
            include: {
              lecturer: { select: { fullName: true } },
              _count: { select: { enrolments: true, notes: true } },
            },
          },
        },
      });
      return res.json(enrolments.map((e) => ({
        ...e.module,
        lecturerName: e.module.lecturer.fullName,
        studentCount: e.module._count.enrolments,
        lectureCount: e.module._count.notes,
      })));
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Enroll in module (student)
router.post('/enrol', authenticate, async (req, res) => {
  const { enrollCode } = req.body;
  if (!enrollCode) {
    return res.status(400).json({ error: 'Enroll code required' });
  }
  try {
    const module = await prisma.module.findUnique({
      where: { enrollCode },
    });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    await prisma.enrolment.create({
      data: {
        moduleId: module.id,
        studentId: req.user.id,
      },
    });
    return res.json({ success: true, module });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Already enrolled in this module' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// Get single module details
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const module = await prisma.module.findUnique({
      where: { id },
      include: { lecturer: { select: { id: true, fullName: true, email: true } } },
    });
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (module.lecturerId !== req.user.id) {
      const enrolled = await prisma.enrolment.findUnique({
        where: {
          moduleId_studentId: {
            moduleId: id,
            studentId: req.user.id,
          },
        },
      });
      if (!enrolled) {
        return res.status(403).json({ error: 'Access denied. You are not enrolled in this module.' });
      }
    }

    return res.json(module);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get enrolled students (lecturer only)
router.get('/:id/students', authenticate, requireLecturer, async (req, res) => {
  const { id } = req.params;
  try {
    const module = await prisma.module.findUnique({ where: { id } });
    if (!module || module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const enrolments = await prisma.enrolment.findMany({
      where: { moduleId: id },
      include: { student: { select: { id: true, fullName: true, email: true, studentId: true } } },
    });
    return res.json(enrolments.map((e) => e.student));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Remove student from module (lecturer only)
router.delete('/:id/students/:uid', authenticate, requireLecturer, async (req, res) => {
  const { id, uid } = req.params;
  try {
    const module = await prisma.module.findUnique({ where: { id } });
    if (!module || module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.enrolment.delete({
      where: {
        moduleId_studentId: {
          moduleId: id,
          studentId: uid,
        },
      },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all notes for module
router.get('/:id/notes', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const module = await prisma.module.findUnique({ where: { id } });
    if (!module) return res.status(404).json({ error: 'Module not found' });

    if (module.lecturerId !== req.user.id) {
      const enrolled = await verifyEnrolment(req.user.id, id);
      if (!enrolled) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const notes = await prisma.lectureNote.findMany({
      where: { moduleId: id },
      orderBy: { lectureDate: 'desc' },
      include: {
        versions: { select: { id: true, versionNumber: true } },
        _count: { select: { proposals: { where: { status: 'pending' } } } },
      },
    });

    return res.json(notes.map((n) => {
      const currentVersion = n.currentVersionId
        ? n.versions.find((v) => v.id === n.currentVersionId)
        : null;
      return {
        id: n.id,
        moduleId: n.moduleId,
        title: n.title,
        lectureDate: n.lectureDate,
        currentVersionId: n.currentVersionId,
        currentVersionNumber: currentVersion ? currentVersion.versionNumber : 1,
        isLocked: n.isLocked,
        pendingProposalCount: n._count.proposals,
      };
    }));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/modules/:id/search?q=
router.get('/:id/search', authenticate, async (req, res) => {
  const { id } = req.params;
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  try {
    const results = await prisma.$queryRaw`
      SELECT ln.id, ln.title, ln.lecture_date as "lectureDate", nv.version_number as "versionNumber",
        ts_headline('english', regexp_replace(nv.content,'<[^>]+>',' ','g'),
          plainto_tsquery('english', ${q}), 'MaxWords=20,MinWords=10') AS snippet
      FROM note_versions nv
      JOIN lecture_notes ln ON ln.current_version_id = nv.id
      WHERE to_tsvector('english', regexp_replace(nv.content,'<[^>]+>',' ','g')) @@ plainto_tsquery('english', ${q}) AND ln.module_id = ${id}::uuid
      ORDER BY ln.lecture_date DESC
    `;
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
