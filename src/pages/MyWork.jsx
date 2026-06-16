import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Clock, Plus } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskDetail from '@/components/tasks/TaskDetail';
import { Button } from '@/components/ui/button';

export default function MyWork() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadData = async () => {
    const [taskList, clientList, userList] = await Promise.all([
      base44.entities.Task.list('-created_date'),
      base44.entities.Client.list(),
      base44.entities.User.list(),
    ]);
    setTasks(taskList);
    setClients(clientList);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const myTasks = tasks.filter(t => t.assigned_to === user?.id);
  const filteredTasks = filter === 'all' ? myTasks : myTasks.filter(t => t.status === filter);
  const getClient = (id) => clients.find(c => c.id === id);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">My Work</h1>
          <p className="text-muted-foreground mt-1">Your tasks and schedule</p>
        </div>
        <Button onClick={() => setShowTaskForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            {['all', 'To Do', 'In Progress', 'In Review', 'Done'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === s ? 'bg-accent text-accent-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          {filteredTasks.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <p className="text-muted-foreground">No tasks assigned to you{filter !== 'all' ? ` with status "${filter}"` : ''}. Head to Traffic Control to pick up work!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} client={getClient(task.client_id)} assignee={users.find(u => u.id === task.assigned_to)} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Your Schedule</h3>
            <p className="text-sm text-muted-foreground">Connect your Google Calendar in Settings to see your upcoming events.</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Free Blocks</h3>
            <p className="text-sm text-muted-foreground">Connect your calendar to see suggested work blocks for your tasks.</p>
          </div>
        </div>
      </div>

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
      {selectedTask && <TaskDetail task={selectedTask} clients={clients} users={users} currentUser={user} onClose={() => setSelectedTask(null)} onUpdated={loadData} />}
    </div>
  );
}