import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ConversationList from '@/components/messaging/ConversationList';
import MessageBubble from '@/components/messaging/MessageBubble';
import MessageInput from '@/components/messaging/MessageInput';
import { Hash, Lock } from 'lucide-react';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data.conversation_id === selectedId) {
        setMessages(prev => {
          if (prev.find(m => m.id === event.data.id)) return prev;
          return [...prev, { ...event.data, sender_name: users.find(u => u.id === event.data.sender_id)?.full_name }];
        });
        setTimeout(scrollToBottom, 100);
      }
    });
    return () => unsub();
  }, [selectedId, users]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    const [user, allConversations, allUsers] = await Promise.all([
      base44.auth.me(),
      base44.entities.Conversation.list(),
      base44.entities.User.list(),
    ]);
    setCurrentUser(user);
    setUsers(allUsers);
    setConversations(allConversations);
    setLoading(false);
  };

  const loadMessages = async (conversationId) => {
    const msgs = await base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date', 100);
    setMessages(msgs.map(m => ({
      ...m,
      sender_name: users.find(u => u.id === m.sender_id)?.full_name,
    })));
  };

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleCreated = async () => {
    const allConversations = await base44.entities.Conversation.list();
    setConversations(allConversations);
  };

  const handleSend = async (content) => {
    await base44.entities.Message.create({
      conversation_id: selectedId,
      sender_id: currentUser.id,
      content,
      file_urls: [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedId);
  const isChannel = selectedConv?.type === 'channel';
  const dmOtherUser = !isChannel && selectedConv
    ? users.find(u => u.id === selectedConv.members.find(id => id !== currentUser.id))
    : null;

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6">
      {/* Left sidebar - conversation list */}
      <div className="w-64 flex-shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <ConversationList
          conversations={conversations}
          users={users}
          currentUser={currentUser}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreated={handleCreated}
        />
      </div>

      {/* Mobile: show list or chat */}
      <div className="flex-1 flex flex-col bg-card">
        {/* Mobile conversation selector */}
        {!selectedId && (
          <div className="flex-1 flex md:hidden flex-col bg-card">
            <ConversationList
              conversations={conversations}
              users={users}
              currentUser={currentUser}
              selectedId={selectedId}
              onSelect={handleSelect}
              onCreated={handleCreated}
            />
          </div>
        )}

        {/* Chat area */}
        {selectedId && selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-background">
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden text-muted-foreground hover:text-foreground mr-1"
              >
                ←
              </button>
              {isChannel ? (
                <Hash className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <h2 className="font-heading font-bold text-sm text-foreground">
                  {isChannel ? selectedConv.name : dmOtherUser?.full_name || 'Direct Message'}
                </h2>
                {isChannel && selectedConv.description && (
                  <p className="text-[11px] text-muted-foreground">{selectedConv.description}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    {isChannel ? `Welcome to #${selectedConv.name}! Send the first message.` : 'Send a message to start the conversation.'}
                  </p>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUser.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput onSend={handleSend} />
          </>
        ) : (
          /* Empty state on desktop */
          <div className="hidden md:flex flex-1 items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Hash className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground mb-1">One Eleven Messages</h3>
              <p className="text-sm text-muted-foreground">Select a channel or direct message to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}