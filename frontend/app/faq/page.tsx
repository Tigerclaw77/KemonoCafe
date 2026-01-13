export default function FaqPage() {
  return (
    <main className="min-h-screen bg-cafe-gradient px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">
          Frequently Asked Questions
        </h1>

        <div className="space-y-5 text-sm text-slate-700">
          <div>
            <h2 className="font-semibold text-slate-800">
              Is Kemono Café free?
            </h2>
            <p>
              Yes. Signed-in guests receive free daily messages. Additional
              messages and features can be unlocked through the café.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              What does nomination do?
            </h2>
            <p>
              Nomination gives you unlimited chat time with a hostess for a
              limited period.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              Do the hostesses remember me?
            </h2>
            <p>
              Yes — when you’re signed in, conversations and preferences can be
              remembered between visits.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              Are the hostesses real people?
            </h2>
            <p>
              No. They are AI characters designed for conversation and
              companionship.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              Is my information safe?
            </h2>
            <p>
              We collect only what’s necessary to run the service and do not
              sell personal data.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          Still have questions? You can reach us at{" "}
          <a
            href="mailto:support@kemonocafe.ai"
            className="text-pink-600 hover:underline"
          >
            support@kemonocafe.ai
          </a>
        </p>
      </div>
    </main>
  );
}
