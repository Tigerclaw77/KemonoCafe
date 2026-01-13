export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cafe-gradient px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">
          Terms of Service
        </h1>

        <p className="text-sm text-slate-700 mb-4">
          Kemono Café is an interactive entertainment experience. By using this
          site, you agree to the following terms.
        </p>

        <ul className="space-y-3 text-sm text-slate-700">
          <li>
            • You must be at least <strong>18 years old</strong> to use this
            service.
          </li>
          <li>
            • Conversations are for entertainment purposes only and do not
            constitute advice or guarantees of availability.
          </li>
          <li>
            • Message credits, café items, and nominations are{" "}
            <strong>non-refundable</strong>.
          </li>
          <li>
            • Abuse, harassment, or attempts to exploit the service may result
            in suspension or termination.
          </li>
          <li>
            • We may update or modify the service at any time.
          </li>
        </ul>

        <p className="text-xs text-slate-500 mt-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </main>
  );
}
