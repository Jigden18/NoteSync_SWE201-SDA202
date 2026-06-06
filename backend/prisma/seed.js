require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const NOTE_CONTENT_V1 = `<h2 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#0D0D0D">Introduction to React Native</h2>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">React Native is a framework developed by Meta that allows building mobile applications using JavaScript and React. Unlike hybrid apps, React Native compiles to <strong>native platform components</strong>, giving near-native performance.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Core Concepts</h3>
<ul style="margin:0 0 12px;padding-left:20px;color:#0D0D0D;line-height:1.9">
<li><strong>JSX</strong> — describes UI structure, compiled to native calls</li>
<li><strong>StyleSheet</strong> — CSS-like styling using a subset of flexbox</li>
<li><strong>New Architecture (JSI)</strong> — replaces the old bridge with direct JS-to-native bindings for better performance</li>
</ul>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">The core components include <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">View</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Text</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Image</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">ScrollView</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">TextInput</code>. These map directly to platform-native equivalents on iOS and Android.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Expo vs Bare React Native</h3>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">Expo provides a managed workflow that abstracts native build configuration. The Expo SDK includes pre-built native modules for camera, file system, notifications, and more — all accessible without writing any native code. Use <strong>EAS Build</strong> to generate production APK and IPA files for submission.</p>`;

const NOTE_CONTENT_V2 = `<h2 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#0D0D0D">Introduction to React Native</h2>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">React Native is a framework developed by Meta that allows building mobile applications using JavaScript and React. Unlike hybrid apps, React Native compiles to <strong>native platform components</strong>, giving near-native performance without a WebView.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Core Concepts</h3>
<ul style="margin:0 0 12px;padding-left:20px;color:#0D0D0D;line-height:1.9">
<li><strong>JSX</strong> — describes UI structure, compiled to native calls</li>
<li><strong>StyleSheet</strong> — CSS-like styling using a subset of flexbox</li>
<li><strong>New Architecture (JSI)</strong> — replaces the old bridge with direct JS-to-native bindings for better performance</li>
<li><strong>Metro Bundler</strong> — the JavaScript bundler used by React Native</li>
</ul>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">The core components include <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">View</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Text</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Image</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">ScrollView</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">TextInput</code>. These map directly to platform-native equivalents on iOS and Android.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Expo vs Bare React Native</h3>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">Expo provides a managed workflow that abstracts native build configuration. The Expo SDK includes pre-built native modules for camera, file system, notifications, and more — all accessible without writing any native code. Use <strong>EAS Build</strong> to generate production APK and IPA files for submission.</p>`;

