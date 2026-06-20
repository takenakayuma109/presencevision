"use client";

import { useState, useEffect } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { Building2, CheckCircle, ArrowRight, Loader2, Upload } from "lucide-react";
import Link from "next/link";

const INDUSTRY_OPTIONS = [
  "IT・通信",
  "製造",
  "サービス",
  "小売・EC",
  "メディア",
  "教育",
  "医療・ヘルスケア",
  "金融",
  "不動産",
  "その他",
];

const EMPLOYEE_OPTIONS = [
  "1-10",
  "11-50",
  "51-100",
  "101-500",
  "501-1000",
  "1001+",
];

const REVENUE_OPTIONS = [
  "〜1,000万",
  "1,000万〜5,000万",
  "5,000万〜1億",
  "1億〜10億",
  "10億〜100億",
  "100億〜",
];

const LISTING_OPTIONS = [
  "未上場",
  "東証プライム",
  "東証スタンダード",
  "東証グロース",
  "その他",
];

interface FormData {
  companyName: string;
  companyNameEn: string;
  representative: string;
  foundedDate: string;
  industry: string;
  employeeCount: string;
  headquarters: string;
  companyUrl: string;
  description: string;
  capital: string;
  revenueScale: string;
  listingStatus: string;
  logoUrl: string;
}

const initialFormData: FormData = {
  companyName: "",
  companyNameEn: "",
  representative: "",
  foundedDate: "",
  industry: "",
  employeeCount: "",
  headquarters: "",
  companyUrl: "",
  description: "",
  capital: "",
  revenueScale: "",
  listingStatus: "",
  logoUrl: "",
};

export default function CompanyRegistrationPage() {
  const [form, setForm] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/company-profile");
        if (!res.ok) return;
        const data = await res.json();
        if (data.companyProfile) {
          const cp = data.companyProfile;
          setForm({
            companyName: cp.companyName || "",
            companyNameEn: cp.companyNameEn || "",
            representative: cp.representative || "",
            foundedDate: cp.foundedDate || "",
            industry: cp.industry || "",
            employeeCount: cp.employeeCount || "",
            headquarters: cp.headquarters || "",
            companyUrl: cp.companyUrl || "",
            description: cp.description || "",
            capital: cp.capital?.toString() || "",
            revenueScale: cp.revenueScale || "",
            listingStatus: cp.listingStatus || "",
            logoUrl: cp.logoUrl || "",
          });
        }
      } catch {
        // ignore – form starts empty
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ロゴ添付: ブラウザ側で最大256pxに縮小しWebP圧縮 → 小さなdataURL(約10〜20KB)にして保存。
  // 生画像を保存しないのでDB・エンジンへの転送が重くならない。
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("画像は10MB以下を選択してください");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 256;
        let { width, height } = img;
        if (width >= height && width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      };
      img.onerror = () => setError("画像を読み込めませんでした");
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        capital: form.capital ? Number(form.capital) : null,
        revenueScale: form.revenueScale || null,
        listingStatus: form.listingStatus || null,
        logoUrl: form.logoUrl || null,
      };

      const res = await fetch("/api/company-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">企業情報が登録されました</h2>
        <p className="text-sm text-muted-foreground mb-6">
          プロジェクトを作成できるようになりました
        </p>
        <Link href="/dashboard">
          <Button className="gap-2">
            プロジェクトを作成する <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">企業登録</h2>
          <p className="text-sm text-muted-foreground">
            プロジェクト作成前に企業情報を登録してください
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left column: 基本情報 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">基本情報</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                企業名 <span className="text-destructive">*</span>
              </label>
              <Input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="株式会社サンプル"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                企業名（英語） <span className="text-destructive">*</span>
              </label>
              <Input
                name="companyNameEn"
                value={form.companyNameEn}
                onChange={handleChange}
                placeholder="Sample Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                代表者名 <span className="text-destructive">*</span>
              </label>
              <Input
                name="representative"
                value={form.representative}
                onChange={handleChange}
                placeholder="山田 太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                設立年月 <span className="text-destructive">*</span>
              </label>
              <Input
                name="foundedDate"
                type="month"
                value={form.foundedDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                業種 <span className="text-destructive">*</span>
              </label>
              <Select
                name="industry"
                value={form.industry}
                onChange={handleChange}
                required
              >
                <option value="">選択してください</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                従業員数 <span className="text-destructive">*</span>
              </label>
              <Select
                name="employeeCount"
                value={form.employeeCount}
                onChange={handleChange}
                required
              >
                <option value="">選択してください</option>
                {EMPLOYEE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                本社所在地 <span className="text-destructive">*</span>
              </label>
              <Input
                name="headquarters"
                value={form.headquarters}
                onChange={handleChange}
                placeholder="東京都渋谷区..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                企業URL <span className="text-destructive">*</span>
              </label>
              <Input
                name="companyUrl"
                type="url"
                value={form.companyUrl}
                onChange={handleChange}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                企業概要 <span className="text-destructive">*</span>
              </label>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="企業の概要を入力してください（最大500文字）"
                maxLength={500}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length}/500
              </p>
            </div>
          </div>

          {/* Right column: ファイナンス情報 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">
              ファイナンス情報
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">資本金（万円）</label>
              <Input
                name="capital"
                type="number"
                value={form.capital}
                onChange={handleChange}
                placeholder="1000"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">売上規模</label>
              <Select
                name="revenueScale"
                value={form.revenueScale}
                onChange={handleChange}
              >
                <option value="">選択してください</option>
                {REVENUE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">上場区分</label>
              <Select
                name="listingStatus"
                value={form.listingStatus}
                onChange={handleChange}
              >
                <option value="">選択してください</option>
                {LISTING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ロゴ（画像を添付）</label>
              {form.logoUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.logoUrl}
                    alt="ロゴ"
                    className="h-16 w-16 rounded-lg border border-border bg-white object-contain p-1"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="cursor-pointer text-sm text-blue-500 hover:underline">
                      画像を変更
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFile}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, logoUrl: "" }))}
                      className="text-left text-sm text-muted-foreground hover:text-destructive"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-blue-500/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    クリックして画像を添付
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    PNG・JPG等／自動で軽量化して保存（約10〜20KB）
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFile}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                アップロード時にブラウザ側で縮小・圧縮するため重くなりません。任意項目です。
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={saving} className="gap-2 min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 保存中...
              </>
            ) : (
              "企業情報を保存"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
