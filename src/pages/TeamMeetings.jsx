import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Plus, Send, Users, Zap, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';
import { getTeamMembers } from '@/lib/getTeamMembers';
import { format } from 'date-fns';

export default function TeamMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [hotTopics, setHotTopics] = useState('');
  const [weeklyWin, setWeeklyWin] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        base44.entities.TeamMeeting.list('-date'),
        getTeamMembers(),
      ]);
      const meetingList = results[0].status === 'fulfilled' ? results[0].value : [];
      const userList = results[1].status === 'fulfilled' ? results[1].value : [];
      setMeetings(meetingList);
      setUsers(userList);

      const active = meetingList.length > 0 ? meetingList[0] : null;
      setActiveMeeting(active);

      if (active) {
        try {
          const subs = await base44.entities.MeetingSubmission.filter({ meeting_id: active.id });
          setSubmissions(subs);
          const mySub = subs.find(s => s.user_id === user.id);
          if (mySub) {
            setHotTopics(mySub.hot_topics || '');
            setWeeklyWin(mySub.weekly_win || '');
            setEditingSubmission(mySub);
          } else {
            setHotTopics('');
            setWeeklyWin('');
            setEditingSubmission(null);
          }
        } catch (err) {
          console.error('Submissions load error:', err);
        }
      }
    } catch (err) {
      console.error('TeamMeetings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getNextTuesday = () => {
    const now = new Date();
    const tuesday = new Date(now);
    tuesday.setDate(now.getDate() + ((2 + 7 - now.getDay()) % 7));
    return format(tuesday, 'yyyy-MM-dd');
  };

  const handleCreateMeeting = async () => {
    if (!newMeetingTitle.trim()) return;
    await base44.entities.TeamMeeting.create({
      title: newMeetingTitle.trim(),
      date: newMeetingDate || getNextTuesday(),
    });
    setShowNewMeeting(false);
    setNewMeetingTitle('');
    setNewMeetingDate('');
    await loadData();
  };

  const handleSubmit = async () => {
    setSaving(true);
    if (editingSubmission) {
      await base44.entities.MeetingSubmission.update(editingSubmission.id, {
        hot_topics: hotTopics,
        weekly_win: weeklyWin,
      });
    } else {
      await base44.entities.MeetingSubmission.create({
        meeting_id: activeMeeting.id,
        user_id: user.id,
        hot_topics: hotTopics,
        weekly_win: weeklyWin,
      });
    }
    await loadData();
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const mySubmission = submissions.find(s => s.user_id === user.id);
  const otherSubmissions = submissions.filter(s => s.user_id !== user.id);
  const submittedCount = submissions.length;
  const totalMembers = users.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">Team Meetings</h1>
          <p className="text-muted-foreground mt-1">Weekly huddle · Tuesdays at 11am</p>
        </div>
        <Button onClick={() => { setNewMeetingDate(getNextTuesday()); setShowNewMeeting(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Meeting
        </Button>
      </div>

      {!activeMeeting ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Calendar className="w-14 h-14 text-muted-foreground mx-auto mb-5 opacity-40" />
          <h3 className="font-heading font-bold text-lg text-foreground mb-2">No Meetings Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">Create your first team meeting to start collecting hot topics and weekly wins from the team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground">{activeMeeting.title}</h2>
                  <p className="text-sm text-muted-foreground">{activeMeeting.date ? format(new Date(activeMeeting.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy · h:mm a') : 'Date TBD'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-accent" />
                <h3 className="font-heading font-bold text-foreground">Your Submission</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">🔥 Hot Topics</label>
                  <p className="text-xs text-muted-foreground mb-2">Things we need to discuss as a group</p>
                  <textarea
                    value={hotTopics}
                    onChange={e => setHotTopics(e.target.value)}
                    rows={3}
                    placeholder="e.g. ILUMRA launch timeline needs recalibration, client feedback on Bloom's new website design…"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">🏆 Weekly Win</label>
                  <p className="text-xs text-muted-foreground mb-2">Something that went well this week — big or small</p>
                  <textarea
                    value={weeklyWin}
                    onChange={e => setWeeklyWin(e.target.value)}
                    rows={2}
                    placeholder="e.g. Closed the Jet Set Pilates contract, finally cracked the SEO strategy for The Well…"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={saving || (!hotTopics.trim() && !weeklyWin.trim())}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Send className="w-4 h-4 mr-2" /> {mySubmission ? 'Update Submission' : 'Submit'}</>}
                </Button>
              </div>
            </div>

            {otherSubmissions.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-5 h-5 text-accent" />
                  <h3 className="font-heading font-bold text-foreground">Team Submissions</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{otherSubmissions.length}</span>
                </div>

                <div className="space-y-4">
                  {otherSubmissions.map(sub => {
                    const member = users.find(u => u.id === sub.user_id);
                    return (
                      <div key={sub.id} className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-foreground mb-3">{getDisplayName(member) || 'Team Member'}</p>
                        {sub.hot_topics && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">🔥 Hot Topics</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{sub.hot_topics}</p>
                          </div>
                        )}
                        {sub.weekly_win && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">🏆 Weekly Win</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{sub.weekly_win}</p>
                          </div>
                        )}
                        {!sub.hot_topics && !sub.weekly_win && (
                          <p className="text-sm text-muted-foreground italic">No details submitted yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Submission Status</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Submitted</span>
                <span className="text-sm font-bold text-foreground">{submittedCount} / {totalMembers}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div className="bg-accent rounded-full h-2 transition-all" style={{ width: `${totalMembers > 0 ? (submittedCount / totalMembers) * 100 : 0}%` }} />
              </div>
              <div className="space-y-1.5">
                {users.map(u => {
                  const hasSubmitted = submissions.some(s => s.user_id === u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-2 text-sm">
                      {hasSubmitted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={hasSubmitted ? 'text-foreground' : 'text-muted-foreground'}>{getDisplayName(u)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeMeeting.agenda && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-heading font-bold text-foreground mb-3">Agenda</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeMeeting.agenda}</p>
              </div>
            )}

            {activeMeeting.notes && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-heading font-bold text-foreground mb-3">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeMeeting.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showNewMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">New Team Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <input
                  value={newMeetingTitle}
                  onChange={e => setNewMeetingTitle(e.target.value)}
                  placeholder="Weekly Huddle"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                <input
                  type="date"
                  value={newMeetingDate}
                  onChange={e => setNewMeetingDate(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewMeeting(false)} className="border-border">Cancel</Button>
                <Button onClick={handleCreateMeeting} disabled={!newMeetingTitle.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}