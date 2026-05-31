import type { Metadata } from "next";
import { EasingPreviews } from "./easing-previews";

export const metadata: Metadata = {
  title: "Specimen — Design Tokens",
  robots: { index: false, follow: false },
};

const COLORS = [
  { name: "bg", value: "#0A0A0A" },
  { name: "bg-alt", value: "#141414" },
  { name: "fg", value: "#F5F1EA" },
  { name: "fg-muted", value: "#8A8680" },
  { name: "fg-dim", value: "#4A4742" },
  { name: "accent", value: "#D4A574" },
  { name: "accent-2", value: "#5C6B5E" },
] as const;

const TYPE_SCALE = [
  { token: "text-display", className: "text-[length:var(--text-display)] leading-[0.95] tracking-[-0.02em]" },
  { token: "text-h1", className: "text-[length:var(--text-h1)] leading-[1] tracking-[-0.02em]" },
  { token: "text-h2", className: "text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]" },
  { token: "text-h3", className: "text-[length:var(--text-h3)] leading-[1.2] tracking-[-0.01em]" },
  { token: "text-body-lg", className: "text-[length:var(--text-body-lg)] leading-[1.6]" },
  { token: "text-body", className: "text-[length:var(--text-body)] leading-[1.6]" },
  { token: "text-caption", className: "text-[length:var(--text-caption)] leading-[1.4] tracking-[0.1em] uppercase" },
] as const;

const BILINGUAL_SAMPLE = "Tokyo-born — Đến từ Tokyo. Creative studio, hội tụ không giới hạn.";

export default function SpecimenPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-(--spacing-section-x) py-(--spacing-section-y) space-y-24">
      <header className="space-y-2">
        <p className="text-[length:var(--text-caption)] tracking-[0.1em] uppercase text-[var(--color-fg-muted)]">
          /specimen
        </p>
        <h1 className="text-[length:var(--text-h1)] leading-[1] tracking-[-0.02em]">
          Design tokens
        </h1>
        <p className="text-[length:var(--text-body-lg)] text-[var(--color-fg-muted)] max-w-prose">
          Visual proof for the brand palette, type scale, spacing rhythm, and motion easings.
          Not linked from the site. Bilingual sample confirms the Vietnamese subset loads.
        </p>
      </header>

      <section aria-labelledby="colors-heading" className="space-y-6">
        <h2 id="colors-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Colors
        </h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {COLORS.map((c) => (
            <li key={c.name} className="space-y-2">
              <div
                className="h-24 w-full rounded border border-[var(--color-fg-dim)]"
                style={{ background: c.value }}
              />
              <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                color-{c.name}
              </div>
              <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-fg)]">
                {c.value}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="type-heading" className="space-y-8">
        <h2 id="type-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Type scale
        </h2>
        <ul className="space-y-6">
          {TYPE_SCALE.map((t) => (
            <li key={t.token} className="space-y-1">
              <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                {t.token}
              </div>
              <p className={t.className}>{BILINGUAL_SAMPLE}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="italic-heading" className="space-y-4">
        <h2 id="italic-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Italic + roman
        </h2>
        <p className="text-[length:var(--text-h3)] leading-[1.2]">
          Tokyo-born, <em className="italic">Creative studio</em>. Đến từ Tokyo,{" "}
          <em className="italic">hội tụ không giới hạn</em>.
        </p>
      </section>

      <section aria-labelledby="spacing-heading" className="space-y-4">
        <h2 id="spacing-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Spacing
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
              spacing-section-x
            </div>
            <div className="h-6 bg-[var(--color-accent)]" style={{ width: "var(--spacing-section-x)" }} />
          </div>
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
              spacing-section-y
            </div>
            <div className="w-6 bg-[var(--color-accent-2)]" style={{ height: "var(--spacing-section-y)" }} />
          </div>
        </div>
      </section>

      <section aria-labelledby="motion-heading" className="space-y-4">
        <h2 id="motion-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Motion
        </h2>
        <p className="text-[length:var(--text-body)] text-[var(--color-fg-muted)]">
          Hover or focus each row to play the easing at duration-base (600ms).
          Under prefers-reduced-motion the dot should snap.
        </p>
        <EasingPreviews />
      </section>

      <section aria-labelledby="mono-heading" className="space-y-4">
        <h2 id="mono-heading" className="text-[length:var(--text-h2)] leading-[1.05] tracking-[-0.01em]">
          Mono
        </h2>
        <pre className="bg-[var(--color-bg-alt)] rounded p-4 font-[var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-fg)] overflow-x-auto">
{`// Tagline cycle — chu kỳ khẩu hiệu
const phrases = [
  "Creative studio, Đến từ Tokyo",
  "Tokyo-born, Creative studio",
  "Hội tụ, Không giới hạn",
];`}
        </pre>
      </section>
    </main>
  );
}
