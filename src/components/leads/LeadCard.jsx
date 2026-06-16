import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Calendar } from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'];

const STATUS_COLORS = {
  'New': 'bg-purple-500/10 text-purple-400',
  'Contacted': 'bg-blue-500/10 text-blue-400',
  'Proposal Sent': 'bg-amber-500/10 text-amber-400',
  'Won': 'bg-green-500/10 text-green-400',
  'Lost': 'bg-red-500/10 text-red-400',
};

export default function LeadCard({ lead, owner, isDragging, onStatusChange }) {
  const navigate = useNavigate();

  const handleStatusClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIdx = STATUSES.indexOf(lead.status);
    const nextIdx = (currentIdx + 1) % STATUSES.length;
    const newStatus = STATUSES[nextIdx];
    if (onStatusChange) {
      onStatusChange(lead.id, newStatus);
    } else {
      await base44.entities.Lead.update(lead.id, { status: newStatus });
    }
  };

  return (
    <div onClick={() => navigate(`/leads/${lead.id}`)} className={`block bg-card rounded-lg p-3 border transition-colors cursor-pointer ${isDragging ? 'border-accent shadow-lg' : 'border-border hover:border-accent/50'}`}>
      <h4 className="font-heading font-bold text-sm text-foreground leading-snug">{lead.company_name}</h4>
      <button onClick={handleStatusClick} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 mb-1 hover:opacity-80 transition-opacity ${STATUS_COLORS[lead.status]}`}>
        {lead.status}
      </button>
      {lead.contact_name && <p className="text-xs text-muted-foreground mb-2 leading-snug">{lead.contact_name}</p>}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {owner && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {owner.full_name}</span>}
        {lead.next_followup_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(lead.next_followup_date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}