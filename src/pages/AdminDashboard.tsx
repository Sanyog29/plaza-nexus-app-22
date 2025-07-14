import { useAuth } from "@/components/AuthProvider";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";

export default function AdminDashboard() {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <UnifiedDashboard userRole="admin" />
      </div>
    </div>
  );
}