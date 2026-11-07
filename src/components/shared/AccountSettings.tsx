'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateEmailAction } from '@/app/actions/settings'
import { Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface FieldState {
  status: Status
  message: string
}

export default function AccountSettings() {
  const supabase = createClient()

  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [newEmail, setNewEmail]         = useState('')
  const [emailState, setEmailState]     = useState<FieldState>({ status: 'idle', message: '' })

  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordState, setPasswordState]     = useState<FieldState>({ status: 'idle', message: '' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setCurrentEmail(data.user.email)
    })
  }, [])

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || newEmail === currentEmail) return

    setEmailState({ status: 'loading', message: '' })
    const result = await updateEmailAction(newEmail)

    if (result.error) {
      setEmailState({ status: 'error', message: result.error })
    } else {
      setEmailState({
        status: 'success',
        message: `Email updated to ${newEmail}. Please log out and sign in again with your new email.`,
      })
      setNewEmail('')
      setCurrentEmail(newEmail)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword.length < 8) {
      setPasswordState({ status: 'error', message: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordState({ status: 'error', message: 'Passwords do not match.' })
      return
    }

    setPasswordState({ status: 'loading', message: '' })
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordState({ status: 'error', message: error.message })
    } else {
      setPasswordState({ status: 'success', message: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Update your email or password.</p>
      </div>

      {/* Change Email */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Change Email</h2>
        </div>

        {currentEmail && (
          <p className="text-xs text-slate-500">
            Current: <span className="font-medium text-slate-700">{currentEmail}</span>
          </p>
        )}

        <form onSubmit={handleEmailChange} className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="New email address"
            required
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
          />

          <StatusMessage state={emailState} />

          <button
            type="submit"
            disabled={emailState.status === 'loading' || !newEmail}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {emailState.status === 'loading' && <Loader2 size={13} className="animate-spin" />}
            Save new email
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password (min 8 characters)"
            required
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
          />

          <StatusMessage state={passwordState} />

          <button
            type="submit"
            disabled={passwordState.status === 'loading' || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {passwordState.status === 'loading' && <Loader2 size={13} className="animate-spin" />}
            Save new password
          </button>
        </form>
      </div>
    </div>
  )
}

function StatusMessage({ state }: { state: FieldState }) {
  if (state.status === 'idle' || !state.message) return null

  const isError   = state.status === 'error'
  const isSuccess = state.status === 'success'

  return (
    <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md ${
      isError   ? 'bg-red-50 text-red-700 border border-red-100' :
      isSuccess ? 'bg-teal-50 text-teal-700 border border-teal-100' : ''
    }`}>
      {isError   && <AlertCircle   size={13} className="shrink-0 mt-0.5" />}
      {isSuccess && <CheckCircle2  size={13} className="shrink-0 mt-0.5" />}
      <span>{state.message}</span>
    </div>
  )
}
