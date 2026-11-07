'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CalendarCheck, BookOpen, TrendingUp, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/app.types'

interface TeacherSidebarProps { profile: Profile }

const navItems = [
  { href: '/teacher/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/teacher/students',   label: 'Students',   icon: Users           },
  { href: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck   },
  { href: '/teacher/homework',   label: 'Homework',   icon: BookOpen        },
  { href: '/teacher/progress',   label: 'Progress',   icon: TrendingUp      },
  { href: '/teacher/analytics',  label: 'Analytics',  icon: BarChart2       },
  { href: '/teacher/settings',   label: 'Settings',   icon: Settings        },
]

export default function TeacherSidebar({ profile }: TeacherSidebarProps) {
  const pathname  = usePathname()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-teal-600 text-lg select-none">☽</span>
          <span className="font-semibold text-slate-900 text-sm leading-tight">Quran Madrasa</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 ml-6">Teacher</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-200" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name}</p>
          <p className="text-xs text-slate-400">Teacher</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors mt-0.5"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="text-slate-600 hover:text-slate-900">
          <Menu size={20} />
        </button>
        <span className="text-teal-600 select-none">☽</span>
        <span className="font-semibold text-slate-900 text-sm">Quran Madrasa</span>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-56 shrink-0
        bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}
