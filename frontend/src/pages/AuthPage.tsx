import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, CheckCircle2, ShieldCheck } from 'lucide-react'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col items-center justify-center min-h-[75vh]">
      {/* Back Link */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6282] hover:text-[#DF6951] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Overview</span>
        </Link>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#DF6951] via-[#14B8A6] to-[#F1A501]" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#181E4B] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#181E4B]/10">
            <Lock className="w-6 h-6 text-[#14B8A6]" />
          </div>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#181E4B]">
            Invora Access
          </h2>
          <p className="text-xs text-[#5E6282] mt-1">
            Enterprise Warehouse Authentication Gateway
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-panel-expand">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-900 text-sm">Authentication Initialized</h4>
            <p className="text-xs text-emerald-700">
              Connecting securely to Spring Boot JWT security layer for <strong>{email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs font-semibold text-emerald-800 underline hover:no-underline pt-2 block mx-auto"
            >
              Sign in with different credentials
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase font-mono text-gray-700 mb-2">
                Work Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@invora.internal"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#DF6951] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase font-mono text-gray-700 mb-2">
                Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#DF6951] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#181E4B] hover:bg-[#283272] text-white font-sans font-semibold rounded-xl text-sm transition-all shadow-md shadow-[#181E4B]/15"
            >
              Sign In to Command Center
            </button>
          </form>
        )}

        {/* Security Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-[#5E6282]">
          <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
          <span>Stateless JWT &amp; Role-Based Authorization</span>
        </div>
      </div>
    </div>
  )
}
