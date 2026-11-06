export type ItemContentType =
  | "Assignment"
  | "Quizzes::Quiz"
  | "DiscussionTopic"
  | "WikiPage"
  | "Attachment"
  | "ExternalUrl"
  | "ContextExternalTool"
  | "Header"
  | "SubHeader"
  | "Unknown"

export interface ModuleItem {
  id: string
  identifierref?: string
  title: string
  contentType: ItemContentType
  position: number
  indent: number
  url?: string
  workflowState?: string
  resolvedTargetId?: string
}

export interface CourseModule {
  id: string
  title: string
  position: number
  workflowState?: string
  unlockAt?: string
  locked: boolean
  items: ModuleItem[]
}

export interface Assignment {
  id: string
  title: string
  pointsPossible: number
  dueAt?: string
  lockAt?: string
  unlockAt?: string
  workflowState?: string
  submissionTypes: string[]
  gradingType?: string
  htmlDescription?: string
  assignmentGroupId?: string
  position?: number
}

export interface QuizAnswer {
  id: string
  text: string
  isCorrect?: boolean
}

export interface QuizQuestion {
  id: string
  title: string
  questionType: string
  pointsPossible: number
  promptHtml: string
  answers: QuizAnswer[]
  explanation?: string
}

export interface Quiz {
  id: string
  title: string
  descriptionHtml?: string
  quizType?: string
  pointsPossible: number
  timeLimitMinutes?: number
  allowedAttempts?: number | string
  shuffleAnswers?: boolean
  showCorrectAnswers?: boolean
  workflowState?: string
  questions: QuizQuestion[]
}

export interface Discussion {
  id: string
  topicId?: string
  title: string
  messageHtml?: string
  discussionType?: string
  pointsPossible?: number
  workflowState?: string
}

export interface WikiPage {
  id: string
  title: string
  bodyHtml: string
  urlSlug?: string
  workflowState?: string
  editingRoles?: string
}

export interface CourseFile {
  id: string
  href: string
  fullPath: string
  filename: string
  directory: string
  size: number
  mimeType: string
  blobUrl?: string
  isImage: boolean
  isVideo: boolean
  isAudio: boolean
  isPdf: boolean
  isPptx: boolean
}

export interface AssignmentGroup {
  id: string
  title: string
  weight?: number
}

export interface CourseStats {
  totalModules: number
  totalAssignments: number
  totalQuizzes: number
  totalDiscussions: number
  totalPages: number
  totalFiles: number
  totalPresentations: number
  totalPoints: number
}

export interface Course {
  id: string
  title: string
  courseCode?: string
  startAt?: string
  concludeAt?: string
  license?: string
  storageQuota?: number
  syllabusHtml?: string
  modules: CourseModule[]
  assignments: Assignment[]
  quizzes: Quiz[]
  discussions: Discussion[]
  pages: WikiPage[]
  files: CourseFile[]
  assignmentGroups: AssignmentGroup[]
  stats: CourseStats
  rawFileNames: string[]
}

