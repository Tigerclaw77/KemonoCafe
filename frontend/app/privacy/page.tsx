export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cafe-gradient px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">
          Privacy Policy
        </h1>

        <p className="text-sm text-slate-700 mb-4">
          Your privacy matters. This policy explains what Kemono Café collects
          and how it is used.
        </p>

        <ul className="space-y-3 text-sm text-slate-700">
          <li>
            • We collect your email address if you create an account or choose
            to save your place.
          </li>
          <li>
            • We store usage data such as message counts to operate the service.
          </li>
          <li>
            • Payments are processed securely by third-party providers (we do
            not store payment details).
          </li>
          <li>
            • We do not sell your personal information.
          </li>
          <li>
            • You may request account deletion by contacting support.
          </li>
        </ul>

        <p className="text-xs text-slate-500 mt-6">
          Hosting and data services are provided by trusted infrastructure
          partners.
        </p>

        <p className="text-xs text-slate-500 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </main>
  );
}
