import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeadCard from '@/components/leads/LeadCard';
import LeadForm from '@/components/leads/LeadForm';

const STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'];

const STATUS_HEADER_COLORS = {
  'New': 'border-t-purple-400',
  'Contacted': 'border-t-blue-400',
  'Proposal Sent': 'border-t-amber-400',
  'Won': 'border-t-green-400',
  'Lost': 'border-t-red-400',
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    const [leadList, userList] = await Promise.all([
      base44.entities.Lead.list('-created_date'),
      base44.entities.User.list(),
    ]);
    setLeads(leadList);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: newStatus } : l));
    await base44.entities.Lead.update(draggableId, { status: newStatus });

    if (newStatus === 'Won') {
      const lead = leads.find(l => l.id === draggableId);
      if (lead) {
        await base44.entities.Client.create({
          name: lead.company_name,
          contact_info: lead.contact_email || '',
          point_of_contact: lead.contact_name || '',
          notes: lead.notes || '',
        });
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Lead
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUSES.map(status => {
            const statusLeads = leads.filter(l => l.status === status);
            return (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-muted/40 rounded-xl p-4 border-t-2 transition-colors ${STATUS_HEADER_COLORS[status]} ${snapshot.isDraggingOver ? 'bg-accent/10 border-accent/30' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-bold text-sm text-foreground">{status}</h3>
                      <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full font-medium">{statusLeads.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[40px]">
                      {statusLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'rotate-1 shadow-lg' : ''}
                            >
                              <LeadCard lead={lead} owner={users.find(u => u.id === lead.assigned_to)} isDragging={snapshot.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {statusLeads.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">No leads</p>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {showForm && <LeadForm users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}