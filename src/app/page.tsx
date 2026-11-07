import { redirect } from 'next/navigation'

// Middleware handles the role-based redirect.
// This is a fallback in case middleware doesn't catch it.
export default function Home() {
  redirect('/login')
}
