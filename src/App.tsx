import { useState } from "react";
import {
  AlertCircle,
  Check,
  Clipboard,
  Copy,
  Loader2,
  MessageCircle,
  PenLine,
  RefreshCcw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { FormState, GeneratedResult } from "./lib/copyGenerator";
import { accountTypes, generateMockResult, platforms, styles } from "./lib/copyGenerator";

type GenerationMeta = {
  source: "openai" | "mock";
  model?: string;
  notice?: string;
};

type ApiGenerateResponse = {
  result: GeneratedResult;
  source: "openai" | "mock";
  model?: string;
  notice?: string;
};

const formatSection = (title: string, content: string[] | string) => {
  if (Array.isArray(content)) {
    return `${title}\n${content.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
  }

  return `${title}\n${content}`;
};

const formatCompleteCopies = (items: GeneratedResult["completeCopies"]) =>
  `完整文案对比\n${items
    .map((item, index) => `版本${index + 1}：${item.label}\n角度：${item.angle}\n\n${item.copy}`)
    .join("\n\n")}`;

const copyText = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button className="icon-button" type="button" onClick={handleCopy} aria-label={label} title={label}>
      {copied ? <Check size={17} /> : <Copy size={17} />}
      <span>{copied ? "已复制" : label}</span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ListSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  const text = formatSection(title, items);

  return (
    <section className="result-panel">
      <div className="section-heading">
        <div className="title-row">
          {icon}
          <h2>{title}</h2>
        </div>
        <CopyButton text={text} label="复制整组" />
      </div>
      <div className="item-list">
        {items.map((item, index) => (
          <article className="copy-item" key={`${title}-${item}`}>
            <span className="item-index">{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
            <CopyButton text={item} />
          </article>
        ))}
      </div>
    </section>
  );
}

function CompleteCopySection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: GeneratedResult["completeCopies"];
}) {
  return (
    <section className="result-panel wide-panel">
      <div className="section-heading">
        <div className="title-row">
          {icon}
          <h2>{title}</h2>
        </div>
        <CopyButton text={formatCompleteCopies(items)} label="复制两版" />
      </div>
      <div className="comparison-grid">
        {items.map((item, index) => (
          <article className="comparison-card" key={`${item.label}-${index}`}>
            <div className="comparison-head">
              <span className="version-badge">{index === 0 ? "A" : "B"}</span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.angle}</p>
              </div>
            </div>
            <div className="long-copy comparison-copy">
              {item.copy.split("\n").map((line, lineIndex) => (
                <p key={`${item.label}-${lineIndex}`}>{line || "\u00A0"}</p>
              ))}
            </div>
            <CopyButton text={`${item.label}\n角度：${item.angle}\n\n${item.copy}`} label="复制此版" />
          </article>
        ))}
      </div>
    </section>
  );
}

function TextSection({
  icon,
  title,
  text,
  wide = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  wide?: boolean;
}) {
  return (
    <section className={wide ? "result-panel wide-panel" : "result-panel"}>
      <div className="section-heading">
        <div className="title-row">
          {icon}
          <h2>{title}</h2>
        </div>
        <CopyButton text={formatSection(title, text)} label="复制全文" />
      </div>
      <div className="long-copy">
        {text.split("\n").map((line, index) => (
          <p key={`${title}-${index}`}>{line || "\u00A0"}</p>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [form, setForm] = useState<FormState>({
    topic: "职场新人如何提升表达能力",
    platform: "抖音",
    accountType: "个人IP",
    style: "反差悬念",
  });
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<GeneratedResult>(() => generateMockResult(form, 0));
  const [meta, setMeta] = useState<GenerationMeta>({
    source: "mock",
    notice: "当前为本地模拟内容，配置 OPENAI_API_KEY 后会自动调用 API。",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleGenerate = async () => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, seed: nextSeed }),
      });

      if (!response.ok) {
        throw new Error("生成接口暂时不可用");
      }

      const data = (await response.json()) as ApiGenerateResponse;
      setResult(data.result);
      setMeta({ source: data.source, model: data.model, notice: data.notice });
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败";
      setResult(generateMockResult(form, nextSeed));
      setMeta({
        source: "mock",
        notice: `${message}，已回退本地模拟内容。`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAllText = [
    formatSection("爆款标题", result.titles),
    formatSection("开头钩子", result.hooks),
    formatCompleteCopies(result.completeCopies),
    formatSection("抖音口播文案", result.douyinScript),
    formatSection("小红书图文文案", result.xiaohongshuPost),
    formatSection("评论区引导话术", result.commentGuides),
    formatSection("私信转化话术", result.dmScripts),
  ].join("\n\n");

  const statusLabel = isGenerating ? "生成中" : meta.source === "openai" ? meta.model || "OpenAI API" : "本地模拟";

  return (
    <main className="app-shell">
      <aside className="control-panel">
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="eyebrow">Viral Copy Studio</p>
            <h1>短视频爆款文案生成器</h1>
          </div>
        </div>

        <div className="form-stack">
          <Field label="视频主题">
            <textarea
              aria-label="视频主题"
              value={form.topic}
              onChange={(event) => updateForm("topic", event.target.value)}
              placeholder="例如：普通人如何做个人IP"
              rows={4}
            />
          </Field>

          <Field label="目标平台">
            <div className="segmented">
              {platforms.map((platform) => (
                <button
                  className={form.platform === platform ? "active" : ""}
                  key={platform}
                  type="button"
                  onClick={() => updateForm("platform", platform)}
                >
                  {platform}
                </button>
              ))}
            </div>
          </Field>

          <Field label="账号类型">
            <select
              aria-label="账号类型"
              value={form.accountType}
              onChange={(event) => updateForm("accountType", event.target.value)}
            >
              {accountTypes.map((accountType) => (
                <option key={accountType}>{accountType}</option>
              ))}
            </select>
          </Field>

          <Field label="文案风格">
            <select aria-label="文案风格" value={form.style} onChange={(event) => updateForm("style", event.target.value)}>
              {styles.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="action-grid">
          <button className="primary-button" type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="spin" size={18} /> : <RefreshCcw size={18} />}
            {isGenerating ? "生成中" : "重新生成"}
          </button>
          <CopyButton text={copyAllText} label="复制全部" />
        </div>
      </aside>

      <section className="workspace">
        <div className="workspace-topbar">
          <div>
            <p className="eyebrow">Generated Output</p>
            <h2>已生成 34 条内容资产</h2>
          </div>
          <div className="status-pill">
            <Wand2 size={16} />
            {statusLabel}
          </div>
        </div>

        {meta.notice && (
          <div className="notice-bar">
            <AlertCircle size={17} />
            <span>{meta.notice}</span>
          </div>
        )}

        <div className="results-grid">
          <ListSection icon={<PenLine size={20} />} title="爆款标题" items={result.titles} />
          <ListSection icon={<Sparkles size={20} />} title="开头钩子" items={result.hooks} />
          <CompleteCopySection icon={<Clipboard size={20} />} title="完整文案 A/B 对比" items={result.completeCopies} />
          <TextSection icon={<Clipboard size={20} />} title="抖音口播文案" text={result.douyinScript} wide />
          <TextSection icon={<Clipboard size={20} />} title="小红书图文文案" text={result.xiaohongshuPost} wide />
          <ListSection icon={<MessageCircle size={20} />} title="评论区引导话术" items={result.commentGuides} />
          <ListSection icon={<Send size={20} />} title="私信转化话术" items={result.dmScripts} />
        </div>
      </section>
    </main>
  );
}