const NOTE_CONTENT_V3 = `<h2 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#0D0D0D">Introduction to React Native</h2>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">React Native is a framework developed by Meta that allows building mobile applications using JavaScript and React. Unlike hybrid apps, React Native compiles to <strong>native platform components</strong>, giving near-native performance without a WebView.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Core Concepts</h3>
<ul style="margin:0 0 12px;padding-left:20px;color:#0D0D0D;line-height:1.9">
<li><strong>JSX</strong> — describes UI structure, compiled to native calls</li>
<li><strong>StyleSheet</strong> — CSS-like styling using a subset of flexbox</li>
<li><strong>New Architecture (JSI)</strong> — replaces the old bridge with direct JS-to-native bindings for better performance</li>
<li><strong>Metro Bundler</strong> — the JavaScript bundler used by React Native</li>
</ul>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">The core components include <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">View</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Text</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Image</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">ScrollView</code>, <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">TextInput</code>, and <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">FlatList</code>. These map directly to platform-native equivalents on iOS and Android.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Expo vs Bare React Native</h3>
<p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">Expo provides a managed workflow that abstracts native build configuration. The Expo SDK includes pre-built native modules for camera, file system, notifications, and more — all accessible without writing any native code. Use <strong>EAS Build</strong> to generate production APK and IPA files for submission.</p>
<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#0D0D0D">Key Differences from Web React</h3>
<p style="margin:0;line-height:1.75;color:#0D0D0D">There is no DOM, no CSS, and no HTML. All layout uses flexbox by default. Navigation requires a dedicated library (expo-router or React Navigation). Platform-specific code uses the <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">Platform</code> API or <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">.ios.tsx</code> / <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">.android.tsx</code> file extensions.</p>`;

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.noteAnnotation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.proposalUpvote.deleteMany();
  await prisma.editProposal.deleteMany();
  await prisma.noteVersion.deleteMany();
  await prisma.lectureNote.deleteMany();
  await prisma.enrolment.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const lecturerHash = await bcrypt.hash('Lecturer123', 10);
  const studentHash = await bcrypt.hash('Student123', 10);

  const lecturer = await prisma.user.create({
    data: {
      fullName: 'Dr. Tshering Dorji',
      email: 'tshering@cst.edu.bt',
      role: 'lecturer',
      passwordHash: lecturerHash,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      fullName: 'Karma Wangchuk',
      studentId: 'STU2024001',
      email: 'karma@cst.edu.bt',
      role: 'student',
      passwordHash: studentHash,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      fullName: 'Pema Lhamo',
      studentId: 'STU2024002',
      email: 'pema@cst.edu.bt',
      role: 'student',
      passwordHash: studentHash,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      fullName: 'Dorji Tenzin',
      studentId: 'STU2024003',
      email: 'dorji@cst.edu.bt',
      role: 'student',
      passwordHash: studentHash,
    },
  });

  console.log('Users created');

  // Create modules
  const module1 = await prisma.module.create({
    data: {
      code: 'CS301',
      name: 'Cross-Platform Development',
      enrollCode: 'XPD301',
      lecturerId: lecturer.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      code: 'CS204',
      name: 'Data Structures & Algorithms',
      enrollCode: 'DSA204',
      lecturerId: lecturer.id,
    },
  });

  const module3 = await prisma.module.create({
    data: {
      code: 'CS310',
      name: 'Database Systems',
      enrollCode: 'DBS310',
      lecturerId: lecturer.id,
    },
  });

  console.log('Modules created');

  // Enroll students
  await prisma.enrolment.createMany({
    data: [
      { moduleId: module1.id, studentId: student1.id },
      { moduleId: module1.id, studentId: student2.id },
      { moduleId: module1.id, studentId: student3.id },
      { moduleId: module2.id, studentId: student1.id },
      { moduleId: module2.id, studentId: student2.id },
      { moduleId: module3.id, studentId: student1.id },
    ],
  });

  console.log('Enrolments created');

  // Create notes for module 1
  const note1 = await prisma.lectureNote.create({
    data: {
      moduleId: module1.id,
      title: 'Introduction to React Native',
      lectureDate: new Date('2025-05-12'),
      isLocked: false,
    },
  });

  const note2 = await prisma.lectureNote.create({
    data: {
      moduleId: module1.id,
      title: 'Expo Router & Navigation',
      lectureDate: new Date('2025-05-19'),
      isLocked: true,
    },
  });

  const note3 = await prisma.lectureNote.create({
    data: {
      moduleId: module1.id,
      title: 'State Management with Zustand',
      lectureDate: new Date('2025-05-26'),
      isLocked: false,
    },
  });

  console.log('Notes created');

  // Create versions for note 1
  const version1 = await prisma.noteVersion.create({
    data: {
      noteId: note1.id,
      content: NOTE_CONTENT_V1,
      versionNumber: 1,
      savedBy: lecturer.id,
      savedAt: new Date('2025-05-12T09:00:00Z'),
      isPinned: false,
    },
  });

  const version2 = await prisma.noteVersion.create({
    data: {
      noteId: note1.id,
      content: NOTE_CONTENT_V2,
      versionNumber: 2,
      savedBy: lecturer.id,
      savedAt: new Date('2025-05-13T14:30:00Z'),
      isPinned: false,
    },
  });

  const version3 = await prisma.noteVersion.create({
    data: {
      noteId: note1.id,
      content: NOTE_CONTENT_V3,
      versionNumber: 3,
      savedBy: lecturer.id,
      savedAt: new Date('2025-05-14T10:15:00Z'),
      isPinned: true,
    },
  });

  // Create version for note 2
  const version1b = await prisma.noteVersion.create({
    data: {
      noteId: note2.id,
      content: '<h2 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#0D0D0D">Expo Router &amp; Navigation</h2><p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">Expo Router is a file-based routing system built on top of React Navigation. Every file in the <code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:13px">app/</code> directory automatically becomes a route.</p>',
      versionNumber: 1,
      savedBy: lecturer.id,
      savedAt: new Date('2025-05-19T09:00:00Z'),
      isPinned: false,
    },
  });

  // Create version for note 3
  const version2b = await prisma.noteVersion.create({
    data: {
      noteId: note3.id,
      content: '<h2 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#0D0D0D">State Management with Zustand</h2><p style="margin:0 0 12px;line-height:1.75;color:#0D0D0D">Zustand is a small, fast state management solution for React. It uses hooks and requires minimal boilerplate compared to Redux.</p>',
      versionNumber: 2,
      savedBy: lecturer.id,
      savedAt: new Date('2025-05-26T09:00:00Z'),
      isPinned: false,
    },
  });

  // Update notes with current version IDs
  await prisma.lectureNote.update({
    where: { id: note1.id },
    data: { currentVersionId: version3.id },
  });
  await prisma.lectureNote.update({
    where: { id: note2.id },
    data: { currentVersionId: version1b.id },
  });
  await prisma.lectureNote.update({
    where: { id: note3.id },
    data: { currentVersionId: version2b.id },
  });

  console.log('Versions created');

  // Create proposals for note 1
  await prisma.editProposal.create({
    data: {
      noteId: note1.id,
      proposedBy: student2.id,
      baseVersionId: version3.id,
      proposedContent: NOTE_CONTENT_V3 + '<p>Additional context: Metro Bundler was added to the core concepts list.</p>',
      summary: 'Added Metro Bundler to core concepts list',
      upvoteCount: 14,
      status: 'pending',
      isInline: false,
      createdAt: new Date('2025-05-13T11:00:00Z'),
    },
  });

  await prisma.editProposal.create({
    data: {
      noteId: note1.id,
      proposedBy: student3.id,
      baseVersionId: version3.id,
      proposedContent: NOTE_CONTENT_V3.replace('steady state error', 'steady-state error'),
      summary: 'Fixed hyphenation: steady-state error',
      upvoteCount: 7,
      status: 'pending',
      isInline: true,
      originalText: 'steady state error',
      suggestedText: 'steady-state error',
      createdAt: new Date('2025-05-13T15:30:00Z'),
    },
  });

  await prisma.editProposal.create({
    data: {
      noteId: note1.id,
      proposedBy: student1.id,
      baseVersionId: version2.id,
      proposedContent: NOTE_CONTENT_V3,
      summary: 'Added FlatList to core components',
      upvoteCount: 9,
      status: 'approved',
      reviewedBy: lecturer.id,
      reviewedAt: new Date('2025-05-14T08:00:00Z'),
      isInline: false,
      createdAt: new Date('2025-05-12T16:00:00Z'),
    },
  });

  await prisma.editProposal.create({
    data: {
      noteId: note1.id,
      proposedBy: student1.id,
      baseVersionId: version2.id,
      proposedContent: NOTE_CONTENT_V3.replace('Meta', 'Facebook'),
      summary: 'Changed "Meta" to "Facebook" (incorrect)',
      upvoteCount: 0,
      status: 'rejected',
      reviewedBy: lecturer.id,
      reviewedAt: new Date('2025-05-14T08:30:00Z'),
      rejectionReason: 'Meta is the correct current company name.',
      isInline: true,
      originalText: 'Meta',
      suggestedText: 'Facebook',
      createdAt: new Date('2025-05-12T17:00:00Z'),
    },
  });

  // Create proposal for note 3
  await prisma.editProposal.create({
    data: {
      noteId: note3.id,
      proposedBy: student2.id,
      baseVersionId: version2b.id,
      proposedContent: '<h2>State Management with Zustand</h2><p>Updated content with more detail about Zustand stores.</p>',
      summary: 'Added more detail about Zustand stores',
      upvoteCount: 3,
      status: 'pending',
      isInline: false,
      createdAt: new Date('2025-05-13T09:30:00Z'),
    },
  });

  console.log('Proposals created');

  // Create comments for note 1
  const comment1 = await prisma.comment.create({
    data: {
      noteId: note1.id,
      authorId: student1.id,
      content: 'Can someone clarify the difference between JSI and the old Bridge? The notes mention both but I\'m not sure when JSI was introduced.',
      createdAt: new Date('2025-05-14T09:30:00Z'),
    },
  });

  await prisma.comment.create({
    data: {
      noteId: note1.id,
      authorId: lecturer.id,
      parentCommentId: comment1.id,
      content: 'JSI (JavaScript Interface) was introduced as part of the New Architecture in RN 0.68+. It replaces the async bridge with synchronous direct bindings. We\'ll cover this more in Week 4.',
      createdAt: new Date('2025-05-14T10:00:00Z'),
    },
  });

  await prisma.comment.create({
    data: {
      noteId: note1.id,
      authorId: student2.id,
      content: 'The section on Expo vs Bare RN was really helpful. Should we use Expo Go or a development build for the project?',
      createdAt: new Date('2025-05-14T11:15:00Z'),
    },
  });

  console.log('Comments created');

  // Create annotations for note 1
  await prisma.noteAnnotation.create({
    data: {
      noteId: note1.id,
      versionId: version3.id,
      lecturerId: lecturer.id,
      targetLine: 3,
      annotationText: 'This will be covered in more depth in the Week 3 lecture on the New Architecture.',
      createdAt: new Date('2025-05-14T10:30:00Z'),
    },
  });

  await prisma.noteAnnotation.create({
    data: {
      noteId: note1.id,
      versionId: version3.id,
      lecturerId: lecturer.id,
      targetLine: 8,
      annotationText: 'Remember: StyleSheet.create() gives a small performance benefit by caching the style IDs.',
      createdAt: new Date('2025-05-14T10:35:00Z'),
    },
  });

  console.log('Annotations created');
  console.log('\nSeed complete! Test credentials:');
  console.log('  Lecturer: tshering@cst.edu.bt / Lecturer123');
  console.log('  Student:  STU2024001 / Student123  (Karma Wangchuk)');
  console.log('  Student:  STU2024002 / Student123  (Pema Lhamo)');
  console.log('  Student:  STU2024003 / Student123  (Dorji Tenzin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
