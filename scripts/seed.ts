/**
 * Seed script — creates the first admin account.
 *
 * Run once after setting up the database:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Missing environment variables.')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local\n')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (question: string): Promise<string> =>
  new Promise(resolve => rl.question(question, resolve))

async function seed() {
  console.log('\n🕌  Quran Madrasa — Admin Account Setup\n')

  const fullName = (await ask('Admin full name: ')).trim()
  const email    = (await ask('Admin email:     ')).trim()
  const password = (await ask('Admin password (min 8 chars): ')).trim()
  rl.close()

  if (!fullName || !email || !password) {
    console.error('\n❌ All fields are required.\n')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('\n❌ Password must be at least 8 characters.\n')
    process.exit(1)
  }

  console.log('\nCreating admin account...')

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
  })

  if (authError || !authData.user) {
    console.error('\n❌ Failed to create auth user:', authError?.message, '\n')
    process.exit(1)
  }

  // Step 2: Create profile record
  const { error: profileError } = await supabase.from('profiles').insert({
    id:        authData.user.id,
    role:      'admin',
    full_name: fullName,
  })

  if (profileError) {
    // Roll back the auth user so we don't have orphaned auth records
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.error('\n❌ Failed to create profile:', profileError.message, '\n')
    process.exit(1)
  }

  console.log('\n✅ Admin account created successfully!')
  console.log(`   Name:  ${fullName}`)
  console.log(`   Email: ${email}`)
  console.log('\n→  Log in at /login')
  console.log('⚠️  Change the password after your first login.\n')
}

seed().catch(err => {
  console.error('\n❌ Unexpected error:', err)
  process.exit(1)
})
