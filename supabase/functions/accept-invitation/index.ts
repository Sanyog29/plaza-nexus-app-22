import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  invitation_token: string;
  password: string;
  confirm_password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      invitation_token,
      password,
      confirm_password
    }: AcceptInvitationRequest = await req.json();

    // Validate passwords match
    if (password !== confirm_password) {
      return new Response(JSON.stringify({ error: 'Passwords do not match' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', invitation_token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invalid or expired invitation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invitation has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm since they came from invitation
      user_metadata: {
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        invitation_accepted: true
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profile with invitation details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: invitation.first_name || '',
        last_name: invitation.last_name || '',
        role: invitation.role,
        department: invitation.department,
        phone_number: invitation.phone_number,
        office_number: invitation.office_number,
        floor: invitation.floor
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from('user_invitations')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('invitation_token', invitation_token);

    // Initialize onboarding
    await supabaseAdmin.rpc('initialize_user_onboarding', {
      target_user_id: newUser.user.id
    });

    // Send welcome email
    const welcomeEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Plaza Management!</h2>
        <p>Hello ${invitation.first_name},</p>
        <p>Your account has been successfully created! You can now access the Plaza Management System.</p>
        <p><strong>Your Account Details:</strong></p>
        <ul>
          <li>Email: ${invitation.email}</li>
          <li>Role: ${invitation.role.replace('_', ' ')}</li>
          ${invitation.department ? `<li>Department: ${invitation.department}</li>` : ''}
        </ul>
        <p>To get started:</p>
        <ol>
          <li>Log in to your account using your email and password</li>
          <li>Complete your profile setup</li>
          <li>Take the orientation tour</li>
          <li>Complete any assigned training modules</li>
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app') || 'https://your-app.com'}/auth" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact your administrator.</p>
      </div>
    `;

    // Send welcome email
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: invitation.email,
          subject: 'Welcome to Plaza Management!',
          html: welcomeEmailHtml,
          type: 'general'
        }),
      });

      // Mark welcome email as sent
      await supabaseAdmin
        .from('user_onboarding')
        .update({ welcome_email_sent: true })
        .eq('user_id', newUser.user.id);

    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    // Create welcome notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: newUser.user.id,
        title: 'Welcome to Plaza Management!',
        message: 'Your account has been created successfully. Complete your onboarding to get started.',
        type: 'success',
        action_url: '/profile'
      });

    // Notify the admin who invited the user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: invitation.invited_by,
        title: 'Invitation Accepted',
        message: `${invitation.first_name} ${invitation.last_name} (${invitation.email}) has accepted their invitation and created their account.`,
        type: 'success'
      });

    // Sign in the new user automatically
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password: password
    });

    if (signInError) {
      console.error('Error signing in new user:', signInError);
      return new Response(JSON.stringify({
        success: true,
        message: 'Account created successfully. Please log in.',
        user_id: newUser.user.id,
        requires_login: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Account created and signed in successfully',
      user: newUser.user,
      session: session,
      onboarding_required: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in accept-invitation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);