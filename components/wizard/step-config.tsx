"use client";

import { Button } from "@/components/ui";
import { useStore, goalLabels, methodLabels, audienceLabels, durationLabels, availableCountries } from "@/lib/store";
import type { PresenceGoal, PresenceMethod, TargetAudience } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Target, Building2, Globe, Users, Wrench, Clock } from "lucide-react";

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Section({ icon: Icon, title, subtitle }: { icon: typeof Target; title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 ml-6">{subtitle}</p>}
    </div>
  );
}

export function StepConfig() {
  const {
    wizard, setWizardStep,
    setWizardGoals, setWizardBusinessCountries, setWizardPresenceCountries,
    setWizardAudiences, setWizardMethods, setWizardDuration,
  } = useStore();

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  const canProceed = wizard.goals.length > 0 && wizard.businessCountries.length > 0
    && wizard.presenceCountries.length > 0 && wizard.methods.length > 0;

  return (
    <div className="space-y-7">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">プロジェクトの設定</h2>
        <p className="text-sm text-muted-foreground">目的・対象国・手段を選択してください</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Section icon={Target} title="目的（複数選択可）" />
          <div className="flex flex-wrap gap-2">
            {(Object.entries(goalLabels) as [PresenceGoal, string][]).map(([k, v]) => (
              <ToggleChip key={k} label={v} selected={wizard.goals.includes(k)} onClick={() => setWizardGoals(toggle(wizard.goals, k))} />
            ))}
          </div>
        </div>

        <div>
          <Section icon={Building2} title="事業ターゲット国" subtitle="ビジネスの対象となる国・地域" />
          <div className="flex flex-wrap gap-2">
            {availableCountries.filter((c) => c.code !== "GLOBAL").map((c) => (
              <ToggleChip key={c.code} label={`${c.flag} ${c.name}`} selected={wizard.businessCountries.includes(c.code)} onClick={() => setWizardBusinessCountries(toggle(wizard.businessCountries, c.code))} />
            ))}
          </div>
        </div>

        <div>
          <Section icon={Globe} title="プレゼンス拡散国" subtitle="デジタル存在を高めたい国・地域（事業国以外でもOK）" />
          <div className="flex flex-wrap gap-2">
            {availableCountries.map((c) => (
              <ToggleChip key={c.code} label={`${c.flag} ${c.name}`} selected={wizard.presenceCountries.includes(c.code)} onClick={() => setWizardPresenceCountries(toggle(wizard.presenceCountries, c.code))} />
            ))}
          </div>
        </div>

        <div>
          <Section icon={Users} title="ターゲットオーディエンス" />
          <div className="flex flex-wrap gap-2">
            {(Object.entries(audienceLabels) as [TargetAudience, string][]).map(([k, v]) => (
              <ToggleChip key={k} label={v} selected={wizard.audiences.includes(k)} onClick={() => setWizardAudiences(toggle(wizard.audiences, k))} />
            ))}
          </div>
        </div>

        <div>
          <Section icon={Wrench} title="プレゼンス強化手段" />
          <div className="flex flex-wrap gap-2">
            {(Object.entries(methodLabels) as [PresenceMethod, string][]).map(([k, v]) => (
              <ToggleChip key={k} label={v} selected={wizard.methods.includes(k)} onClick={() => setWizardMethods(toggle(wizard.methods, k))} />
            ))}
          </div>
        </div>

        <div>
          <Section icon={Clock} title="実施期間" />
          <div className="flex flex-wrap gap-2">
            {(Object.entries(durationLabels) as [string, string][]).map(([k, v]) => (
              <ToggleChip key={k} label={v} selected={wizard.duration === k} onClick={() => setWizardDuration(k as typeof wizard.duration)} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> 戻る
        </Button>
        <Button onClick={() => setWizardStep(3)} disabled={!canProceed} className="gap-2">
          次へ <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
