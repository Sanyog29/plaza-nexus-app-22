-- Add support for enhanced booking management features

-- Add new columns to room_bookings for enhanced features
ALTER TABLE room_bookings 
ADD COLUMN duration_minutes INTEGER DEFAULT 60,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_rule JSONB DEFAULT NULL,
ADD COLUMN parent_booking_id UUID REFERENCES room_bookings(id) ON DELETE CASCADE,
ADD COLUMN template_id UUID DEFAULT NULL,
ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0,
ADD COLUMN meeting_agenda TEXT DEFAULT NULL,
ADD COLUMN attendee_count INTEGER DEFAULT NULL,
ADD COLUMN equipment_needed JSONB DEFAULT NULL;

-- Create booking templates table
CREATE TABLE booking_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  room_type_preference TEXT,
  capacity_needed INTEGER,
  equipment_needed JSONB DEFAULT NULL,
  buffer_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on booking templates
ALTER TABLE booking_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for booking templates
CREATE POLICY "Users can manage their own templates" 
ON booking_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Create index for booking templates
CREATE INDEX idx_booking_templates_user_id ON booking_templates(user_id);

-- Add indexes for new room_bookings columns
CREATE INDEX idx_room_bookings_template_id ON room_bookings(template_id);
CREATE INDEX idx_room_bookings_parent_booking ON room_bookings(parent_booking_id);
CREATE INDEX idx_room_bookings_recurrence ON room_bookings(is_recurring) WHERE is_recurring = true;