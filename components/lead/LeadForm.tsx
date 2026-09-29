"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track } from "@/lib/analytics";
import { getCourses } from "@/lib/content";
import type { Course } from "@/lib/content/types";
import {
  leadSchema,
  type LeadInput,
  type LeadResponse,
} from "@/lib/lead/schema";
import { cn, normalizePhone, readPersistedUtm } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface LeadFormProps {
  /** Предзаполненный курс */
  presetCourseId?: string;
  /** Источник формы */
  source?: LeadInput["source"];
  /** Показывать ли поле выбора курса */
  showCourseSelect?: boolean;
  /** Коллбэк успешной отправки */
  onSuccess?: () => void;
  /** Доп. классы на форме */
  className?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export function LeadForm({
  presetCourseId,
  source = "form",
  showCourseSelect = true,
  onSuccess,
  className,
}: LeadFormProps) {
  const courses = getCourses();
  const reduceMotion = useReducedMotion();
  const startedAtRef = useRef<number>(Date.now());
  const hasTrackedStartRef = useRef<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const shakeControls = useAnimationControls();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      phone: "",
      courseId: presetCourseId ?? "",
      preferredTime: "",
      comment: "",
      consent: undefined as unknown as true,
      website: "",
      formStartedAt: startedAtRef.current,
      source,
      utm: undefined,
    },
  });

  // Обновляем presetCourseId при его изменении
  useEffect(() => {
    if (presetCourseId) {
      setValue("courseId", presetCourseId);
    }
  }, [presetCourseId, setValue]);

  // Отслеживание первого фокуса
  const handleFirstInteraction = useCallback(() => {
    if (hasTrackedStartRef.current) return;
    hasTrackedStartRef.current = true;
    track("lead_form_start", { source });
  }, [source]);

  const shake = useCallback(() => {
    if (reduceMotion) return;
    void shakeControls.start(
      { x: [0, -8, 8, -6, 6, -3, 3, 0] },
      { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    );
  }, [reduceMotion, shakeControls]);

  const onSubmit = useCallback(
    async (values: LeadInput) => {
      setSubmitError(null);

      const utm = readPersistedUtm();
      const payload = {
        ...values,
        phone: normalizePhone(values.phone),
        formStartedAt: startedAtRef.current,
        source,
        utm,
      };

      try {
        const response = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.status === 429) {
          setSubmitError(
            "Слишком много попыток. Пожалуйста, повторите чуть позже.",
          );
          track("lead_submit_error", { source, reason: "rate_limited" });
          shake();
          return;
        }

        if (!response.ok) {
          const data: LeadResponse = await response.json().catch(() => ({
            ok: false,
          }));
          if (!data.ok && data.errors) {
            // Серверные ошибки валидации: показываем общее сообщение
            setSubmitError(
              "Проверьте правильность заполнения полей и попробуйте снова.",
            );
          } else {
            setSubmitError(
              "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.",
            );
          }
          track("lead_submit_error", { source, reason: "server" });
          shake();
          return;
        }

        // Успех
        track("lead_submit_success", {
          source,
          course_id: values.courseId ?? "",
        });

        reset({
          name: "",
          phone: "",
          courseId: "",
          preferredTime: "",
          comment: "",
          consent: undefined as unknown as true,
          website: "",
          formStartedAt: Date.now(),
          source,
        });
        startedAtRef.current = Date.now();
        hasTrackedStartRef.current = false;

        onSuccess?.();
      } catch {
        setSubmitError(
          "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.",
        );
        track("lead_submit_error", { source, reason: "network" });
        shake();
      }
    },
    [onSuccess, reset, source, shake],
  );

  const onInvalid = useCallback(() => {
    shake();
  }, [shake]);

  const courseOptions = [
    { value: "", label: "Не выбрано" },
    ...courses.map((course: Course) => ({
      value: course.id,
      label: course.title,
    })),
  ];

  return (
    <motion.form
      animate={shakeControls}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      onFocus={handleFirstInteraction}
      noValidate
      className={cn("flex flex-col gap-4", className)}
    >
      {/* Имя */}
      <Input
        label="Имя"
        autoComplete="name"
        placeholder="Как к вам обращаться"
        error={errors.name?.message}
        {...register("name")}
      />

      {/* Телефон */}
      <Input
        label="Телефон"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+998 90 000 00 00"
        error={errors.phone?.message}
        {...register("phone")}
      />

      {/* Курс */}
      {showCourseSelect ? (
        <Controller
          name="courseId"
          control={control}
          render={({ field }) => (
            <Select
              label="Интересующий курс"
              options={courseOptions}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              error={errors.courseId?.message}
            />
          )}
        />
      ) : (
        <input type="hidden" {...register("courseId")} />
      )}

      {/* Удобное время */}
      <Input
        label="Удобное время для звонка"
        placeholder="Например, будни после 18:00"
        error={errors.preferredTime?.message}
        {...register("preferredTime")}
      />

      {/* Комментарий */}
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Textarea
            label="Комментарий"
            placeholder="Коротко о ваших целях — поможем подобрать программу"
            maxLength={500}
            showCounter
            error={errors.comment?.message}
            name={field.name}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      {/* Honeypot: скрытое поле */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="lead-website-honeypot">
          Website
          <input
            id="lead-website-honeypot"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </label>
      </div>

      {/* Согласие */}
      <Controller
        name="consent"
        control={control}
        render={({ field }) => (
          <Checkbox
            name={field.name}
            checked={Boolean(field.value)}
            onChange={(e) => field.onChange(e.target.checked ? true : false)}
            onBlur={field.onBlur}
            error={errors.consent?.message}
            label={
              <>
                Я согласен с{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  политикой конфиденциальности
                </a>{" "}
                и обработкой персональных данных
              </>
            }
          />
        )}
      />

      {/* Ошибка отправки */}
      {submitError ? (
        <div
          role="alert"
          className={cn(
            "rounded-[var(--radius-md)] border border-[var(--color-error)]/30",
            "bg-[var(--color-error)]/5 p-3 text-small text-[var(--color-error)]",
          )}
        >
          {submitError}
        </div>
      ) : null}

      {/* Кнопка */}
      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        fullWidth
        className="mt-1"
      >
        Отправить заявку
      </Button>

      {/* Что будет дальше. Раньше здесь стояло второе согласие —
          оно дублировало чекбокс выше и не отвечало на вопрос
          пользователя «а что произойдёт после отправки». */}
      <p className="text-center text-caption text-[var(--color-text-muted)]">
        Перезвоним в рабочее время в течение 30 минут и подберём программу
      </p>
    </motion.form>
  );
}