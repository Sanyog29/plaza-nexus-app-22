import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email?: string;
  mobile_number?: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  specialization?: string;
  password?: string;
  emp_id?: string;
  phone_number?: string;
  office_number?: string;
  floor?: string;
  send_invitation?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      email,
      mobile_number,
      first_name,
      last_name,
      role,
      department,
      specialization,
      password,
      emp_id,
      phone_number,
      office_number,
      floor,
      send_invitation = true
    }: CreateUserRequest = await req.json();

    if (send_invitation) {
      // Create invitation instead of directly creating user
      const { data, error } = await supabase.rpc('admin_create_user_invitation', {
        invitation_email: email || null,
        invitation_phone_number: mobile_number || null,
        invitation_first_name: first_name,
        invitation_last_name: last_name,
        invitation_role: role,
        invitation_department: role === 'tenant_manager' ? null : department,
        invitation_specialization: specialization,
        invitation_password: password,
        invitation_emp_id: emp_id,
      });

      if (error) {
        console.error('Error creating invitation:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to create user invitation: ' + error.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Send invitation email if email is provided
      if (email) {
        // Get the invitation details to get the token
        const { data: invitationData } = await supabase
          .from('user_invitations')
          .select('invitation_token')
          .eq('email', email)
          .eq('status', 'pending')
          .single();
      
        const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://your-app.com'}/auth?invitation=${invitationData?.invitation_token || 'token'}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited to Join Plaza Management</h2>
          <p>Hello ${first_name},</p>
          <p>You've been invited to join the Plaza Management System as a <strong>${role.replace('_', ' ')}</strong>.</p>
          <p><strong>Your Details:</strong></p>
          <ul>
            <li>Email: ${email}</li>
            <li>Role: ${role.replace('_', ' ')}</li>
            ${department ? `<li>Department: ${department}</li>` : ''}
          </ul>
          <p>Click the button below to accept your invitation and set up your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days. If you didn't expect this invitation, please ignore this email.</p>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link: ${inviteUrl}</p>
        </div>
      `;

      // Send email using the send-email function
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: 'Welcome to Plaza Management - Set Up Your Account',
            content: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send invitation email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
      }

      // Create notification for admin
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'User Invitation Sent',
          message: `Invitation sent to ${email} for role ${role}`,
          type: 'success'
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'User invitation created successfully',
          invitation_id: data
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: true,
          message: 'User invitation created successfully (no email sent)',
          invitation_id: data
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } else {
      // Direct user creation (for admin use)
      let newUser;
      let createError;
      
      // Use provided password or generate one if not provided
      const userPassword = password || Math.random().toString(36).slice(-12);
      
      // Check for existing user first
      if (email) {
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const emailExists = existingUser.users.some(u => u.email === email);
        if (emailExists) {
          createError = new Error(`User with email ${email} already exists`);
        }
      }
      
      if (mobile_number && !createError) {
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const phoneExists = existingUser.users.some(u => u.phone === mobile_number);
        if (phoneExists) {
          createError = new Error(`User with phone number ${mobile_number} already exists`);
        }
      }
      
      if (!createError) {
        if (email) {
          // Create user with email
          const result = await supabase.auth.admin.createUser({
            email,
            password: userPassword,
            email_confirm: true, // Allow immediate login
            user_metadata: {
              first_name,
              last_name,
              role,
              department,
              specialization,
              emp_id,
              phone_number,
              office_number,
              floor
            }
          });
          newUser = result.data;
          createError = result.error;
        } else if (mobile_number) {
          // Create user with phone number
          const result = await supabase.auth.admin.createUser({
            phone: mobile_number,
            password: userPassword,
            phone_confirm: true, // Allow immediate login
            user_metadata: {
              first_name,
              last_name,
              role,
              department,
              specialization,
              emp_id,
              phone_number,
              office_number,
              floor
            }
          });
          newUser = result.data;
          createError = result.error;
        } else {
          createError = new Error('Either email or mobile number is required');
        }
      }

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update profile with additional information
      await supabase
        .from('profiles')
        .update({
          first_name,
          last_name,
          role,
          department: role === 'tenant_manager' ? null : department,
          specialization,
          emp_id,
          phone_number: mobile_number || phone_number,
          office_number,
          floor
        })
        .eq('id', newUser.user.id);

      // Create notification for admin
        await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'User Created',
          message: `User ${email || mobile_number} created successfully with role ${role}`,
          type: 'success'
        });

      return new Response(JSON.stringify({
        success: true,
        message: 'User created successfully',
        user_id: newUser.user.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in admin-create-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);