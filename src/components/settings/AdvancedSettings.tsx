import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import { Settings, Eye, EyeOff, X } from "lucide-react"
import DOMPurify from 'dompurify';

const advancedSettingsSchema = z.object({
  bio: z.string()
    .max(500, { message: "Bio must be less than 500 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))
    .optional(),
  profile_visibility: z.enum(['public', 'internal', 'private']),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

type AdvancedSettingsValues = z.infer<typeof advancedSettingsSchema>

export function AdvancedSettings() {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const form = useForm<AdvancedSettingsValues>({
    resolver: zodResolver(advancedSettingsSchema),
    defaultValues: {
      bio: profile?.bio || "",
      profile_visibility: profile?.profile_visibility as 'public' | 'internal' | 'private' || 'public',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
    },
  });

  const skills = form.watch('skills') || [];
  const interests = form.watch('interests') || [];

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      form.setValue('skills', [...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    form.setValue('skills', skills.filter(skill => skill !== skillToRemove));
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      form.setValue('interests', [...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    form.setValue('interests', interests.filter(interest => interest !== interestToRemove));
  };

  const onSubmit = async (data: AdvancedSettingsValues) => {
    setIsUpdating(true);
    try {
      const success = await updateProfile(data);
      if (success) {
        toast({
          title: "Advanced settings updated",
          description: "Your profile settings have been saved.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update advanced settings.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Advanced Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your profile visibility and additional information
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="profile_visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  {field.value === 'private' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>Profile Visibility</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="internal">Internal - Visible to building members only</SelectItem>
                    <SelectItem value="private">Private - Visible only to staff and admins</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Control who can see your profile information
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell others about yourself..."
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/500 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="skills"
              render={() => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center space-x-1">
                        <span>{skill}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSkill(skill)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Add skills related to your work or hobbies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={() => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add an interest"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    />
                    <Button type="button" onClick={addInterest} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="flex items-center space-x-1">
                        <span>{interest}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInterest(interest)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Share your interests to connect with others
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? "Updating..." : "Update Advanced Settings"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}