'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createUserAction } from '../actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect, useState as useStateAlias } from 'react'

// Fetch teachers client-side for the student form
import { createClient } from '@/lib/supabase/client'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NewUserPage() {
  const searchParams  = useSearchParams()
  const defaultRole   = (searchParams.get('role') as 'teacher' | 'student') ?? 'teacher'

  const [state, action, isPending] = useActionState(createUserAction, {})
  const [role, setRole]             = useState<'teacher' | 'student'>(defaultRole)
  const [password, setPassword]     = useState('')
  const [teachers, setTeachers]     = useState<{ id: string; full_name: string }[]>([])

  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name')
      .then(({ data }) => setTeachers(data ?? []))
  }, [])

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to users
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add user</CardTitle>
          <CardDescription>Create a teacher or student account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <div className="flex gap-2">
                {(['teacher', 'student'] as const).map(r => (
                  <label
                    key={r}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm cursor-pointer transition-colors ${
                      role === r
                        ? 'bg-teal-50 border-teal-400 text-teal-700 font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <span className="capitalize">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" placeholder="Aisha Mohammed" required />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="aisha@example.com" required />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input id="phone" name="phone" type="tel" placeholder="+44 7700 900000" />
            </div>

            {/* Student-only fields */}
            {role === 'student' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="teacher_id">Assigned teacher</Label>
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    required
                    className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select a teacher…</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                  {teachers.length === 0 && (
                    <p className="text-xs text-amber-600">No teachers yet. Create a teacher first.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Student type</Label>
                  <div className="flex gap-2">
                    {(['iqra', 'quran'] as const).map(t => (
                      <label
                        key={t}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-200 text-sm cursor-pointer hover:bg-slate-50 has-[:checked]:bg-teal-50 has-[:checked]:border-teal-400 has-[:checked]:text-teal-700 has-[:checked]:font-medium transition-colors"
                      >
                        <input type="radio" name="student_type" value={t} className="sr-only" defaultChecked={t === 'iqra'} required />
                        <span className="capitalize">{t === 'iqra' ? 'Iqra' : 'Quran'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date_of_birth">Date of birth <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Input id="date_of_birth" name="date_of_birth" type="date" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="parent_phone">Parent WhatsApp number <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Input id="parent_phone" name="parent_phone" type="tel" placeholder="+61 412 345 678" />
                  <p className="text-xs text-slate-400">Used by teachers to message parents directly via WhatsApp.</p>
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  name="password"
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Generate password"
                  onClick={() => setPassword(generatePassword())}
                >
                  <RefreshCw size={14} />
                </Button>
              </div>
              <p className="text-xs text-slate-400">Share this with the user. They can change it after logging in.</p>
            </div>

            {/* Error */}
            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                {state.error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create account'}
              </Button>
              <Link href="/admin/users" className={buttonVariants({ variant: 'outline' })}>
                Cancel
              </Link>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
