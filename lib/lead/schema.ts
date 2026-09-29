import { z } from "zod";

// ==========================================================
// Схема заявки (общая для клиента и сервера)
// ==========================================================

export const leadSourceSchema = z.enum(["form", "modal", "course", "chat"]);

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Введите имя (минимум 2 символа)")
    .max(60, "Не более 60 символов"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()\-]{9,20}$/, "Введите корректный номер телефона"),
  courseId: z.string().max(64).optional().or(z.literal("")),
  preferredTime: z.string().max(80).optional().or(z.literal("")),
  comment: z
    .string()
    .trim()
    .max(500, "Не более 500 символов")
    .optional()
    .or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие на обработку данных" }),
  }),
  // Антиспам: honeypot должен быть пустым
  website: z.string().max(0).optional().or(z.literal("")),
  // Timestamp монтирования формы (мс)
  formStartedAt: z.number().int().optional(),
  // Атрибуция
  source: leadSourceSchema.default("form"),
  utm: z.record(z.string().max(200)).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

// ==========================================================
// Схема ответа API
// ==========================================================

export type LeadSuccessResponse = { ok: true };
export type LeadErrorResponse = {
  ok: false;
  errors?: Record<string, string>;
  error?: string;
};

export type LeadResponse = LeadSuccessResponse | LeadErrorResponse;

// ==========================================================
// Начальные значения для формы
// ==========================================================

export const defaultLeadValues: Partial<LeadInput> = {
  name: "",
  phone: "",
  courseId: "",
  preferredTime: "",
  comment: "",
  source: "form",
};