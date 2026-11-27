export const metadata = {
  title: "Privacy Policy — Zenvyra",
  description: "Privacy Policy for Zenvyra AI Photo-Editing Platform.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Last updated: November 2026
      </p>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          1. Information We Collect
        </h2>
        <p>
          When you sign in to Zenvyra using Email or Google Sign-In, we receive your
          name, email address, and profile identifier solely to authenticate your
          account and manage your daily AI editing credits.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          2. Uploaded Images &amp; 24-Hour Deletion
        </h2>
        <p>
          Images you upload to Zenvyra are processed only to perform the editing
          action you request (background removal, upscaling, object removal,
          restoration, or passport formatting). Temporary files are automatically
          deleted within 24 hours and are never sold or shared with third parties.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          3. Third-Party Services
        </h2>
        <p>
          We use Supabase for authentication and database storage, Vercel for
          frontend hosting, and Render for AI image processing.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          4. Contact
        </h2>
        <p>
          For privacy questions or data deletion requests, contact{" "}
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
