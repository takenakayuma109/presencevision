"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Select,
  Textarea,
  Badge,
} from "@/components/ui";
import {
  MessageSquare,
  ShieldAlert,
  Target,
  Sliders,
  Clock,
  X,
  Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tone = "Professional" | "Casual" | "Friendly" | "Authoritative" | "Playful";

interface ChannelToneRule {
  channel: string;
  tone: Tone;
}

interface PostingSchedule {
  channel: string;
  postsPerDay: number;
  startHour: number;
  endHour: number;
  timezone: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TONES: { value: Tone; label: string }[] = [
  { value: "Professional", label: "Professional" },
  { value: "Casual", label: "Casual" },
  { value: "Friendly", label: "Friendly" },
  { value: "Authoritative", label: "Authoritative" },
  { value: "Playful", label: "Playful" },
];

const TONE_PREVIEWS: Record<Tone, string> = {
  Professional:
    "本製品は、最先端のAI技術を活用し、デジタルプレゼンスの最適化を実現します。データドリブンなアプローチにより、確実な成果をお約束いたします。",
  Casual:
    "このツール、めっちゃ便利！AIが勝手にSEOやってくれるから、自分は好きなことに集中できるよ。マジでおすすめ。",
  Friendly:
    "PresenceVisionを使えば、SEOの面倒な作業はAIにおまかせ！あなたのビジネスをもっと多くの人に届けるお手伝いをしますね。",
  Authoritative:
    "当社の独自エンジンは、20以上のチャネルへの自律配信を実現する唯一のソリューションです。API課金ゼロという業界初のアプローチが、圧倒的なコスト優位性を生み出します。",
  Playful:
    "SEOって退屈？いやいや、PresenceVisionなら全自動でワクワクする結果が出ちゃいます！寝てる間にAIがガンガン記事を配信してくれるって、最高じゃないですか？",
};

const DEFAULT_NG_WORDS = ["政治", "宗教", "競合批判"];
const DEFAULT_NG_TOPICS = ["暴力", "差別", "ギャンブル"];
const DEFAULT_TOPICS = ["SaaS", "SEO", "プロダクティビティ"];

const CONNECTED_CHANNELS = [
  "Twitter / X",
  "LinkedIn",
  "Instagram",
  "note.com",
  "Qiita",
  "Medium",
];

const TIMEZONES = [
  "Asia/Tokyo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Shanghai",
  "Asia/Seoul",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ------------------------------------------------------------------ */
/*  Tag Input Component                                                */
/* ------------------------------------------------------------------ */

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onAdd(input.trim());
      }
      setInput("");
    }
  };

  const handleAdd = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Brand Config Component                                             */
/* ------------------------------------------------------------------ */

export function BrandConfig() {
  // B1: Brand Voice
  const [tone, setTone] = useState<Tone>("Professional");
  const [customVoice, setCustomVoice] = useState("プロフェッショナルだが親しみやすい");

  // B2: NG Words/Topics
  const [ngWords, setNgWords] = useState<string[]>(DEFAULT_NG_WORDS);
  const [ngTopics, setNgTopics] = useState<string[]>(DEFAULT_NG_TOPICS);

  // B3: Topic Scope
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);

  // B4: Channel-specific Tone Rules
  const [channelTones, setChannelTones] = useState<ChannelToneRule[]>(
    CONNECTED_CHANNELS.map((ch) => ({
      channel: ch,
      tone: ch === "Twitter / X" || ch === "Instagram" ? "Casual" : "Professional",
    })),
  );

  // B5: Posting Schedule
  const [schedules, setSchedules] = useState<PostingSchedule[]>(
    CONNECTED_CHANNELS.map((ch) => ({
      channel: ch,
      postsPerDay: 3,
      startHour: 8,
      endHour: 22,
      timezone: "Asia/Tokyo",
    })),
  );

  const updateChannelTone = useCallback(
    (channel: string, newTone: Tone) => {
      setChannelTones((prev) =>
        prev.map((ct) => (ct.channel === channel ? { ...ct, tone: newTone } : ct)),
      );
    },
    [],
  );

  const updateSchedule = useCallback(
    (channel: string, field: keyof PostingSchedule, value: number | string) => {
      setSchedules((prev) =>
        prev.map((s) => (s.channel === channel ? { ...s, [field]: value } : s)),
      );
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* ---- B1: Brand Voice ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> ブランドボイス
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">トーン</label>
            <Select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">カスタムボイス説明</label>
            <Textarea
              value={customVoice}
              onChange={(e) => setCustomVoice(e.target.value)}
              placeholder="ブランドの声のトーンを自由に記述してください"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">プレビュー</label>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {TONE_PREVIEWS[tone]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- B2: NG Words/Topics ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> NGワード・トピック
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">ブロックするワード</label>
            <TagInput
              tags={ngWords}
              onAdd={(w) => setNgWords((prev) => [...prev, w])}
              onRemove={(w) => setNgWords((prev) => prev.filter((t) => t !== w))}
              placeholder="NGワードを入力してEnter"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">ブロックするトピック</label>
            <TagInput
              tags={ngTopics}
              onAdd={(t) => setNgTopics((prev) => [...prev, t])}
              onRemove={(t) => setNgTopics((prev) => prev.filter((x) => x !== t))}
              placeholder="NGトピックを入力してEnter"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---- B3: Topic Scope ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" /> トピック範囲
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">許可するトピック・テーマ</label>
            <TagInput
              tags={topics}
              onAdd={(t) => setTopics((prev) => [...prev, t])}
              onRemove={(t) => setTopics((prev) => prev.filter((x) => x !== t))}
              placeholder="トピックを入力してEnter"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---- B4: Channel-specific Tone Rules ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sliders className="h-4 w-4" /> チャネル別トーン設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channelTones.map((ct) => (
              <div key={ct.channel} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium min-w-[120px]">{ct.channel}</span>
                <Select
                  value={ct.tone}
                  onChange={(e) => updateChannelTone(ct.channel, e.target.value as Tone)}
                  className="max-w-[180px]"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
          {CONNECTED_CHANNELS.length === 0 && (
            <p className="text-sm text-muted-foreground">
              接続済みチャネルがありません。チャネル接続タブから接続してください。
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---- B5: Posting Schedule ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" /> 投稿スケジュール
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((s) => (
              <div
                key={s.channel}
                className="rounded-lg border p-4 space-y-3"
              >
                <p className="text-sm font-semibold">{s.channel}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Posts per day */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">投稿数/日</label>
                    <Select
                      value={String(s.postsPerDay)}
                      onChange={(e) =>
                        updateSchedule(s.channel, "postsPerDay", Number(e.target.value))
                      }
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Start hour */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">開始時刻</label>
                    <Select
                      value={String(s.startHour)}
                      onChange={(e) =>
                        updateSchedule(s.channel, "startHour", Number(e.target.value))
                      }
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* End hour */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">終了時刻</label>
                    <Select
                      value={String(s.endHour)}
                      onChange={(e) =>
                        updateSchedule(s.channel, "endHour", Number(e.target.value))
                      }
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">タイムゾーン</label>
                    <Select
                      value={s.timezone}
                      onChange={(e) =>
                        updateSchedule(s.channel, "timezone", e.target.value)
                      }
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button>設定を保存</Button>
      </div>
    </div>
  );
}
