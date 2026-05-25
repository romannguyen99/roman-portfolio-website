export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8 gap-8">
      <p className="font-mono uppercase tracking-[0.2em] text-[var(--text-caption)] text-[var(--color-fg-muted)]">
        Step 01 — Scaffold
      </p>
      <h1 className="text-[var(--text-display)] leading-[0.95] tracking-[-0.02em] text-center">
        hello sa<span className="italic">i</span>gon
      </h1>
      <p className="text-[var(--text-body)] text-[var(--color-fg-muted)] max-w-md text-center">
        Theme tokens, fonts, and smooth scroll are wired. Ready for Step 02.
      </p>
      <div className="flex gap-4 text-[var(--text-caption)] font-mono uppercase tracking-[0.1em]">
        <span style={{ color: "var(--color-accent)" }}>accent</span>
        <span style={{ color: "var(--color-accent-2)" }}>accent-2</span>
        <span style={{ color: "var(--color-fg-muted)" }}>muted</span>
        <span style={{ color: "var(--color-fg-dim)" }}>dim</span>
      </div>
      <div className="h-[200vh]" aria-hidden />
    </main>
  );
}
