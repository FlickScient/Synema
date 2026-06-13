import { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';

export function FlickScientOrb() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 z-50 w-14 h-14 rounded-full bg-gradient-brand animate-pulse-violet flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-synema-violet/30"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 w-80 md:w-96 bg-synema-card border border-synema-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-synema-border flex items-center justify-between bg-synema-surface">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">FlickScient AI</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-synema-surface rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm text-gray-300">
                    Ask me anything about this movie! I can provide insights, fun facts,
                    recommendations, or answer any questions you have.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (message.trim()) {
                  setMessage('');
                }
              }}
              className="p-4 border-t border-synema-border bg-synema-surface"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ask about this movie..."
                  className="flex-1 px-4 py-2 bg-synema-bg border border-synema-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-synema-violet text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-brand rounded-lg text-white hover:shadow-lg hover:shadow-synema-violet/20 transition-shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
