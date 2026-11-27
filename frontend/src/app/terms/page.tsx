export const metadata = {
  title: "Terms of Service — Zenvyra",
  description: "Terms of Service for Zenvyra AI Photo-Editing Platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Last updated: November 2026
      </p>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          1. Use of Service
        </h2>
        <p>
          Zenvyra provides AI-powered photo editing and image generation tools.
          You retain full ownership of all images you upload and export.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          2. Acceptable Content
        </h2>
        <p>
          You agree not to upload illegal, infringing, or harmful content and to
          comply with applicable laws when using Zenvyra.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          3. Contact
        </h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href="mailto:gurralaammureddy@gmail.com"
            className="text-violet-600 dark:text-violet-400 underline"
          >
            gurralaammureddy@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
