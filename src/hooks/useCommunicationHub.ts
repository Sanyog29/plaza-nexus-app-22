import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunicationThread {
  id: string;
  thread_type: string;
  entity_id: string | null;
  subject: string;
  participants: any;
  is_archived: boolean;
  last_message_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CommunicationMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_content: string;
  message_type: string;
  attachments: any;
  metadata: any;
  is_read_by: any;
  created_at: string;
}

interface ThreadWithDetails extends CommunicationThread {
  unread_count: number;
  last_message?: any;
  sender_name?: string;
}

export const useCommunicationHub = () => {
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      const { data: threadsData, error } = await supabase
        .from('communication_threads')
        .select(`
          *,
          communication_messages!thread_id(
            id,
            sender_id,
            message_content,
            message_type,
            is_read_by,
            created_at
          )
        `)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      const threadsWithDetails: ThreadWithDetails[] = await Promise.all(
        (threadsData || []).map(async (thread) => {
          const messages = thread.communication_messages || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          
          // Count unread messages
          const unreadCount = messages.filter((msg: any) => 
            !msg.is_read_by?.[currentUser.id]
          ).length;

          // Get sender name for the last message
          let senderName = '';
          if (lastMessage) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', lastMessage.sender_id)
              .single();
            
            if (profile) {
              senderName = `${profile.first_name} ${profile.last_name}`.trim();
            }
          }

          return {
            ...thread,
            unread_count: unreadCount,
            last_message: lastMessage,
            sender_name: senderName
          };
        })
      );

      setThreads(threadsWithDetails);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('communication_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const createThread = useCallback(async (
    threadType: string,
    subject: string,
    participants: string[],
    entityId?: string
  ) => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('communication_threads')
        .insert([{
          thread_type: threadType,
          entity_id: entityId || null,
          subject,
          participants: [...participants, currentUser.id],
          created_by: currentUser.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchThreads();
      return data;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }, [fetchThreads]);

  const sendMessage = useCallback(async (
    threadId: string,
    content: string,
    messageType: string = 'text',
    attachments: any[] = []
  ) => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('communication_messages')
        .insert([{
          thread_id: threadId,
          sender_id: currentUser.id,
          message_content: content,
          message_type: messageType,
          attachments,
          is_read_by: { [currentUser.id]: new Date().toISOString() }
        }])
        .select()
        .single();

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('communication_threads')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId);

      await fetchMessages(threadId);
      await fetchThreads();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [fetchMessages, fetchThreads]);

  const markAsRead = useCallback(async (threadId: string) => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      // Get all unread messages in the thread
      const { data: unreadMessages, error } = await supabase
        .from('communication_messages')
        .select('id, is_read_by')
        .eq('thread_id', threadId)
        .neq('sender_id', currentUser.id);

      if (error) throw error;

      // Mark all messages as read
      const updates = unreadMessages?.filter(msg => 
        !msg.is_read_by?.[currentUser.id]
      ).map(msg => ({
        id: msg.id,
        is_read_by: {
          ...(typeof msg.is_read_by === 'object' ? msg.is_read_by : {}),
          [currentUser.id]: new Date().toISOString()
        }
      })) || [];

      if (updates.length > 0) {
        for (const update of updates) {
          await supabase
            .from('communication_messages')
            .update({ is_read_by: update.is_read_by })
            .eq('id', update.id);
        }
      }

      await fetchThreads();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [fetchThreads]);

  const archiveThread = useCallback(async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('communication_threads')
        .update({ is_archived: true })
        .eq('id', threadId);

      if (error) throw error;
      await fetchThreads();
    } catch (error) {
      console.error('Error archiving thread:', error);
      throw error;
    }
  }, [fetchThreads]);

  const addParticipant = useCallback(async (threadId: string, userId: string) => {
    try {
      // Get current participants
      const { data: thread, error: fetchError } = await supabase
        .from('communication_threads')
        .select('participants')
        .eq('id', threadId)
        .single();

      if (fetchError) throw fetchError;

          const currentParticipants = Array.isArray(thread.participants) ? thread.participants : [];
          if (!currentParticipants.includes(userId)) {
            const { error } = await supabase
              .from('communication_threads')
              .update({ 
                participants: [...currentParticipants, userId],
                updated_at: new Date().toISOString()
              })
              .eq('id', threadId);

        if (error) throw error;
        await fetchThreads();
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }, [fetchThreads]);

  // Real-time subscriptions
  useEffect(() => {
    const messagesChannel = supabase
      .channel('communication-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'communication_messages'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as CommunicationMessage;
          if (newMessage.thread_id === activeThread) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
        fetchThreads();
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [activeThread, fetchThreads]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchThreads();
      setIsLoading(false);
    };

    loadData();
  }, [fetchThreads]);

  // Load messages when active thread changes
  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread);
      markAsRead(activeThread);
    }
  }, [activeThread, fetchMessages, markAsRead]);

  return {
    threads,
    activeThread,
    setActiveThread,
    messages,
    isLoading,
    isConnected,
    createThread,
    sendMessage,
    markAsRead,
    archiveThread,
    addParticipant,
    refreshThreads: fetchThreads
  };
};