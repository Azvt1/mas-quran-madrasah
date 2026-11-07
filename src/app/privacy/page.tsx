import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — MAS Quran Madrasah',
}

// Public page (no login). Linked from the App Store and Google Play listings.
const CONTACT_EMAIL = 'umraliyev.azvt@gmail.com'
const UPDATED = '4 November 2026'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <article className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-10 space-y-6 text-slate-700 leading-relaxed">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">MAS Quran Madrasah · Masjid As-Salaam · Last updated {UPDATED}</p>
        </header>

        <p>
          The MAS Quran Madrasah app and website help Masjid As-Salaam run its Quran and Iqra classes in
          Australia. This policy explains what information we keep, why, and who can see it.
        </p>

        <Section title="Who can use it">
          Accounts are created by the madrasa for its teachers and enrolled students. There is no public
          sign-up. Student accounts are set up with the knowledge of the student&apos;s parent or guardian.
        </Section>

        <Section title="What we store">
          <ul className="list-disc pl-5 space-y-1">
            <li>Name, login email and role (teacher, student or admin)</li>
            <li>Which teacher a student is assigned to, and whether they study Iqra or Quran</li>
            <li>Class attendance (present, late or absent)</li>
            <li>Homework, whether it was passed, and the teacher&apos;s comments</li>
            <li>Iqra book and page, or Quran progress</li>
            <li>A parent&apos;s phone number, so teachers can contact them</li>
            <li>Whether the term fee has been paid (no card or bank details are stored)</li>
          </ul>
        </Section>

        <Section title="How we use it">
          Only to run the madrasa: taking attendance, setting and reviewing homework, tracking progress and
          keeping parents informed. We do not sell or share this information, show advertising, or use
          tracking or analytics tools.
        </Section>

        <Section title="Who can see it">
          <ul className="list-disc pl-5 space-y-1">
            <li>Teachers see only their own students.</li>
            <li>Students see only their own homework, attendance and progress.</li>
            <li>Madrasa administrators can see all records to manage classes and fees.</li>
          </ul>
        </Section>

        <Section title="WhatsApp messages">
          When a teacher taps &ldquo;Message parent&rdquo;, the app opens WhatsApp on the teacher&apos;s own
          phone with a pre-written message. The teacher reviews and sends it themselves; the app does not
          send messages on its own. WhatsApp&apos;s own privacy policy applies to those messages.
        </Section>

        <Section title="Where it is stored">
          Data is stored securely with our hosting providers, Supabase (database and sign-in) and Vercel
          (website). Access is protected by login and database rules that limit each person to the records
          above. Passwords are never stored in readable form.
        </Section>

        <Section title="Keeping and deleting information">
          We keep records while a student is enrolled and for a reasonable time afterwards for the
          madrasa&apos;s records. A parent, student or teacher can ask us to correct or delete their
          information, or to close their account, by contacting us below.
        </Section>

        <Section title="Contact">
          Questions or requests:{' '}
          <a className="text-teal-700 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </Section>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div>{children}</div>
    </section>
  )
}
