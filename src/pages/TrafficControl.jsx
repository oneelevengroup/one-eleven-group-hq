import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Filter, Users, Calendar, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskDetail from '@/components/tasks/TaskDetail';
import LeadCard from '@/components/leads/LeadCard';
import BrainDump from '@/components/BrainDump';
import { Button } from '@/components/ui/button';

export default function TrafficControl() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({ client: '', status: '', assignee: '' });

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

  const filteredTasks = tasks.filter(t => {
    if (filters.client && t.client_id !== filters.client) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.assignee && t.assigned_to !== filters.assignee) return false;
    return true;
  });

  const groupedByClient = filteredTasks.reduce((acc, t) => {
    const clientId = t.client_id || 'unassigned';
    if (!acc[clientId]) acc[clientId] = [];
    acc[clientId].push(t);
    return acc;
  }, {});

  const workload = users.reduce((acc, u) => {
    acc[u.id] = tasks.filter(t => t.assigned_to === u.id && t.status !== 'Done').length;
    return acc;
  }, {});

  const getClient = (id) => clients.find(c => c.id === id);

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

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filters.client} onChange={e => setFilters({...filters, client: e.target.value})} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option value="">All Statuses</option>
          {['To Do', 'In Progress', 'In Review', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.assignee} onChange={e => setFilters({...filters, assignee: e.target.value})} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option value="">All Team</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Object.keys(groupedByClient).length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <p className="text-muted-foreground">No tasks match your filters. Create one to get started!</p>
            </div>
          ) : (
            Object.entries(groupedByClient).map(([clientId, clientTasks]) => {
              const client = getClient(clientId);
              return (
                <div key={clientId} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    {client?.color_tag && <span className="w-3 h-3 rounded-full" style={{backgroundColor: client.color_tag}} />}
                    <h3 className="font-heading font-bold text-foreground">{client?.name || 'Unassigned'}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">{clientTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {clientTasks.map(task => (
                      <TaskCard key={task.id} task={task} client={getClient(task.client_id)} assignee={users.find(u => u.id === task.assigned_to)} onClick={() => setSelectedTask(task)} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-6">
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

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Workload</h3>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{u.full_name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${workload[u.id] > 5 ? 'bg-red-500/10 text-red-400' : workload[u.id] > 2 ? 'bg-amber-500/10 text-amber-400' : 'bg-accent/10 text-accent'}`}>
                    {workload[u.id] || 0} open
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Today</h3>
            <p className="text-sm text-muted-foreground">Connect your Google Calendar in Settings to see today's events and suggested work blocks.</p>
          </div>
        </div>
      </div>

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
      {selectedTask && <TaskDetail task={selectedTask} clients={clients} users={users} currentUser={user} onClose={() => setSelectedTask(null)} onUpdated={loadData} />}
    </div>
  );
}