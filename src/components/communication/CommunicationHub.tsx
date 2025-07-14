import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCommunicationHub } from '@/hooks/useCommunicationHub';
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Archive, 
  UserPlus, 
  Clock,
  Circle,
  Users,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export const CommunicationHub: React.FC = () => {
  const {
    threads,
    activeThread,
    setActiveThread,
    messages,
    isLoading,
    isConnected,
    createThread,
    sendMessage,
    archiveThread
  } = useCommunicationHub();

  const [newMessage, setNewMessage] = useState('');
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    type: 'general',
    subject: '',
    participants: ''
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return;

    try {
      await sendMessage(activeThread, newMessage.trim());
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadData.subject.trim()) return;

    try {
      const participantEmails = newThreadData.participants
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      // In a real implementation, you'd resolve emails to user IDs
      const thread = await createThread(
        newThreadData.type,
        newThreadData.subject,
        [] // participantEmails would be resolved to user IDs
      );

      setActiveThread(thread.id);
      setIsNewThreadOpen(false);
      setNewThreadData({ type: 'general', subject: '', participants: '' });
      toast.success('Thread created');
    } catch (error) {
      toast.error('Failed to create thread');
    }
  };

  const getThreadIcon = (threadType: string) => {
    switch (threadType) {
      case 'request':
        return <MessageSquare className="h-4 w-4" />;
      case 'announcement':
        return <Users className="h-4 w-4" />;
      case 'shift_handover':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const activeThreadData = threads.find(t => t.id === activeThread);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          Loading communication hub...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Threads List */}
      <div className="w-1/3 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Communications
              <div className="flex items-center gap-1 ml-2">
                <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
              </div>
            </h3>
            
            <Dialog open={isNewThreadOpen} onOpenChange={setIsNewThreadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>
                    Create a new communication thread
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="thread-type">Type</Label>
                    <Select 
                      value={newThreadData.type} 
                      onValueChange={(value) => setNewThreadData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Discussion</SelectItem>
                        <SelectItem value="request">Request Discussion</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="shift_handover">Shift Handover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newThreadData.subject}
                      onChange={(e) => setNewThreadData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter conversation subject"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="participants">Participants (emails, comma-separated)</Label>
                    <Textarea
                      id="participants"
                      value={newThreadData.participants}
                      onChange={(e) => setNewThreadData(prev => ({ ...prev, participants: e.target.value }))}
                      placeholder="user@example.com, colleague@example.com"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateThread} disabled={!newThreadData.subject.trim()}>
                    Create Thread
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="p-2 space-y-1">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                  activeThread === thread.id ? 'bg-accent' : ''
                }`}
                onClick={() => setActiveThread(thread.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getThreadIcon(thread.thread_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {thread.subject}
                      </p>
                      {thread.unread_count > 0 && (
                        <Badge variant="default" className="text-xs px-1.5 py-0.5">
                          {thread.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate">
                      {thread.last_message?.message_content || 'No messages yet'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {thread.thread_type.replace('_', ' ')}
                      </Badge>
                      {thread.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {threads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new thread to begin</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {activeThread && activeThreadData ? (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{activeThreadData.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeThreadData.participants.length} participant(s)
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => archiveThread(activeThread)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {message.sender_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Sender</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm">{message.message_content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No messages in this thread</p>
                    <p className="text-xs">Send the first message to start the conversation</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a thread from the sidebar to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};