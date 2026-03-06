import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "felipeduran705@gmail.com",
    password: "#Felipe0607",
    email_confirm: true,
  })

  if (error) {
    console.error("Error creating user:", error.message)
    process.exit(1)
  }

  console.log("User created successfully!")
  console.log("User ID:", data.user.id)
  console.log("Email:", data.user.email)
}

createUser()
