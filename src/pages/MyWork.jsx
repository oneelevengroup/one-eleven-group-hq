import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Clock, Plus, Filter } from 'lucide-react';
import TaskForm from '@/components/tasks/TaskForm';
import BrainDump from '@/components/BrainDump';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDetail from '@/components/tasks/TaskDetail';
import { Button } from '@/components/ui/button';

export default function MyWork() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

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
  const filteredTasks = statusFilter === 'all' ? myTasks : myTasks.filter(t => t.status === statusFilter);
  const statuses = ['URGENT', 'To Do', 'In Progress', 'Stuck', 'Completed'];

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

      <div className="mb-8">
        <BrainDump onTasksCreated={loadData} />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <button onClick={() => setStatusFilter('all')} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${statusFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>All ({myTasks.length})</button>
          {statuses.map(s => {
            const count = myTasks.filter(t => t.status === s).length;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${statusFilter === s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{s} ({count})</button>
            );
          })}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No tasks{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}. Use Peter to create some!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              client={clients.find(c => c.id === task.client_id)}
              assignee={users.find(u => u.id === task.assigned_to)}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>
      )}

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
      {selectedTask && <TaskDetail task={selectedTask} clients={clients} users={users} currentUser={user} onClose={() => setSelectedTask(null)} onSaved={() => { setSelectedTask(null); loadData(); }} />}
    </div>
  );
}