import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskDetail from '@/components/tasks/TaskDetail';
import ClientForm from '@/components/clients/ClientForm';

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
    const [clientList, taskList, userList] = await Promise.all([
      base44.entities.Client.list(),
      base44.entities.Task.list('-created_date'),
      base44.entities.User.list(),
    ]);
    const found = clientList.find(c => c.id === id) || null;
    setClient(found);
    setTasks(taskList.filter(t => t.client_id === id));
    setClients(clientList);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const getClientObj = (cid) => clients.find(c => c.id === cid);

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

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/clients" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {client.color_tag && <span className="w-4 h-4 rounded-full" style={{backgroundColor: client.color_tag}} />}
            <h1 className="text-3xl font-heading font-extrabold text-foreground">{client.name}</h1>
          </div>
          {client.contact_info && <p className="text-muted-foreground mt-1">{client.contact_info}</p>}
        </div>
        <Button variant="outline" onClick={() => setShowEditClient(true)} className="border-border">Edit</Button>
        <Button onClick={() => setShowTaskForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"><Plus className="w-4 h-4 mr-2" /> New Task</Button>
      </div>

      {client.notes && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No tasks for this client yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} client={getClientObj(task.client_id)} assignee={users.find(u => u.id === task.assigned_to)} onClick={() => setSelectedTask(task)} />
          ))}
        </div>
      )}

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} preselectedClient={id} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
      {showEditClient && <ClientForm client={client} onClose={() => setShowEditClient(false)} onSaved={() => { setShowEditClient(false); loadData(); }} />}
      {selectedTask && <TaskDetail task={selectedTask} clients={clients} users={users} currentUser={user} onClose={() => setSelectedTask(null)} onUpdated={loadData} />}
    </div>
  );
}