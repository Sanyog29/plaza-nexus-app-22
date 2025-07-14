import { TaskManagement } from "@/components/tasks/TaskManagement";

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your assigned tasks and responsibilities
          </p>
        </div>

        <TaskManagement />
      </div>
    </div>
  );
}