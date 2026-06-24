import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Plus, User, Users, Briefcase, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskDetail from '@/components/tasks/TaskDetail';
import ClientForm from '@/components/clients/ClientForm';
import SocialPlatforms from '@/components/clients/SocialPlatforms';
import ClientFiles from '@/components/clients/ClientFiles';
import { getTeamMembers } from '@/lib/getTeamMembers';

export default function ClientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        base44.entities.Client.list(),
        base44.entities.Task.list('-created_date'),
        getTeamMembers(),
      ]);
      const clientList = results[0].status === 'fulfilled' ? results[0].value : [];
      const taskList = results[1].status === 'fulfilled' ? results[1].value : [];
      const userList = results[2].status === 'fulfilled' ? results[2].value : [];
      const found = clientList.find(c => c.id === id) || null;
      setClient(found);
      setTasks(taskList.filter(t => t.client_id === id));
      setClients(clientList);
      setUsers(userList);
    } catch (err) {
      console.error('ClientDetail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const getClientObj = (cid) => clients.find(c => c.id === cid);
  const getStaffNames = (staffIds) => (staffIds || []).map(sid => { const u = users.find(u => u.id === sid); return u ? getDisplayName(u) : sid; }).filter(Boolean);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-16">
      <h2 className="text-xl font-heading font-bold text-foreground">Client not found</h2>
      <Link to="/clients" className="text-accent mt-2 inline-block text-sm font-medium">Back to Clients</Link>
    </div>
  );

  const staffNames = getStaffNames(client.support_staff);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/clients" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {client.color_tag && <span className="w-4 h-4 rounded-full" style={{backgroundColor: client.color_tag}} />}
            <h1 className="text-3xl font-heading font-extrabold text-foreground">{client.name}</h1>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowEditClient(true)} className="border-border">Edit</Button>
        <Button onClick={() => setShowTaskForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"><Plus className="w-4 h-4 mr-2" /> New Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {client.point_of_contact && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
            <User className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Point of Contact</p>
              <p className="text-sm text-foreground font-medium">{client.point_of_contact}</p>
              {client.contact_info && <p className="text-xs text-muted-foreground mt-0.5">{client.contact_info}</p>}
            </div>
          </div>
        )}

        {staffNames.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
            <Users className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Support Staff</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {staffNames.map(name => (
                  <span key={name} className="text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full">{name}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {(!client.point_of_contact && staffNames.length === 0) && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3 md:col-span-2">
            <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">No contact or staff info yet. Click Edit to add details.</p>
            </div>
          </div>
        )}
      </div>

      {client.scope_of_work?.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex items-start gap-3">
          <Briefcase className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Scope of Work</p>
            <div className="flex flex-wrap gap-1.5">
              {client.scope_of_work.map(scope => (
                <span key={scope} className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-full">{scope}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {client.social_platforms?.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex items-start gap-3">
          <Share2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Social Platforms</p>
            <div className="flex flex-wrap gap-2.5">
              {client.social_platforms.map(platform => (
                <SocialPlatforms key={platform} platforms={[platform]} size="w-5 h-5" />
              ))}
            </div>
          </div>
        </div>
      )}

      <ClientFiles client={client} onUpdated={(updated) => setClient(updated)} />

      {client.notes && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No tasks for this client yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const openTasks = tasks.filter(t => t.status !== 'Completed');
            const completedTasks = tasks.filter(t => t.status === 'Completed');
            return (
              <>
                {openTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">Open Tasks</h3>
                      <span className="text-xs text-muted-foreground">({openTasks.length})</span>
                      <div className="flex-1 h-px bg-border ml-1" />
                    </div>
                    <div className="space-y-2">
                      {openTasks.map(task => (
                        <TaskCard key={task.id} task={task} client={getClientObj(task.client_id)} assignee={users.find(u => u.id === task.assigned_to)} onClick={() => setSelectedTask(task)} />
                      ))}
                    </div>
                  </div>
                )}
                {completedTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">Completed Tasks</h3>
                      <span className="text-xs text-muted-foreground">({completedTasks.length})</span>
                      <div className="flex-1 h-px bg-border ml-1" />
                    </div>
                    <div className="space-y-2">
                      {completedTasks.map(task => (
                        <TaskCard key={task.id} task={task} client={getClientObj(task.client_id)} assignee={users.find(u => u.id === task.assigned_to)} onClick={() => setSelectedTask(task)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} preselectedClient={id} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
      {showEditClient && <ClientForm client={client} users={users} onClose={() => setShowEditClient(false)} onSaved={() => { setShowEditClient(false); loadData(); }} />}
      {selectedTask && <TaskDetail task={selectedTask} clients={clients} users={users} currentUser={user} onClose={() => setSelectedTask(null)} onUpdated={loadData} />}
    </div>
  );
}