"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export default function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: ToastType;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors: Record<ToastType, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-mosque-dark",
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-0 flex justify-center z-50 px-4">
      <div className={`text-white text-sm px-4 py-3 rounded-xl shadow-lg ${colors[type]}`}>
        {message}
      </div>
    </div>
  );
}
