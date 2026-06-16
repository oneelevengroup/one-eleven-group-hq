import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
        isOwn 
          ? 'bg-accent text-accent-foreground rounded-br-md' 
          : 'bg-muted text-foreground rounded-bl-md'
      }`}>
        {!isOwn && (
          <p className="text-[11px] font-bold text-muted-foreground mb-0.5">{message.sender_name || 'Team Member'}</p>
        )}
        <div className="text-sm leading-relaxed">
          <ReactMarkdown className="prose prose-sm max-w-none [&_p]:m-0 [&_a]:text-inherit [&_a]:underline">{message.content}</ReactMarkdown>
        </div>
        <p className="text-[10px] opacity-50 mt-1 text-right">
          {new Date(message.created_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}