import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
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
      first_name,
      last_name,
      role,
      department,
      phone_number,
      office_number,
      floor,
      send_invitation = true
    }: CreateUserRequest = await req.json();

    if (send_invitation) {
      // Create invitation instead of directly creating user
      const { data: invitationId, error: inviteError } = await supabase
        .rpc('admin_create_user_invitation', {
          invitation_email: email,
          invitation_first_name: first_name,
          invitation_last_name: last_name,
          invitation_role: role,
          invitation_department: department,
          invitation_specialization: null,
        });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get invitation details for email
      const { data: invitation, error: getInviteError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (getInviteError) {
        console.error('Error fetching invitation:', getInviteError);
        return new Response(JSON.stringify({ error: 'Failed to fetch invitation details' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Send invitation email
      const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://your-app.com'}/auth?invitation=${invitation.invitation_token}`;
      
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
        message: 'User invitation sent successfully',
        invitation_id: invitationId,
        invitation_token: invitation.invitation_token
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Direct user creation (for admin use)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-12), // Generate random password
        email_confirm: false, // Require email confirmation
        user_metadata: {
          first_name,
          last_name,
          role,
          department,
          phone_number,
          office_number,
          floor
        }
      });

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
          department,
          phone_number,
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
          message: `User ${email} created successfully with role ${role}`,
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