"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface CheckoutStepperProps {
  steps: Step[];
  currentStep: number;
}

export function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-white/10" />
        <motion.div
          className="absolute top-5 left-0 h-[2px] bg-[#25B8B8]"
          initial={{ width: "0%" }}
          animate={{
            width: `${Math.max(0, ((currentStep) / (steps.length - 1)) * 100)}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  w-10 h-10 flex items-center justify-center
                  transition-all duration-300
                  ${
                    isCompleted
                      ? "bg-[#25B8B8] text-white"
                      : isActive
                        ? "bg-[#25B8B8]/20 text-[#25B8B8] border-2 border-[#25B8B8]"
                        : "bg-white/5 text-white/30 border border-white/10"
                  }
                `}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <span className="text-sm">{step.icon}</span>
                )}
              </motion.div>

              <span
                className={`
                  font-display text-[9px] uppercase tracking-wider font-bold
                  transition-colors duration-300 text-center max-w-[60px] leading-tight
                  ${
                    isCompleted
                      ? "text-[#25B8B8]"
                      : isActive
                        ? "text-white"
                        : isPending
                          ? "text-white/30"
                          : ""
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
