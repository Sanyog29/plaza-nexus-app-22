import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Camera, Upload, Plus, Clock } from 'lucide-react';
import { useDailyChecklists } from '@/hooks/useDailyChecklists';
import { format } from 'date-fns';

export const DailyChecklistSystem: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);

  const { 
    checklists, 
    isLoading, 
    isUploading,
    createChecklist, 
    updateChecklistItem, 
    uploadPhoto, 
    completeChecklist,
    getTodaysChecklists,
    CHECKLIST_TEMPLATES 
  } = useDailyChecklists();

  const todaysChecklists = getTodaysChecklists();

  const handleCreateChecklist = async () => {
    if (!selectedType || !selectedZone) return;
    
    const result = await createChecklist(selectedType as keyof typeof CHECKLIST_TEMPLATES, selectedZone);
    if (result) {
      setSelectedType('');
      setSelectedZone('');
      setExpandedChecklist(result.id);
    }
  };

  const handleItemToggle = async (checklistId: string, itemId: string, completed: boolean) => {
    await updateChecklistItem(checklistId, itemId, completed);
  };

  const handlePhotoUpload = async (checklistId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadPhoto(checklistId, file);
    event.target.value = ''; // Reset input
  };

  const handleCompleteChecklist = async (checklistId: string) => {
    const success = await completeChecklist(checklistId, notes);
    if (success) {
      setNotes('');
      setExpandedChecklist(null);
    }
  };

  const getCompletionPercentage = (checklist: any) => {
    const totalItems = checklist.checklist_items.length;
    const completedItems = checklist.checklist_items.filter((item: any) => item.completed).length;
    return Math.round((completedItems / totalItems) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Create New Checklist */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Daily Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select checklist type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ac_maintenance">AC Maintenance</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lobby_main">Main Lobby</SelectItem>
                <SelectItem value="floor_1_east">Floor 1 East</SelectItem>
                <SelectItem value="floor_1_west">Floor 1 West</SelectItem>
                <SelectItem value="basement_utilities">Basement Utilities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCreateChecklist}
            disabled={!selectedType || !selectedZone || isLoading}
            className="bg-plaza-blue hover:bg-blue-700"
          >
            Create Checklist
          </Button>
        </CardContent>
      </Card>

      {/* Today's Checklists */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Today's Checklists ({todaysChecklists.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todaysChecklists.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No checklists created for today
            </p>
          ) : (
            todaysChecklists.map((checklist) => (
              <div key={checklist.id} className="space-y-4">
                <div 
                  className="p-4 bg-background/20 rounded-lg border border-border cursor-pointer"
                  onClick={() => setExpandedChecklist(
                    expandedChecklist === checklist.id ? null : checklist.id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white capitalize">
                        {checklist.checklist_type.replace(/_/g, ' ')} - {checklist.zone.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-gray-400">
                        Created: {format(new Date(checklist.created_at), 'HH:mm')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-plaza-blue h-2 rounded-full transition-all"
                            style={{ width: `${getCompletionPercentage(checklist)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {getCompletionPercentage(checklist)}%
                        </span>
                      </div>
                    </div>
                    <Badge 
                      className={
                        checklist.completion_status === 'approved' ? 'bg-green-600' :
                        checklist.completion_status === 'completed' ? 'bg-blue-600' :
                        'bg-yellow-600'
                      }
                    >
                      {checklist.completion_status}
                    </Badge>
                  </div>
                </div>

                {/* Expanded Checklist */}
                {expandedChecklist === checklist.id && (
                  <div className="ml-4 space-y-4 p-4 bg-background/10 rounded-lg">
                    {/* Checklist Items */}
                    <div className="space-y-3">
                      {checklist.checklist_items.map((item: any) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              handleItemToggle(checklist.id, item.id, checked as boolean)
                            }
                            disabled={checklist.completion_status !== 'pending'}
                          />
                          <span className={`flex-1 text-sm ${
                            item.completed ? 'text-gray-400 line-through' : 'text-white'
                          }`}>
                            {item.text}
                            {item.required && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Photo Upload */}
                    {checklist.completion_status === 'pending' && (
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">Upload Photos (Optional)</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(checklist.id, e)}
                          disabled={isUploading}
                          className="bg-background/20"
                        />
                      </div>
                    )}

                    {/* Uploaded Photos */}
                    {checklist.photo_urls && checklist.photo_urls.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">Uploaded Photos</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {checklist.photo_urls.map((url: string, index: number) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Checklist photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes and Complete */}
                    {checklist.completion_status === 'pending' && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-background/20"
                        />
                        <Button
                          onClick={() => handleCompleteChecklist(checklist.id)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Complete Checklist
                        </Button>
                      </div>
                    )}

                    {/* Completed Info */}
                    {checklist.completion_status !== 'pending' && (
                      <div className="p-3 bg-background/20 rounded border">
                        <p className="text-sm text-gray-300">
                          Completed: {checklist.completed_at && format(new Date(checklist.completed_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                        {checklist.notes && (
                          <p className="text-sm text-gray-400 mt-1">
                            Notes: {checklist.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};