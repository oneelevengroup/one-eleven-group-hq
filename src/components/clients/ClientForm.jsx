import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/lib/utils';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import SocialPlatforms, { PLATFORM_OPTIONS, ICONS } from '@/components/clients/SocialPlatforms';

// Larger palette with shade variations so no two clients share the exact same color.
const TAG_COLORS = [
  '#EF4444', '#F87171', '#FCA5A5', '#FB923C', '#FDBA74', '#FBBF24', '#FCD34D',
  '#84CC16', '#A3E635', '#22C55E', '#4ADE80', '#10B981', '#34D399', '#6EE7B7',
  '#14B8A6', '#2DD4BF', '#06B6D4', '#22D3EE', '#0EA5E9', '#60A5FA', '#3B82F6',
  '#6366F1', '#818CF8', '#8B5CF6', '#A78BFA', '#A855F7', '#C084FC', '#D946EF',
  '#EC4899', '#F472B6', '#F43F5E', '#FB7185',
];

const SCOPE_OPTIONS = [
  'Website Design + Development',
  'Social Media Management',
  'SEO/AEO',
  'Content Creation',
  'Digital Ads',
  'Brand Design + Development',
  'A-La-Carte Project',
];

export default function ClientForm({ client, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    contact_info: client?.contact_info || '',
    point_of_contact: client?.point_of_contact || '',
    support_staff: client?.support_staff || [],
    scope_of_work: client?.scope_of_work || [],
    social_platforms: client?.social_platforms || [],
    notes: client?.notes || '',
    color_tag: client?.color_tag || TAG_COLORS[0],
    file_attachments: client?.file_attachments || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toggleStaff = (userId) => {
    setForm(prev => ({
      ...prev,
      support_staff: prev.support_staff.includes(userId)
        ? prev.support_staff.filter(id => id !== userId)
        : [...prev.support_staff, userId],
    }));
  };

  const toggleScope = (scope) => {
    setForm(prev => ({
      ...prev,
      scope_of_work: prev.scope_of_work.includes(scope)
        ? prev.scope_of_work.filter(s => s !== scope)
        : [...prev.scope_of_work, scope],
    }));
  };

  const togglePlatform = (platform) => {
    setForm(prev => ({
      ...prev,
      social_platforms: prev.social_platforms.includes(platform)
        ? prev.social_platforms.filter(p => p !== platform)
        : [...prev.social_platforms, platform],
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [...form.file_attachments];
    for (const file of files) {
      const result = await base44.integrations.Core.UploadFile({ file });
      urls.push(result.file_url);
    }
    setForm({ ...form, file_attachments: urls });
    setUploading(false);
    e.target.value = '';
  };

  const removeFile = (url) => {
    setForm({ ...form, file_attachments: form.file_attachments.filter(u => u !== url) });
  };

  const getFileName = (url) => {
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    return decodeURIComponent(last);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    if (client) {
      await base44.entities.Client.update(client.id, form);
    } else {
      await base44.entities.Client.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="font-heading font-bold text-lg text-foreground">{client ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Client Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Company or client name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Contact Info</label>
              <input value={form.contact_info} onChange={e => setForm({...form, contact_info: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Email or phone" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Point of Contact</label>
              <input value={form.point_of_contact} onChange={e => setForm({...form, point_of_contact: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Client contact name" />
            </div>
          </div>

          {users && users.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Support Staff</label>
              <div className="flex flex-wrap gap-2">
                {users.map(u => {
                  const selected = form.support_staff.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleStaff(u.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                        selected
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {getDisplayName(u)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Scope of Work</label>
            <div className="flex flex-wrap gap-1.5">
              {SCOPE_OPTIONS.map(scope => {
                const selected = form.scope_of_work.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                      selected
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Social Platforms</label>
            <p className="text-xs text-muted-foreground mb-2">Which platforms do we post for this client?</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_OPTIONS.map(platform => {
                const selected = form.social_platforms.includes(platform);
                const Icon = ICONS[platform];
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                      selected
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Color Tag</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color_tag: c})} className={`w-6 h-6 rounded-full transition-all ${form.color_tag === c ? 'ring-2 ring-foreground ring-offset-1 ring-offset-card scale-110' : 'hover:scale-105'}`} style={{backgroundColor: c}} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">File Attachments</label>
            <label className="flex items-center gap-2 bg-muted border border-dashed border-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-accent/50 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
              <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload files'}</span>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
            {form.file_attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {form.file_attachments.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-accent truncate">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{getFileName(url)}</span>
                    </a>
                    <button type="button" onClick={() => removeFile(url)} className="text-muted-foreground hover:text-red-400 flex-shrink-0 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Additional context..." />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">{saving ? 'Saving...' : client ? 'Update' : 'Add Client'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}