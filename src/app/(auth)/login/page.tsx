'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '@/lib/types/app.types'

function dashboardFor(role: UserRole) {
  if (role === 'admin')   return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/dashboard'
}

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPassword, setShowPw] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Fetch role and navigate — full page reload so the proxy runs fresh
    const user = signInData.user
    if (!user) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    window.location.href = dashboardFor(profile?.role as UserRole ?? 'student')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'radial-gradient(ellipse at 50% 30%, #0d2818 0%, #0a1f12 35%, #071510 65%, #050f0a 100%)'}}>
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 18px #4ade80aa) drop-shadow(0 0 40px #22c55e55); }
          50%       { filter: drop-shadow(0 0 32px #4ade80ee) drop-shadow(0 0 70px #22c55e99); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .logo-glow { animation: glow-pulse 3s ease-in-out infinite; mix-blend-mode: screen; }
        .fade-up   { animation: fade-up 0.7s ease-out forwards; }
        .fade-up-delay { animation: fade-up 0.7s ease-out 0.25s both; }
      `}</style>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="logo-glow inline-block mb-2">
            <Image
              src="/logo.png"
              alt="Masjid As-Salaam"
              width={140}
              height={140}
              className="mx-auto"
              priority
            />
          </div>
          <p className="text-green-400/70 text-xs tracking-widest uppercase fade-up-delay">
            Madrasah Portal
          </p>
        </div>

        {/* Form */}
        <div className="fade-up bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="pr-10 bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-green-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-900/40"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-zinc-500">
              <Link href="/auth/forgot-password" className="text-green-400 hover:text-green-300 hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}
