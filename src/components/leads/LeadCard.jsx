import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, ChevronRight } from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Contract Sent', 'Cold'];

const STATUS_COLORS = {
  'New': 'bg-purple-500/10 text-purple-400',
  'Contacted': 'bg-blue-500/10 text-blue-400',
  'Proposal Sent': 'bg-amber-500/10 text-amber-400',
  'Contract Sent': 'bg-green-500/10 text-green-400',
  'Cold': 'bg-red-500/10 text-red-400',
};

export default function LeadCard({ lead, owner, onStatusChange }) {
  const navigate = useNavigate();

  const handleStatusClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIdx = STATUSES.indexOf(lead.status);
    const nextIdx = (currentIdx + 1) % STATUSES.length;
    const newStatus = STATUSES[nextIdx];
    if (onStatusChange) {
      onStatusChange(lead.id, newStatus);
    }
  };

  return (
    <div
      onClick={() => navigate(`/leads/${lead.id}`)}
      className="flex items-center bg-card rounded-xl border border-border hover:border-accent/50 transition-colors cursor-pointer p-4 gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-heading font-bold text-sm text-foreground">{lead.company_name}</h4>
          <button
            onClick={handleStatusClick}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 hover:opacity-80 transition-opacity ${STATUS_COLORS[lead.status]}`}
          >
            {lead.status}
          </button>
        </div>
        {lead.contact_name && (
          <p className="text-xs text-muted-foreground">{lead.contact_name}{lead.contact_email ? ` · ${lead.contact_email}` : ''}</p>
        )}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {owner && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" /> {owner.full_name}
          </span>
        )}
        {lead.next_followup_date && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {new Date(lead.next_followup_date).toLocaleDateString()}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}