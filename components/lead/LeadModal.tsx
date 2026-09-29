"use client";

import { useCallback, useEffect, useState } from "react";

import { LeadForm } from "@/components/lead/LeadForm";
import { LeadFormSuccess } from "@/components/lead/LeadFormSuccess";
import { Modal } from "@/components/ui/Modal";
import { useLead } from "@/lib/lead/LeadContext";
import { cn } from "@/lib/utils";

// ==========================================================
// Компонент
// ==========================================================

export function LeadModal() {
  const { isOpen, options, closeModal } = useLead();
  const [isSuccess, setIsSuccess] = useState(false);

  // Сбрасываем состояние успеха при открытии
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSuccess = useCallback(() => {
    setIsSuccess(true);
  }, []);

  const handleClose = useCallback(() => {
    closeModal();
    // Небольшая задержка, чтобы состояние сбросилось после анимации закрытия
    window.setTimeout(() => setIsSuccess(false), 300);
  }, [closeModal]);

  // Автозакрытие при успехе через 5 секунд
  useEffect(() => {
    if (!isOpen || !isSuccess) return;
    const timeout = window.setTimeout(() => {
      handleClose();
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [isOpen, isSuccess, handleClose]);

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="md"
      title={isSuccess ? undefined : "Записаться на консультацию"}
      description={
        isSuccess
          ? undefined
          : "Заполните форму — менеджер свяжется с вами в течение рабочего дня"
      }
      hideClose={false}
    >
      {isSuccess ? (
        <LeadFormSuccess onClose={handleClose} />
      ) : (
        <div className={cn("flex flex-col gap-4")}>
          <LeadForm
            presetCourseId={options.courseId}
            source={options.source ?? "modal"}
            onSuccess={handleSuccess}
            showCourseSelect
          />
        </div>
      )}
    </Modal>
  );
}