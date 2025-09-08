
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatUserNameFromProfile } from '@/utils/formatters';
import { format } from 'date-fns';

interface AssignedTechnicianInfoProps {
  assignedToUserId?: string;
  acceptedAt?: string;
  startedAt?: string;
  status: string;
}

interface TechnicianProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  role: string;
  specialization?: string;
}

const AssignedTechnicianInfo: React.FC<AssignedTechnicianInfoProps> = ({
  assignedToUserId,
  acceptedAt,
  startedAt,
  status
}) => {
  const [technician, setTechnician] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignedToUserId) {
      fetchTechnicianInfo();
    }
  }, [assignedToUserId]);

  const fetchTechnicianInfo = async () => {
    if (!assignedToUserId) return;
    
    try {
      setLoading(true);
      
      // Get profile info including email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number, email, role, specialization')
        .eq('id', assignedToUserId)
        .single();

      if (profileError) throw profileError;

      setTechnician(profile);

    } catch (error: any) {
      console.error('Error fetching technician info:', error);
      // Fallback to just profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number, email, role, specialization')
        .eq('id', assignedToUserId)
        .single();
      
      if (profile) {
        setTechnician(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!assignedToUserId) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 text-center">
          <p className="text-gray-400">No technician assigned yet</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 text-center">
          <p className="text-gray-400">Loading technician info...</p>
        </CardContent>
      </Card>
    );
  }

  if (!technician) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 text-center">
          <p className="text-gray-400">Technician information not available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'accepted':
        return 'bg-blue-900 text-blue-300';
      case 'in_progress':
        return 'bg-yellow-900 text-yellow-300';
      case 'closed':
        return 'bg-green-900 text-green-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Assigned Technician
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg">
              {formatUserNameFromProfile(technician)}
            </h3>
            <p className="text-gray-400 text-sm capitalize">{technician.role.replace('_', ' ')}</p>
            {technician.specialization && (
              <p className="text-gray-500 text-sm">{technician.specialization}</p>
            )}
          </div>
          <Badge className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          {technician.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-plaza-blue" />
              <span className="text-gray-300">{technician.phone_number}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-plaza-blue" />
            <span className="text-gray-300">{technician.email}</span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-2">
          {acceptedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">
                Accepted: {format(new Date(acceptedAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
          )}
          
          {startedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">
                Started: {format(new Date(startedAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedTechnicianInfo;
