'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    // Give the user a moment to see the success message, then redirect
    setTimeout(() => { window.location.href = '/login' }, 2500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-600 text-white text-xl mb-4 select-none">
            ☽
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Set new password</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {done ? (
              <div className="text-center space-y-2 py-2">
                <p className="text-teal-600 font-medium">Password updated!</p>
                <p className="text-sm text-slate-500">Redirecting you to sign in…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                  {loading ? 'Saving…' : 'Set new password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
