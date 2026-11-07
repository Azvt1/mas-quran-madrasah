'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-600 text-white text-xl mb-4 select-none">
            ☽
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Forgot password?</h1>
          <p className="text-slate-500 text-sm mt-1">We'll email you a reset link</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-teal-600 font-medium">Check your email</p>
                <p className="text-sm text-slate-500">
                  We sent a reset link to <span className="font-medium text-slate-700">{email}</span>.
                  Click it to choose a new password.
                </p>
                <Link href="/login" className="text-sm text-teal-600 hover:underline block mt-2">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  <Link href="/login" className="text-teal-600 hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
