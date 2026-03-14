"use client";

import { Dialog } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { StepUrl } from "./step-url";
import { StepConfig } from "./step-config";
import { StepNotes } from "./step-notes";
import { StepPlan } from "./step-plan";

const steps = [
  { num: 1, label: "URL入力" },
  { num: 2, label: "設定" },
  { num: 3, label: "要望" },
  { num: 4, label: "プラン確認" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                s.num === current
                  ? "bg-foreground text-background"
                  : s.num < current
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {s.num < current ? "✓" : s.num}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:inline",
                s.num === current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-8",
                s.num < current ? "bg-green-300 dark:bg-green-700" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function ProjectWizard() {
  const { wizard, wizardOpen, closeWizard } = useStore();

  return (
    <Dialog open={wizardOpen} onClose={closeWizard} title="新規プロジェクト">
      <div className="min-h-[400px]">
        <StepIndicator current={wizard.step} />
        {wizard.step === 1 && <StepUrl />}
        {wizard.step === 2 && <StepConfig />}
        {wizard.step === 3 && <StepNotes />}
        {wizard.step === 4 && <StepPlan />}
      </div>
    </Dialog>
  );
}
