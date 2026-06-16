import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar } from 'lucide-react';

export default function LeadCard({ lead, owner, isDragging }) {
  return (
    <Link to={`/leads/${lead.id}`} className={`block bg-card rounded-lg p-3 border transition-colors ${isDragging ? 'border-accent shadow-lg' : 'border-border hover:border-accent/50'}`}>
      <h4 className="font-heading font-bold text-sm text-foreground mb-1 truncate">{lead.company_name}</h4>
      {lead.contact_name && <p className="text-xs text-muted-foreground mb-2 truncate">{lead.contact_name}</p>}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {owner && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {owner.full_name}</span>}
        {lead.next_followup_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(lead.next_followup_date).toLocaleDateString()}</span>}
      </div>
    </Link>
  );
}