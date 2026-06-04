export interface Student {
  id: string;
  fullName: string;
  studentId: string;
  role: "student";
  avatarColor: string;
}

export interface Lecturer {
  id: string;
  fullName: string;
  email: string;
  role: "lecturer";
  avatarColor: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  lecturerName: string;
  enrollCode: string;
  studentCount: number;
  lectureCount: number;
}

export interface Note {
  id: string;
  moduleId: string;
  title: string;
  lectureDate: string;
  currentVersionId: string;
  currentVersionNumber: number;
  isLocked: boolean;
  pendingProposalCount: number;
}

export interface Version {
  id: string;
  noteId: string;
  content: string;
  versionNumber: number;
  savedBy: string;
  savedAt: string;
  isPinned: boolean;
}

export interface Proposal {
  id: string;
  noteId: string;
  proposedBy: string;
  summary: string;
  upvoteCount: number;
  hasUpvoted: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  isInline: boolean;
  originalText?: string;
  suggestedText?: string;
  rejectionReason?: string;
}

export interface Comment {
  id: string;
  noteId: string;
  authorName: string;
  authorRole: "student" | "lecturer";
  content: string;
  createdAt: string;
  replies: Comment[];
}

export interface Annotation {
  id: string;
  noteId: string;
  targetLine: number;
  annotationText: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type:
    | "proposal_approved"
    | "proposal_rejected"
    | "comment"
    | "locked"
    | "proposal_submitted";
  read: boolean;
  createdAt: string;
  data?: {
    noteId?: string;
    initialTab?: "notes" | "proposals" | "comments";
    proposalId?: string;
  };
}

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

export const MOCK_STUDENT: Student = {
  id: "user-student-1",
  fullName: "Karma Wangchuk",
  studentId: "STU2024001",
  role: "student",
  avatarColor: "#0066FF",
};

export const MOCK_LECTURER: Lecturer = {
  id: "user-lecturer-1",
  fullName: "Dr. Tshering Dorji",
  email: "tshering@cst.edu.bt",
  role: "lecturer",
  avatarColor: "#7C3AED",
};

export const MOCK_STUDENTS: Student[] = [
  MOCK_STUDENT,
  {
    id: "user-student-2",
    fullName: "Pema Lhamo",
    studentId: "STU2024002",
    role: "student",
    avatarColor: "#059669",
  },
  {
    id: "user-student-3",
    fullName: "Dorji Tenzin",
    studentId: "STU2024003",
    role: "student",
    avatarColor: "#DC2626",
  },
];

export const MOCK_MODULES: Module[] = [
  {
    id: "module-1",
    code: "CS301",
    name: "Cross-Platform Development",
    lecturerName: "Dr. Tshering Dorji",
    enrollCode: "XPD301",
    studentCount: 28,
    lectureCount: 6,
  },
  {
    id: "module-2",
    code: "CS204",
    name: "Data Structures & Algorithms",
    lecturerName: "Dr. Tshering Dorji",
    enrollCode: "DSA204",
    studentCount: 34,
    lectureCount: 8,
  },
  {
    id: "module-3",
    code: "CS310",
    name: "Database Systems",
    lecturerName: "Dr. Tshering Dorji",
    enrollCode: "DBS310",
    studentCount: 22,
    lectureCount: 5,
  },
];

export const MOCK_NOTES: Note[] = [
  {
    id: "note-1",
    moduleId: "module-1",
    title: "Introduction to React Native",
    lectureDate: "2025-05-12",
    currentVersionId: "version-3",
    currentVersionNumber: 3,
    isLocked: false,
    pendingProposalCount: 2,
  },
  {
    id: "note-2",
    moduleId: "module-1",
    title: "Expo Router & Navigation",
    lectureDate: "2025-05-19",
    currentVersionId: "version-1b",
    currentVersionNumber: 1,
    isLocked: true,
    pendingProposalCount: 0,
  },
  {
    id: "note-3",
    moduleId: "module-1",
    title: "State Management with Zustand",
    lectureDate: "2025-05-26",
    currentVersionId: "version-2b",
    currentVersionNumber: 2,
    isLocked: false,
    pendingProposalCount: 1,
  },
];

export const MOCK_VERSIONS: Version[] = [
  {
    id: "version-1",
    noteId: "note-1",
    content: NOTE_CONTENT_V3.replace("without a WebView", "")
      .replace(", and FlatList", "")
      .replace(", FlatList", ""),
    versionNumber: 1,
    savedBy: "Dr. Tshering Dorji",
    savedAt: "2025-05-12T09:00:00Z",
    isPinned: false,
  },
  {
    id: "version-2",
    noteId: "note-1",
    content: NOTE_CONTENT_V3.replace(
      "Key Differences from Web React</h3>",
      "",
    ).replace("There is no DOM", ""),
    versionNumber: 2,
    savedBy: "Dr. Tshering Dorji",
    savedAt: "2025-05-13T14:30:00Z",
    isPinned: false,
  },
  {
    id: "version-3",
    noteId: "note-1",
    content: NOTE_CONTENT_V3,
    versionNumber: 3,
    savedBy: "Dr. Tshering Dorji",
    savedAt: "2025-05-14T10:15:00Z",
    isPinned: true,
  },
];

