import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuickActionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Quick Actions</h1>
          <p className="text-muted-foreground mt-2">
            Quickly access frequently used functions and workflows
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Quick Actions</CardTitle>
              <CardDescription>
                Streamlined access to common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActions userRole="admin" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}