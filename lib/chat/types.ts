// ==========================================================
// Роли и сообщения
// ==========================================================

export type ChatRole = "user" | "assistant";

export type ChatMessageStatus = "pending" | "done" | "error";

export interface ChatSource {
  title: string;
  url: string;
}

export type ChatActionType = "open_form" | "open_course" | "link";

export interface ChatAction {
  type: ChatActionType;
  label: string;
  payload?: Record<string, string>;
}

export interface ChatMessageModel {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  status?: ChatMessageStatus;
  sources?: ChatSource[];
  actions?: ChatAction[];
}

// ==========================================================
// Контракт API
// ==========================================================

export interface ChatHistoryEntry {
  role: ChatRole;
  content: string;
}

export interface ChatContext {
  page_section?: string;
  selected_course_id?: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  history?: ChatHistoryEntry[];
  context?: ChatContext;
}

export interface ChatResponse {
  answer: string;
  sources?: ChatSource[];
  suggested_actions?: ChatAction[];
}

export interface ChatErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export type ChatApiResponse = ChatResponse | ChatErrorBody;

// ==========================================================
// Провайдер (абстракция)
// ==========================================================

export interface ChatProvider {
  /**
   * Получить ответ ассистента.
   */
  reply(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>;

  /**
   * Заложено на будущее: стриминг ответа.
   * Реализация опциональна.
   */
  stream?(
    req: ChatRequest,
    signal?: AbortSignal,
  ): AsyncIterable<{ delta: string } | { done: ChatResponse }>;
}

// ==========================================================
// Константы (используются в UI и в API)
// ==========================================================

export const CHAT_MAX_MESSAGE_LENGTH = 1000;
export const CHAT_RATE_LIMIT_PER_MINUTE = 20;
export const CHAT_HISTORY_SENT_LIMIT = 10;