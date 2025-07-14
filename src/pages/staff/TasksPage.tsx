import { TaskManagement } from "@/components/tasks/TaskManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedTaskAssignment from "@/components/staff/AdvancedTaskAssignment";
import ShiftManagement from "@/components/staff/ShiftManagement";
import TrainingManagement from "@/components/staff/TrainingManagement";
import MobileInterface from "@/components/staff/MobileInterface";

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="assignment">Smart Assignment</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
              <p className="text-muted-foreground mt-2">
                Track and manage your assigned tasks and responsibilities
              </p>
            </div>
            <TaskManagement />
          </TabsContent>

          <TabsContent value="assignment">
            <AdvancedTaskAssignment />
          </TabsContent>

          <TabsContent value="shifts">
            <ShiftManagement />
          </TabsContent>

          <TabsContent value="training">
            <TrainingManagement />
          </TabsContent>

          <TabsContent value="mobile">
            <MobileInterface />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}