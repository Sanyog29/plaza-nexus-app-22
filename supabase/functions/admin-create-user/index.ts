import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Phone number normalization utility
const normalizePhoneToE164 = (phoneNumber: string): string | null => {
  if (!phoneNumber) return null;
  
  // Remove all spaces, dashes, parentheses, and other non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If already in E.164 format, validate and return
  if (cleaned.startsWith('+')) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(cleaned) ? cleaned : null;
  }
  
  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(cleaned) ? cleaned : null;
  }
  
  // If it's just digits, try to determine the format
  if (/^\d+$/.test(cleaned)) {
    // For Indian numbers starting with 91
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // For US numbers (10 digits)
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }
    
    // For Indian mobile numbers (10 digits starting with 6-9)
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return '+91' + cleaned;
    }
    
    // If longer than 10 digits, assume it includes country code without +
    if (cleaned.length > 10) {
      const withPlus = '+' + cleaned;
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      return e164Regex.test(withPlus) ? withPlus : null;
    }
  }
  
  return null;
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
  property_id?: string;
  send_invitation?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
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

    // Check if user is admin or super_admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .or('role.eq.admin,role.eq.super_admin')
      .maybeSingle();

    if (roleError || !userRole) {
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
      role: inputRole,
      department, 
      specialization, 
      password,
      emp_id,
      phone_number,
      office_number,
      floor,
      property_id,
      send_invitation = false
    } = await req.json() as CreateUserRequest;

    // Get the role mapping but preserve the exact title for storage
    const { data: resolvedRole, error: roleError } = await supabase.rpc('get_role_from_title', {
      input_role: inputRole
    });

    if (roleError) {
      console.error('Error resolving role:', roleError);
      return new Response(JSON.stringify({ 
        error: `Invalid role: ${inputRole}. Please select a valid role.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const role = resolvedRole;

    if (send_invitation) {
      // Create user invitation
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email,
          mobile_number,
          first_name,
          last_name,
          role,
          department: role === 'tenant' ? null : department,
          specialization,
          password,
          emp_id,
          phone_number,
          office_number,
          floor,
          property_id,
          invited_by: user.id
        })
        .select('id')
        .single();

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
      
      // Normalize phone number to E.164 format
      let normalizedPhone = null;
      if (mobile_number) {
        normalizedPhone = normalizePhoneToE164(mobile_number);
        if (!normalizedPhone) {
          createError = new Error(`Invalid phone number format: ${mobile_number}. Please use E.164 format (e.g., +919876543210)`);
        } else {
          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const phoneExists = existingUser.users.some(u => u.phone === normalizedPhone);
          if (phoneExists) {
            createError = new Error(`User with phone number ${normalizedPhone} already exists`);
          }
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
        } else if (normalizedPhone) {
          // Create user with phone number
          const result = await supabase.auth.admin.createUser({
            phone: normalizedPhone,
            password: userPassword,
            phone_confirm: true, // Allow immediate login
            user_metadata: {
              first_name,
              last_name,
              role,
              department,
              specialization,
              emp_id,
              phone_number: normalizedPhone,
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

      // Update profile with additional information including assigned role title
      await supabase
        .from('profiles')
        .update({
          first_name,
          last_name,
          assigned_role_title: inputRole, // Store the original role title assigned
          department: role === 'tenant_manager' ? null : department,
          specialization,
          emp_id,
          phone_number: normalizedPhone || mobile_number || phone_number,
          office_number,
          floor
        })
        .eq('id', newUser.user.id);

      // Insert role into user_roles table
      await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role,
          assigned_by: user.id
        });

      // Assign user to property if property_id is provided
      if (property_id) {
        await supabase
          .from('property_assignments')
          .insert({
            user_id: newUser.user.id,
            property_id: property_id,
            is_primary: true,
            assigned_by: user.id
          });
      }

      // Create notification for admin
        await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'User Created',
          message: `User ${email || normalizedPhone || mobile_number} created successfully with role ${role}`,
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