"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface PaymentTimerProps {
  expiresAt: string;
  status: "waiting" | "confirmed" | "expired" | "error";
  onExpire?: () => void;
}

export function PaymentTimer({ expiresAt, status, onExpire }: PaymentTimerProps) {
  const expiryMs = new Date(expiresAt).getTime();

  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((expiryMs - Date.now()) / 1000))
  );
  const [totalTime] = useState(() =>
    Math.max(0, Math.floor((expiryMs - Date.now()) / 1000))
  );

  useEffect(() => {
    if (status !== "waiting") return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryMs, status, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const isUrgent = timeLeft < 120 && timeLeft > 0;

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  const statusColor =
    status === "confirmed"
      ? "#CCFF00"
      : status === "expired" || status === "error"
        ? "#D63384"
        : isUrgent
          ? "#D63384"
          : "#25B8B8";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          {status === "waiting" && (
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={statusColor}
              strokeWidth="4"
              strokeLinecap="square"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
              style={{ filter: `drop-shadow(0 0 6px ${statusColor}40)` }}
            />
          )}
          {status === "confirmed" && (
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#CCFF00"
              strokeWidth="4"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {status === "waiting" && (
            <>
              <motion.div
                animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
              >
                <Clock
                  className="w-5 h-5 mb-1"
                  style={{ color: statusColor }}
                />
              </motion.div>
              <span
                className="font-display font-black text-2xl tabular-nums"
                style={{ color: statusColor }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-brm-text-muted uppercase tracking-wider font-semibold">
                restante
              </span>
            </>
          )}

          {status === "confirmed" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="flex flex-col items-center"
            >
              <CheckCircle className="w-8 h-8 text-[#CCFF00] mb-1" />
              <span className="font-display font-black text-xs text-[#CCFF00] uppercase">
                Confirmado
              </span>
            </motion.div>
          )}

          {status === "expired" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <AlertTriangle className="w-8 h-8 text-[#D63384] mb-1" />
              <span className="font-display font-black text-xs text-[#D63384] uppercase">
                Expirado
              </span>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <AlertTriangle className="w-8 h-8 text-[#D63384] mb-1" />
              <span className="font-display font-black text-xs text-[#D63384] uppercase">
                Erro
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {status === "waiting" && (
        <motion.div
          className="w-full max-w-[200px] h-1 bg-white/5 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full"
            style={{ backgroundColor: statusColor }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </motion.div>
      )}
    </div>
  );
}
