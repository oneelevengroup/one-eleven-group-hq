import React from 'react';
import { Calendar } from 'lucide-react';

export default function TeamMeetings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-foreground">Team Meetings</h1>
        <p className="text-muted-foreground mt-1">Coming soon — structured meeting agendas, notes, and action items</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-16 text-center">
        <Calendar className="w-14 h-14 text-muted-foreground mx-auto mb-5 opacity-40" />
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">Meeting Center</h3>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">This section is being refined. Soon you'll be able to create meeting agendas, capture notes during meetings, and track action items — all in one place.</p>
      </div>
    </div>
  );
}