import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Filter, Users2 } from 'lucide-react';
import TaskForm from '@/components/tasks/TaskForm';
import BrainDump from '@/components/BrainDump';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDetail from '@/components/tasks/TaskDetail';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';
import { getTeamMembers } from '@/lib/getTeamMembers';

export default function MyWork() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullUser, setFullUser] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('URGENT');

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        base44.entities.Task.list('-created_date'),
        base44.entities.Client.list(),
        getTeamMembers(),
      ]);
      const taskList = results[0].status === 'fulfilled' ? results[0].value : [];
      const clientList = results[1].status === 'fulfilled' ? results[1].value : [];
      const userList = results[2].status === 'fulfilled' ? results[2].value : [];
      setTasks(taskList);
      setClients(clientList);
      setUsers(userList);
      if (user?.id) {
        const entityUser = userList.find(u => u.id === user.id);
        setFullUser(entityUser || null);
      }
    } catch (err) {
      console.error('MyWork load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const myTasks = tasks.filter(t => t.assigned_to === user?.id);
  const delegatedTasks = tasks.filter(t => t.assigned_by === user?.id && t.assigned_to && t.assigned_to !== user?.id);
  const calendarEmbedSrc = fullUser?.calendar_embed_src || null;
  const isUrgent = (t) => (t.status === 'URGENT' || t.priority === 'Urgent') && t.status !== 'Completed';
  const filteredTasks = statusFilter === 'all'
    ? myTasks
    : statusFilter === 'URGENT'
      ? myTasks.filter(isUrgent)
      : statusFilter === 'Completed'
        ? myTasks.filter(t => t.status === 'Completed')
        : myTasks.filter(t => t.status === statusFilter && !isUrgent(t));
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
          {statuses.map(s => {
            const count = s === 'URGENT'
              ? myTasks.filter(isUrgent).length
              : myTasks.filter(t => t.status === s && !isUrgent(t)).length;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${statusFilter === s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{s} ({count})</button>
            );
          })}
          <button onClick={() => setStatusFilter('all')} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${statusFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>All ({myTasks.length})</button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No tasks{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}. Use Peter to create some!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const grouped = filteredTasks.reduce((acc, task) => {
              const client = clients.find(c => c.id === task.client_id);
              const key = client ? client.id : '__none__';
              if (!acc[key]) acc[key] = { client, tasks: [] };
              acc[key].tasks.push(task);
              return acc;
            }, {});
            return Object.values(grouped).map(({ client, tasks: groupTasks }) => (
              <div key={client?.id || '__none__'}>
                <div className="flex items-center gap-2 mb-2">
                  {client?.color_tag && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: client.color_tag }} />}
                  <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">
                    {client ? client.name : 'No Client'}
                  </h3>
                  <span className="text-xs text-muted-foreground">({groupTasks.length})</span>
                  <div className="flex-1 h-px bg-border ml-1" />
                </div>
                <div className="space-y-2">
                  {groupTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      client={client}
                      assignee={users.find(u => u.id === task.assigned_to)}
                      onClick={() => setSelectedTask(task)}
                      onDelete={async (t) => { await base44.entities.Task.delete(t.id); loadData(); }}
                      onComplete={async (t) => { await base44.entities.Task.update(t.id, { status: 'Completed' }); loadData(); }}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {delegatedTasks.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <Users2 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-heading font-bold text-foreground">Delegated</h2>
            <span className="text-xs text-muted-foreground">({delegatedTasks.length})</span>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Task</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Assigned To</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {delegatedTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigned_to);
                    return (
                      <tr key={task.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedTask(task)}>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-medium text-foreground">{task.name}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-muted-foreground">{assignee ? getDisplayName(assignee) : '—'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium text-muted-foreground">{task.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {calendarEmbedSrc && (
        <div className="mt-10">
          <h2 className="text-lg font-heading font-bold text-foreground mb-3">My Calendar</h2>
          <div className="rounded-xl overflow-hidden border border-border">
            <iframe
              src={calendarEmbedSrc}
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              title="My Calendar"
            />
          </div>
        </div>
      )}

      {showTaskForm && <TaskForm clients={clients} users={users} currentUser={user} onClose={() => setShowTaskForm(false)} onSaved={() => { setShowTaskForm(false); loadData(); }} />}
      {selectedTask && <TaskDetail task={selectedTask} clients={clients} users={users} currentUser={user} onClose={() => setSelectedTask(null)} onSaved={() => { setSelectedTask(null); loadData(); }} onUpdated={() => { setSelectedTask(null); loadData(); }} />}
    </div>
  );
}