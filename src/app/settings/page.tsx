export default function SettingsPage() {
  return (
    <main className="min-h-screen w-full theme-page p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold theme-text">Settings</h1>
          <p className="mt-2 text-sm theme-muted">
            Tune your experience. More options will land here soon.
          </p>
        </div>
        <section className="rounded-2xl border theme-panel p-6 shadow backdrop-blur">
          <div className="text-sm font-semibold theme-text">Quick controls</div>
          <p className="mt-2 text-sm theme-muted">
            Use the chat header toggles for focus mode, privacy blur, and theme.
          </p>
        </section>
      </div>
    </main>
  );
}