export const MOCK_PROPOSALS_INIT: Proposal[] = [
  {
    id: "proposal-1",
    noteId: "note-1",
    proposedBy: "Student B",
    summary: "Added Metro Bundler to core concepts list",
    upvoteCount: 14,
    hasUpvoted: false,
    status: "pending",
    createdAt: "2025-05-13T11:00:00Z",
    isInline: false,
  },
  {
    id: "proposal-2",
    noteId: "note-1",
    proposedBy: "Student C",
    summary: "Fixed hyphenation: steady-state error",
    upvoteCount: 7,
    hasUpvoted: true,
    status: "pending",
    createdAt: "2025-05-13T15:30:00Z",
    isInline: true,
    originalText: "steady state error",
    suggestedText: "steady-state error",
  },
  {
    id: "proposal-3",
    noteId: "note-1",
    proposedBy: "Student A",
    summary: "Added FlatList to core components",
    upvoteCount: 9,
    hasUpvoted: false,
    status: "approved",
    createdAt: "2025-05-12T16:00:00Z",
    isInline: false,
  },
  {
    id: "proposal-4",
    noteId: "note-1",
    proposedBy: "Student D",
    summary: 'Changed "Meta" to "Facebook" (incorrect)',
    upvoteCount: 0,
    hasUpvoted: false,
    status: "rejected",
    rejectionReason: "Meta is the correct current company name.",
    createdAt: "2025-05-12T17:00:00Z",
    isInline: true,
    originalText: "Meta",
    suggestedText: "Facebook",
  },
];

export const MOCK_COMMENTS_INIT: Comment[] = [
  {
    id: "comment-1",
    noteId: "note-1",
    authorName: "Karma Wangchuk",
    authorRole: "student",
    content:
      "Can someone clarify the difference between JSI and the old Bridge? The notes mention both but I'm not sure when JSI was introduced.",
    createdAt: "2025-05-14T09:30:00Z",
    replies: [
      {
        id: "comment-1-r1",
        noteId: "note-1",
        authorName: "Dr. Tshering Dorji",
        authorRole: "lecturer",
        content:
          "JSI (JavaScript Interface) was introduced as part of the New Architecture in RN 0.68+. It replaces the async bridge with synchronous direct bindings. We'll cover this more in Week 4.",
        createdAt: "2025-05-14T10:00:00Z",
        replies: [],
      },
    ],
  },
  {
    id: "comment-2",
    noteId: "note-1",
    authorName: "Pema Lhamo",
    authorRole: "student",
    content:
      "The section on Expo vs Bare RN was really helpful. Should we use Expo Go or a development build for the project?",
    createdAt: "2025-05-14T11:15:00Z",
    replies: [],
  },
];

export const MOCK_ANNOTATIONS: Annotation[] = [
  {
    id: "annotation-1",
    noteId: "note-1",
    targetLine: 3,
    annotationText:
      "This will be covered in more depth in the Week 3 lecture on the New Architecture.",
    createdAt: "2025-05-14T10:30:00Z",
  },
  {
    id: "annotation-2",
    noteId: "note-1",
    targetLine: 8,
    annotationText:
      "Remember: StyleSheet.create() gives a small performance benefit by caching the style IDs.",
    createdAt: "2025-05-14T10:35:00Z",
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Edit Approved ✓",
    body: 'Your edit to "Intro to React Native" was approved by Dr. Dorji',
    type: "proposal_approved",
    read: false,
    createdAt: "2025-05-14T12:00:00Z",
    data: {
      noteId: "note-1",
      initialTab: "proposals",
      proposalId: "proposal-2",
    },
  },
  {
    id: "n2",
    title: "New Comment",
    body: 'Dr. Dorji commented on "Introduction to React Native"',
    type: "comment",
    read: false,
    createdAt: "2025-05-14T10:05:00Z",
    data: { noteId: "note-1", initialTab: "comments" },
  },
  {
    id: "n3",
    title: "Notes Locked 🔒",
    body: '"Expo Router & Navigation" has been locked for editing',
    type: "locked",
    read: true,
    createdAt: "2025-05-13T16:00:00Z",
    data: { noteId: "note-2", initialTab: "notes" },
  },
  {
    id: "n4",
    title: "New Proposal Submitted",
    body: 'A student submitted a proposal to "State Management"',
    type: "proposal_submitted",
    read: true,
    createdAt: "2025-05-13T09:30:00Z",
    data: { noteId: "note-3", initialTab: "proposals" },
  },
  {
    id: "n5",
    title: "Edit Rejected",
    body: 'Your proposal to "Expo Router" was reviewed',
    type: "proposal_rejected",
    read: true,
    createdAt: "2025-05-12T14:00:00Z",
    data: {
      noteId: "note-2",
      initialTab: "proposals",
      proposalId: "proposal-5",
    },
  },
];
