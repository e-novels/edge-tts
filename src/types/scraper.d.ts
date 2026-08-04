type ScraperCapability =
  | 'search'
  | 'getBookDetail'
  | 'getChapter'
  | 'getFilterOptions'
  | 'suggest'
  | 'getComments'
  | 'getReviews'

type ScraperFilterValue = string | number | boolean | string[] | null

interface ScraperSearchRequest {
  filters: Record<string, ScraperFilterValue>
  page: number
  pageSize: number
}

interface ScraperBookDetailRequest {
  bookRef: string
  parentRef?: string
  commentScope?: 'series' | 'all'
  commentTarget?: 'book' | 'chapter'
  targetRef?: string
  page?: number
}

interface ScraperChapterRequest {
  chapterRef: string
  bookRef?: string
}

interface ScraperFilterOptionsRequest {
  fieldId: string
  query?: string
  filters: Record<string, ScraperFilterValue>
}

interface ScraperFilterOption {
  label: string
  value: string
}

interface ScraperFilterOptionsResponse {
  options: ScraperFilterOption[]
}

interface ScraperPagination {
  page: number
  pageSize: number
  totalItems?: number
  totalPages?: number
  hasNextPage: boolean
}

interface ScraperSearchResponse {
  items: ScraperBookSummary[]
  pagination: ScraperPagination
}

interface ScraperHandlers {
  search?: (request: ScraperSearchRequest) => ExtensionMaybePromise<ScraperSearchResponse>
  getBookDetail?: (request: ScraperBookDetailRequest) => ExtensionMaybePromise<ScraperBookDetail>
  getChapter?: (request: ScraperChapterRequest) => ExtensionMaybePromise<ScraperChapter>
  getFilterOptions?: (
    request: ScraperFilterOptionsRequest
  ) => ExtensionMaybePromise<ScraperFilterOptionsResponse>
  suggest?: (request: ScraperFilterOptionsRequest) => ExtensionMaybePromise<string[]>
  getComments?: (request: ScraperBookDetailRequest) => ExtensionMaybePromise<ScraperCommentsPage>
  getReviews?: (request: ScraperBookDetailRequest) => ExtensionMaybePromise<ScraperReview[]>
}

interface ExtensionScraperApi {
  register(handlers: ScraperHandlers): Promise<void>
}

interface ScraperBookSummary {
  book_id: number
  book_name: string
  book_image: string
  authors: Array<{ author_id: number; author_name: string }>
}

interface ScraperBookDetail extends ScraperBookSummary {
  book_sub_name: string[]
  status: 'show' | 'hidden' | 'ongoing' | 'completed'
  description: string
  artists: Array<{ artist_id: number; artist_name: string }>
  book_genre: Array<{ category_id: number; category_name: string }>
  volumes: Array<{
    volume_id: number
    volume_name: string
    volume_number: number
    created_at: string
    updated_at: string
    chapters: Array<{
      chapter_id: number
      chapter_name: string
      chapter_number: number
      created_at: string
      updated_at: string
    }>
  }>
  follow: number
  latest_update: string | null
  rating_count: number
  total_index: number
  views: number
  total_comment: number
  average_rating: number
}

interface ScraperChapter {
  chapter_id: number
  chapter_name: string
  chapter_number: number
  volume_id: number
  book_id: number
  content: string[]
  total_index: number
  status: 'show' | 'hidden' | 'ongoing' | 'completed'
  created_at: string
  updated_at: string
}

interface ScraperComment {
  comment_id: number
  user_id: number
  user_name: string
  avatar: string
  message: string
  created_at: string
  total_like: number
  total_reply: number
  is_like: boolean
  replies?: ScraperComment[]
}

interface ScraperCommentsPage {
  data: ScraperComment[]
  pagination: ScraperPagination
}

interface ScraperReview {
  interaction_id: number
  user_id: number
  user_name: string
  avatar: string
  value: number
  message: string
  created_at: string
}

interface TemplateBook {
  id: number
  title: string
  image?: string
  author?: { id: number; name: string }
}

interface TemplateBookDetail extends TemplateBook {
  alternateTitles?: string[]
  status?: 'show' | 'hidden' | 'ongoing' | 'completed'
  description?: string
  volumes: Array<{
    id: number
    name: string
    number: number
    createdAt: string
    updatedAt: string
    chapters: Array<{
      id: number
      name: string
      number: number
      createdAt: string
      updatedAt: string
    }>
  }>
}

interface TemplateChapter {
  id: number
  name: string
  number: number
  volumeId: number
  bookId: number
  paragraphs: string[]
  createdAt: string
  updatedAt: string
}

interface TemplateSearchResponse {
  items: TemplateBook[]
  pagination: {
    page: number
    pageSize: number
    totalItems?: number
    totalPages?: number
    hasNextPage: boolean
  }
}