"use client";

import { Quote } from "lucide-react";
import { useState } from "react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Rating } from "@/components/ui/Rating";
import { Reveal } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getCourses, getReviews } from "@/lib/content";
import type { Review } from "@/lib/content/types";
import { cn, formatDate, getInitials } from "@/lib/utils";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// ==========================================================
// Утилиты
// ==========================================================

function getCourseTitle(courseId?: string): string | undefined {
  if (!courseId) return undefined;
  const course = getCourses().find((c) => c.id === courseId);
  return course?.title;
}

// ==========================================================
// Карточка отзыва
// ==========================================================

interface ReviewCardProps {
  review: Review;
  onReadMore: (review: Review) => void;
}

function ReviewCard({ review, onReadMore }: ReviewCardProps) {
  const courseTitle = getCourseTitle(review.courseId);
  const isLong = review.text.length > 220;

  return (
    <Card
      as="article"
      variant="default"
      padding="md"
      className="flex h-full flex-col"
    >
      {/* Цитата-иконка */}
      <Quote
        className="h-6 w-6 text-[var(--color-primary)]/30"
        aria-hidden="true"
      />

      {/* Автор и рейтинг */}
      <header className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--color-bg-alt)]">
            {review.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.photo}
                alt={review.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="grid h-full w-full place-items-center text-small font-bold text-[var(--color-primary)]"
                aria-hidden="true"
              >
                {getInitials(review.name)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-small font-semibold text-[var(--color-text)]">
              {review.name}
            </p>
            {courseTitle ? (
              <p className="truncate text-small text-[var(--color-text-muted)]">
                {courseTitle}
              </p>
            ) : null}
          </div>
        </div>
        <Rating value={review.rating} size="sm" />
      </header>

      {/* Текст */}
      <p
        className={cn(
          "mt-4 whitespace-pre-line text-small text-[var(--color-text-muted)] md:text-body",
          !isLong && "line-clamp-none",
          isLong && "line-clamp-6",
        )}
      >
        {review.text}
      </p>

      {/* Читать полностью */}
      {isLong ? (
        <button
          type="button"
          onClick={() => onReadMore(review)}
          className={cn(
            "mt-2 self-start text-small font-semibold text-[var(--color-primary)]",
            "transition-colors duration-200 ease-out hover:text-[var(--color-primary-hover)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          )}
        >
          Читать полностью
        </button>
      ) : null}

      {/* Дата */}
      <div className="mt-auto pt-4">
        {review.date ? (
          <p className="text-small text-[var(--color-text-muted)]">
            {formatDate(review.date)}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

// ==========================================================
// Модальное окно с полным отзывом
// ==========================================================

interface ReviewModalProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
}

function ReviewModal({ review, open, onClose }: ReviewModalProps) {
  if (!review) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  const courseTitle = getCourseTitle(review.courseId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={review.name}
      description={courseTitle}
    >
      <div className="flex flex-col gap-4">
        <Rating value={review.rating} size="lg" showValue />
        <p className="whitespace-pre-line text-small leading-relaxed text-[var(--color-text)] md:text-body">
          {review.text}
        </p>
        {review.date ? (
          <p className="text-small text-[var(--color-text-muted)]">
            {formatDate(review.date)}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

// ==========================================================
// Секция
// ==========================================================

export function Reviews() {
  const reviews = getReviews();
  const reduceMotion = useReducedMotion();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleReadMore = (review: Review) => {
    setSelectedReview(review);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const autoplayOptions = reduceMotion
    ? false
    : {
        delay: 6000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      };

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="section bg-[var(--color-bg-alt)]"
    >
      <div className="container">
        {/* Заголовок */}
        <div className="max-w-2xl">
          <Reveal animation="fade-up" delay={80}>
            <h2
              id="reviews-title"
              className="text-h2 font-heading text-[var(--color-text)]"
            >
              Истории студентов, которые уже изменили карьеру
            </h2>
          </Reveal>
          <Reveal animation="fade-up" delay={160}>
            <p className="mt-4 text-body text-[var(--color-text-muted)] md:text-body-lg">
              Более 8 500 выпускников — от первых шагов в профессии до офферов
              в продуктовых командах.
            </p>
          </Reveal>
        </div>

        {/* Слайдер */}
        <Reveal animation="fade-up" delay={200}>
          <div className="relative mt-10">
            <Swiper
              modules={[Navigation, Pagination, Autoplay, A11y]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={{
                prevEl: ".reviews-prev",
                nextEl: ".reviews-next",
              }}
              pagination={{ clickable: true }}
              autoplay={autoplayOptions}
              a11y={{
                enabled: true,
                prevSlideMessage: "Предыдущий отзыв",
                nextSlideMessage: "Следующий отзыв",
              }}
              watchSlidesProgress
              breakpoints={{
                640: { slidesPerView: 1.2, spaceBetween: 20 },
                768: { slidesPerView: 2, spaceBetween: 24 },
                1024: { slidesPerView: 2.2, spaceBetween: 24 },
                1280: { slidesPerView: 3, spaceBetween: 24 },
              }}
              className="!pb-14"
            >
              {reviews.map((review) => (
                <SwiperSlide key={review.id} className="!h-auto">
                  <ReviewCard review={review} onReadMore={handleReadMore} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Стрелки (desktop) */}
            <div className="pointer-events-none absolute inset-y-0 -left-2 -right-2 hidden items-center justify-between lg:flex">
              <button
                type="button"
                className={cn(
                  "reviews-prev pointer-events-auto grid h-11 w-11 place-items-center rounded-full",
                  "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md",
                  "text-[var(--color-text)]",
                  "transition-colors duration-200 ease-out",
                  "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                )}
                aria-label="Предыдущий отзыв"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className={cn(
                  "reviews-next pointer-events-auto grid h-11 w-11 place-items-center rounded-full",
                  "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md",
                  "text-[var(--color-text)]",
                  "transition-colors duration-200 ease-out",
                  "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                )}
                aria-label="Следующий отзыв"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Модальное окно с полным отзывом */}
      <ReviewModal
        review={selectedReview}
        open={isModalOpen}
        onClose={handleClose}
      />
    </section>
  );
}