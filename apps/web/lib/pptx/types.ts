export interface SlideTextBlock {
  id: string
  text: string
  type: "title" | "subtitle" | "body" | "bullet"
  level: number
  x: number
  y: number
  width: number
  height: number
}

export interface SlideImage {
  id: string
  url: string
  name: string
  relId: string
  x: number
  y: number
  width: number
  height: number
}

export interface SlideTable {
  id: string
  rows: string[][]
  x: number
  y: number
  width: number
  height: number
}

export interface ParsedSlide {
  slideNumber: number
  slideId: string
  slideFile: string
  title: string
  subtitle?: string
  textBlocks: SlideTextBlock[]
  allText: string
  speakerNotes: string
  images: SlideImage[]
  tables: SlideTable[]
  keyTakeaway: string
}

export interface TopicSection {
  topic: string
  slideNumbers: number[]
  summary: string
}

export interface VocabularyTerm {
  term: string
  definition: string
  slideNumber: number
}

export interface OutlineItem {
  slideNumber: number
  title: string
  takeaway: string
}

export interface PresentationSummary {
  title: string
  overview: string
  keyTopics: TopicSection[]
  keyTakeaways: string[]
  vocabularyTerms: VocabularyTerm[]
  outline: OutlineItem[]
  estimatedReadMinutes: number
}

export interface PresentationStats {
  totalSlides: number
  slidesWithNotes: number
  totalWords: number
  totalImages: number
}

export interface ParsedPresentation {
  id: string
  filename: string
  slideWidth: number
  slideHeight: number
  aspectRatio: "16:9" | "4:3" | string
  aspectRatioDecimal: number
  slides: ParsedSlide[]
  mediaMap: Record<string, string>
  summary: PresentationSummary
  stats: PresentationStats
}

