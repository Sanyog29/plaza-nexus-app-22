import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const testUsers = [
      { email: 'test1@example.com', password: 'Test1234', firstName: 'Test', lastName: '1', role: 'tenant_manager' },
      { email: 'test2@example.com', password: 'Test1234', firstName: 'Test', lastName: '2', role: 'tenant_manager' },
      { email: 'test3@example.com', password: 'Test1234', firstName: 'Test', lastName: '3', role: 'field_staff' },
      { email: 'test4@example.com', password: 'Test1234', firstName: 'Test', lastName: '4', role: 'ops_supervisor' },
      { email: 'test5@example.com', password: 'Test1234', firstName: 'Test', lastName: '5', role: 'tenant_manager' },
      { email: 'test6@example.com', password: 'Test1234', firstName: 'Test', lastName: '6', role: 'admin' },
    ]

    const results = []

    for (const userData of testUsers) {
      try {
        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        })

        if (authError) {
          console.error(`Error creating user ${userData.email}:`, authError)
          results.push({ email: userData.email, success: false, error: authError.message })
          continue
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            assigned_role_title: userData.role.replace('_', ' ')
          })

        if (profileError) {
          console.error(`Error creating profile for ${userData.email}:`, profileError)
          results.push({ 
            email: userData.email, 
            success: false, 
            error: `Profile creation failed: ${profileError.message}`,
            userId: authUser.user.id
          })
          continue
        }

        // Insert role into user_roles table
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: userData.role
          })

        if (roleError) {
          console.error(`Error creating role for ${userData.email}:`, roleError)
          results.push({ 
            email: userData.email, 
            success: false, 
            error: `Role creation failed: ${roleError.message}`,
            userId: authUser.user.id
          })
        } else {
          results.push({ 
            email: userData.email, 
            success: true, 
            userId: authUser.user.id,
            role: userData.role
          })
        }
      } catch (error) {
        console.error(`Unexpected error for ${userData.email}:`, error)
        results.push({ email: userData.email, success: false, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Test user creation completed',
        results: results,
        summary: {
          total: testUsers.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to create test users'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})