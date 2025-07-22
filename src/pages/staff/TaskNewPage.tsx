
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TaskNewPage() {
  const navigate = useNavigate();

  const priorityOptions = [
    { 
      value: 'urgent', 
      label: 'Urgent', 
      description: 'Immediate attention required',
      color: 'text-red-600'
    },
    { 
      value: 'high', 
      label: 'High', 
      description: 'Important - address quickly',
      color: 'text-orange-600'
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      description: 'Standard priority',
      color: 'text-yellow-600'
    },
    { 
      value: 'low', 
      label: 'Low', 
      description: 'Can be scheduled later',
      color: 'text-green-600'
    }
  ];

  const categoryOptions = [
    { value: 'maintenance', label: 'Maintenance', description: 'Equipment and facility maintenance' },
    { value: 'cleaning', label: 'Cleaning', description: 'Cleaning and sanitation tasks' },
    { value: 'inspection', label: 'Inspection', description: 'Routine inspections and audits' },
    { value: 'repair', label: 'Repair', description: 'Fix broken or damaged items' },
    { value: 'installation', label: 'Installation', description: 'Install new equipment or features' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/tasks')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
            <p className="text-muted-foreground mt-2">
              Create a new task assignment
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Task Details
            </CardTitle>
            <CardDescription>
              Enter the information for the new task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Task Title</Label>
              <Input id="taskTitle" placeholder="Enter task title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the task in detail" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col gap-1">
                          <div className={`font-medium ${option.color}`}>{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Task location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
                <Input id="estimatedTime" type="number" placeholder="2" />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button className="flex-1">
                Create Task
              </Button>
              <Button variant="outline" onClick={() => navigate('/staff/tasks')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
