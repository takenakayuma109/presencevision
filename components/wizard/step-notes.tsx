"use client";

import { useState } from "react";
import { Button, Input, Textarea, Badge } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { CmsConfig } from "@/lib/store";
import { ArrowLeft, Sparkles, Loader2, Mail, Clock, Plus, X, Link2 } from "lucide-react";
import { useTranslation } from "@/lib/hooks/use-translation";

export function StepNotes() {
  const { wizard, setWizardStep, setWizardNotes, setWizardReportConfig, generatePlan } = useStore();
  const [emailInput, setEmailInput] = useState("");
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [cmsConfig, setCmsConfig] = useState<CmsConfig>({ type: "wordpress", siteUrl: "", username: "", applicationPassword: "", defaultStatus: "draft" });
  const { t } = useTranslation();

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !wizard.reportConfig.emailAddresses.includes(email)) {
      setWizardReportConfig({ emailAddresses: [...wizard.reportConfig.emailAddresses, email] });
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setWizardReportConfig({ emailAddresses: wizard.reportConfig.emailAddresses.filter((e) => e !== email) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const handleGenerate = async () => {
    await generatePlan();
    setWizardStep(4);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950 mb-2">
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold">{t("wizard.step3Title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wizard.step3Subtitle")}</p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Report email */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t("wizard.reportEmail")}</h3>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="email@example.com"
              className="h-10 flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addEmail} className="h-10 gap-1">
              <Plus className="h-3.5 w-3.5" /> {t("wizard.add")}
            </Button>
          </div>
          {wizard.reportConfig.emailAddresses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {wizard.reportConfig.emailAddresses.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1 text-xs py-1 px-2">
                  {email}
                  <button onClick={() => removeEmail(email)} className="ml-0.5 hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("wizard.multipleEmails")}</p>
        </div>

        {/* Report times */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t("wizard.reportTime")}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("wizard.morningReport")}</label>
              <Input
                type="time"
                value={wizard.reportConfig.morningTime}
                onChange={(e) => setWizardReportConfig({ morningTime: e.target.value })}
                className="h-10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("wizard.eveningReport")}</label>
              <Input
                type="time"
                value={wizard.reportConfig.eveningTime}
                onChange={(e) => setWizardReportConfig({ eveningTime: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("wizard.dailyReport")}</p>
        </div>

        {/* CMS integration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t("wizard.cmsIntegration")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t("wizard.cmsDesc")}</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cmsEnabled}
              onChange={(e) => setCmsEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">{t("wizard.enableCms")}</span>
          </label>
          {cmsEnabled && (
            <div className="space-y-2 pl-6">
              <Badge variant="secondary" className="text-xs opacity-60">WordPress</Badge>
              <Input
                value={cmsConfig.siteUrl}
                onChange={(e) => setCmsConfig((c) => ({ ...c, siteUrl: e.target.value }))}
                placeholder={t("project.cmsSiteUrl")}
                className="h-9 text-sm"
              />
              <Input
                value={cmsConfig.username}
                onChange={(e) => setCmsConfig((c) => ({ ...c, username: e.target.value }))}
                placeholder={t("project.cmsUsername")}
                className="h-9 text-sm"
              />
              <Input
                type="password"
                value={cmsConfig.applicationPassword}
                onChange={(e) => setCmsConfig((c) => ({ ...c, applicationPassword: e.target.value }))}
                placeholder={t("project.cmsPassword")}
                className="h-9 text-sm"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("wizard.otherRequests")}</h3>
          <Textarea
            value={wizard.additionalNotes}
            onChange={(e) => setWizardNotes(e.target.value)}
            placeholder={t("wizard.otherRequestsPlaceholder")}
            rows={5}
            className="text-sm"
            disabled={wizard.isGeneratingPlan}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setWizardStep(2)} disabled={wizard.isGeneratingPlan} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("wizard.back")}
        </Button>
        <Button onClick={handleGenerate} disabled={wizard.isGeneratingPlan || wizard.reportConfig.emailAddresses.length === 0} className="gap-2">
          {wizard.isGeneratingPlan ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("wizard.generatingPlan")}</>
          ) : (
            <><Sparkles className="h-4 w-4" /> {t("wizard.generatePlan")}</>
          )}
        </Button>
      </div>
    </div>
  );
}
