import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, User, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { handleSupabaseError } from '@/utils/errorHandler';

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
  const [error, setError] = useState<Error | null>(null);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
    
    let debounceTimer: NodeJS.Timeout;
    
    // Set up realtime subscription with debouncing
    const subscription = supabase
      .channel('request-comments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'request_comments',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        // Debounce to prevent rapid re-renders
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchComments();
        }, 300); // 300ms debounce
      })
      .subscribe();
      
    // Clean up subscription
    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(subscription);
    };
  }, [requestId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: commentsData, error } = await supabase
        .from('request_comments')
        .select('id, content, created_at, user_id')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles_public')
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
      const errorMessage = handleSupabaseError(error);
      setError(new Error(errorMessage));
      toast({
        title: "Error fetching comments",
        description: errorMessage,
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
      setSendError(null);
      
      const { error } = await supabase
        .from('request_comments')
        .insert({
          request_id: requestId,
          user_id: user.id,
          content: newComment,
        });

      if (error) {
        // Handle duplicate key conflicts gracefully
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.warn('Comment already exists:', error);
          toast({
            title: "Comment Already Posted",
            description: "This comment was already posted",
          });
          setNewComment('');
          return;
        }
        throw error;
      }
      
      setNewComment('');
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      });
      
      // The comment list will be updated by the realtime subscription
    } catch (error: any) {
      console.error('Error sending comment:', error);
      const errorMessage = handleSupabaseError(error);
      setSendError(new Error(errorMessage));
      toast({
        title: "Error sending comment",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur min-h-[500px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-foreground">
          Communication Thread
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Error Banner for Loading Comments */}
          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load comments: {error.message}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchComments}
                  disabled={isLoading}
                  className="ml-4"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Skeleton loaders for loading state */}
          {isLoading ? (
            <div className="space-y-4 min-h-[200px]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-card/80 animate-pulse">
                  <div className="shrink-0 h-8 w-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 && !error ? (
            <div className="text-center text-muted-foreground py-16 min-h-[200px] flex items-center justify-center">
              No comments yet. Be the first to start the conversation.
            </div>
          ) : null}
          
          <div className="space-y-4 max-h-80 min-h-[200px] overflow-y-auto">
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                className="flex gap-3 p-3 rounded-lg bg-card/80"
                style={{ contentVisibility: 'auto' }}
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
          
          <div className="sticky bottom-0 bg-card/95 backdrop-blur pt-4 mt-2 border-t border-gray-700 pb-safe">
            {/* Error Banner for Sending Comments */}
            {sendError && (
              <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-900/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Failed to send comment: {sendError.message}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendComment}
                    disabled={isSending || !newComment.trim()}
                    className="ml-4"
                  >
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[100px] max-h-[100px] resize-none bg-card border-gray-700"
              disabled={isSending}
              onFocus={() => {
                // Prevent zoom on iOS
                if (window.visualViewport) {
                  window.scrollTo(0, window.pageYOffset + 1);
                }
              }}
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