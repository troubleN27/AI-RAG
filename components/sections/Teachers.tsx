"use client";

import { Award, Briefcase, ExternalLink, Linkedin, Send } from "lucide-react";
import { useCallback, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { A11y, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import { getCourses, getTeachers } from "@/lib/content";
import type { Teacher } from "@/lib/content/types";
import { cn, getInitials } from "@/lib/utils";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// ==========================================================
// Хелперы
// ==========================================================

function getTeacherCourseTitles(teacher: Teacher): string[] {
  const allCourses = getCourses();
  const ids = teacher.courseIds ?? [];
  return allCourses
    .filter((c) => ids.includes(c.id))
    .slice(0, 3)
    .map((c) => c.title);
}

function renderSocialIcon(type: string) {
  switch (type) {
    case "linkedin":
      return <Linkedin className="h-4 w-4" aria-hidden="true" />;
    case "telegram":
      return <Send className="h-4 w-4" aria-hidden="true" />;
    case "instagram":
      return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
    default:
      return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
  }
}

function pluralizeYears(years: number): string {
  const mod10 = years % 10;
  const mod100 = years % 100;

  if (mod10 === 1 && mod100 !== 11) return "год";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "года";
  return "лет";
}

// ==========================================================
// Карточка преподавателя
// ==========================================================

interface TeacherCardProps {
  teacher: Teacher;
  onOpen: (teacher: Teacher) => void;
}

function TeacherCard({ teacher, onOpen }: TeacherCardProps) {
  const courses = getTeacherCourseTitles(teacher);

  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className="group flex h-full flex-col overflow-hidden"
    >
      {/* Фото */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-bg-alt)]">
        {teacher.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teacher.photo}
            alt={`Фото преподавателя ${teacher.name}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="media-plate grid h-full w-full place-items-center text-2xl font-heading text-[var(--color-text)]"
            
            aria-hidden="true"
          >
            {getInitials(teacher.name)}
          </div>
        )}

        {/* Оверлей на hover */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-end p-4 opacity-0 transition-opacity duration-300 ease-out",
            "bg-gradient-to-t from-black/70 via-black/30 to-transparent",
            "group-hover:opacity-100",
          )}
          aria-hidden="true"
        >
          <p className="line-clamp-4 text-small leading-snug text-white">
            {teacher.bio}
          </p>
        </div>
      </div>

      {/* Информация */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
          {teacher.name}
        </h3>
        <p className="mt-1 text-small text-[var(--color-text-muted)]">
          {teacher.position}
        </p>

        {typeof teacher.experienceYears === "number" ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-small font-medium text-[var(--color-primary)]">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            Опыт {teacher.experienceYears} {pluralizeYears(teacher.experienceYears)}
          </p>
        ) : null}

        {courses.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {courses.map((title) => (
              <li
                key={title}
                className="rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-small text-[var(--color-text-muted)]"
              >
                {title}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-4">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => onOpen(teacher)}
            aria-label={`Подробнее о преподавателе ${teacher.name}`}
          >
            Подробнее
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ==========================================================
// Модальное окно преподавателя
// ==========================================================

interface TeacherModalProps {
  teacher: Teacher | null;
  open: boolean;
  onClose: () => void;
}

function TeacherModal({ teacher, open, onClose }: TeacherModalProps) {
  if (!teacher) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={teacher.name}
      description={teacher.position}
    >
      <div className="flex flex-col gap-6">
        {/* Фото + ключевые факты */}
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <div className="h-40 w-32 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-alt)]">
            {teacher.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teacher.photo}
                alt={`Фото преподавателя ${teacher.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="media-plate grid h-full w-full place-items-center text-xl font-heading text-[var(--color-text)]"
                
                aria-hidden="true"
              >
                {getInitials(teacher.name)}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-small text-[var(--color-text)] md:text-body">
              {teacher.bio}
            </p>

            {teacher.links && teacher.links.length > 0 ? (
              <ul className="mt-4 flex flex-wrap items-center gap-2">
                {teacher.links.map((link) => (
                  <li key={`${link.type}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)]",
                        "border border-[var(--color-border)] bg-[var(--color-surface)] px-3",
                        "text-small font-medium text-[var(--color-text-muted)]",
                        "transition-colors duration-200 ease-out",
                        "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                      )}
                    >
                      {renderSocialIcon(link.type)}
                      <span className="capitalize">{link.type}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Достижения */}
        {teacher.achievements && teacher.achievements.length > 0 ? (
          <section aria-labelledby="teacher-achievements">
            <h3
              id="teacher-achievements"
              className="inline-flex items-center gap-2 text-body font-semibold text-[var(--color-text)]"
            >
              <Award className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
              Достижения
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {teacher.achievements.map((achievement) => (
                <li
                  key={achievement}
                  className="flex items-start gap-2 text-small text-[var(--color-text-muted)]"
                >
                  <span
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-solid)]"
                    aria-hidden="true"
                  />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Курсы */}
        {teacher.courseIds && teacher.courseIds.length > 0 ? (
          <section aria-labelledby="teacher-courses">
            <h3
              id="teacher-courses"
              className="text-body font-semibold text-[var(--color-text)]"
            >
              Ведёт курсы
            </h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {getTeacherCourseTitles(teacher).map((title) => (
                <li
                  key={title}
                  className="rounded-full bg-[var(--color-bg-alt)] px-3 py-1 text-small text-[var(--color-text-muted)]"
                >
                  {title}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

// ==========================================================
// Секция
// ==========================================================

export function Teachers() {
  const teachers = getTeachers();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  const handleOpen = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <section
      id="teachers"
      aria-labelledby="teachers-title"
      className="section bg-[var(--color-bg)]"
    >
      <div className="container">
        {/* Заголовок */}
        <div className="max-w-2xl">
          <Reveal animation="fade-up" delay={80}>
            <h2
              id="teachers-title"
              className="text-h2 font-heading text-[var(--color-text)]"
            >
              Практики, которые знают индустрию изнутри
            </h2>
          </Reveal>
          <Reveal animation="fade-up" delay={160}>
            <p className="mt-4 text-body text-[var(--color-text-muted)] md:text-body-lg">
              {teachers.length} преподавателей — действующие специалисты. Они не
              только учат, но и делятся реальными кейсами и помогают с
              трудоустройством.
            </p>
          </Reveal>
        </div>

        {/* Слайдер */}
        <Reveal animation="fade-up" delay={200}>
          <div className="relative mt-10">
            <Swiper
              onSwiper={setSwiperInstance}
              modules={[Navigation, Pagination, A11y]}
              spaceBetween={24}
              slidesPerView={1.15}
              navigation
              pagination={{ clickable: true }}
              a11y={{ enabled: true }}
              breakpoints={{
                640: { slidesPerView: 2.1, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="!pb-12"
            >
              {teachers.map((teacher) => (
                <SwiperSlide key={teacher.id} className="!h-auto">
                  <TeacherCard teacher={teacher} onOpen={handleOpen} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Кастомные стрелки (desktop) */}
            {swiperInstance ? (
              <div className="pointer-events-none absolute inset-y-0 -left-2 -right-2 hidden items-center justify-between lg:flex">
                <button
                  type="button"
                  onClick={() => swiperInstance.slidePrev()}
                  aria-label="Предыдущий преподаватель"
                  className={cn(
                    "pointer-events-auto grid h-11 w-11 place-items-center rounded-full",
                    "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md",
                    "text-[var(--color-text)]",
                    "transition-colors duration-200 ease-out",
                    "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                  )}
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  type="button"
                  onClick={() => swiperInstance.slideNext()}
                  aria-label="Следующий преподаватель"
                  className={cn(
                    "pointer-events-auto grid h-11 w-11 place-items-center rounded-full",
                    "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md",
                    "text-[var(--color-text)]",
                    "transition-colors duration-200 ease-out",
                    "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                  )}
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>

      {/* Модальное окно */}
      <TeacherModal
        teacher={selectedTeacher}
        open={isModalOpen}
        onClose={handleClose}
      />
    </section>
  );
}