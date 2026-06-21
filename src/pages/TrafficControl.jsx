import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Users, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskForm from '@/components/tasks/TaskForm';
import LeadCard from '@/components/leads/LeadCard';
import BrainDump from '@/components/BrainDump';
import TodayAtAGlance from '@/components/TodayAtAGlance';
import PeterCard from '@/components/PeterCard';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';

export default function TrafficControl() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const loadData = async () => {
    const [taskList, clientList, userList, leadList] = await Promise.all([
      base44.entities.Task.list('-created_date'),
      base44.entities.Client.list(),
      base44.entities.User.list(),
      base44.entities.Lead.list('-created_date'),
    ]);
    setTasks(taskList);
    setClients(clientList);
    setUsers(userList);
    setLeads(leadList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const workload = users.reduce((acc, u) => {
    acc[u.id] = tasks.filter(t => t.assigned_to === u.id && t.status !== 'Completed').length;
    return acc;
  }, {});

  const activeLeads = leads.filter(l => l.status !== 'Contract Sent' && l.status !== 'Cold');
  const statusCounts = activeLeads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">The Motherboard</h1>
          <p className="text-muted-foreground mt-1">All client work at a glance</p>
        </div>
        <Button onClick={() => setShowTaskForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      <div className="mb-8">
        <BrainDump onTasksCreated={loadData} />
      </div>

      <div className="mb-8">
        <PeterCard />
      </div>

      <div className="mb-8">
        <TodayAtAGlance tasks={tasks} user={user} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Teammate Workload</h3>
          <div className="space-y-2">
            {users.map(u => (
              <p key={u.id} className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{getDisplayName(u)}</span> - Current Workload: {workload[u.id] || 0} task{(workload[u.id] || 0) !== 1 ? 's' : ''}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Target className="w-5 h-5" /> Active Pipeline</h3>
          {activeLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active leads in the pipeline.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {['New', 'Proposal Sent', 'Contract Sent'].map(status => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{status}</span>
                  <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full text-foreground">{statusCounts[status] || 0}</span>
                </div>
              ))}
            </div>
          )}
          {activeLeads.length > 0 && (
            <div className="space-y-1.5">
              {activeLeads.slice(0, 5).map(lead => (
                <LeadCard key={lead.id} lead={lead} owner={users.find(u => u.id === lead.assigned_to)} />
              ))}
              {activeLeads.length > 5 && (
                <Link to="/leads" className="text-xs text-accent font-medium block text-center pt-1 hover:underline">
                  +{activeLeads.length - 5} more leads
                </Link>
              )}
            </div>
          )}
          <Link to="/leads" className="text-xs text-accent font-medium hover:underline mt-2 inline-block">View all leads →</Link>
        </div>
      </div>

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
    </div>
  );
}