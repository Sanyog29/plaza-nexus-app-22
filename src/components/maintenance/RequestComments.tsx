import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';

interface RequestCommentsProps {
  requestId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    role: string | null;
  } | null;
}

const RequestComments: React.FC<RequestCommentsProps> = ({ requestId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('request-comments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'request_comments',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        fetchComments(); // Refresh comments when a new one is added
      })
      .subscribe();
      
    // Clean up subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [requestId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const { data: commentsData, error } = await supabase
        .from('request_comments')
        .select('id, content, created_at, user_id')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', userIds);

      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Transform the data to match our Comment interface
      const formattedComments: Comment[] = (commentsData || []).map((item: any) => ({
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        user: profilesMap[item.user_id] || null
      }));
      
      setComments(formattedComments);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error fetching comments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to post comments",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      
      const { error } = await supabase
        .from('request_comments')
        .insert({
          request_id: requestId,
          user_id: user.id,
          content: newComment,
        });

      if (error) throw error;
      
      setNewComment('');
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      });
      
      // The comment list will be updated by the realtime subscription
    } catch (error: any) {
      console.error('Error sending comment:', error);
      toast({
        title: "Error sending comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">
          Communication Thread
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comments.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 py-4">
              No comments yet. Be the first to start the conversation.
            </div>
          )}
          
          {isLoading && (
            <div className="text-center text-gray-400 py-4">
              Loading comments...
            </div>
          )}
          
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                className="flex gap-3 p-3 rounded-lg bg-card/80"
              >
                <div className="shrink-0 h-8 w-8 bg-plaza-blue/20 rounded-full flex items-center justify-center">
                  <User size={16} className="text-plaza-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-white">
                      {comment.user?.first_name 
                        ? `${comment.user.first_name} ${comment.user.last_name}`
                        : 'Unknown User'
                      }
                      {comment.user?.role && (
                        <span className="text-xs ml-2 bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                          {comment.user.role}
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-gray-400">
                      {format(new Date(comment.created_at), 'PPp')}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 mt-2 border-t border-gray-700">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-24 bg-card border-gray-700"
              disabled={isSending}
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleSendComment} 
                disabled={!newComment.trim() || isSending}
                className="bg-plaza-blue hover:bg-blue-700"
              >
                <Send size={16} className="mr-2" />
                {isSending ? 'Sending...' : 'Send Comment'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestComments;
