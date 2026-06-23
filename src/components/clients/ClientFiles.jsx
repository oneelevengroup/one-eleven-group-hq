import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, X, Paperclip } from 'lucide-react';

const getFileName = (url) => {
  const parts = url.split('/');
  const last = parts[parts.length - 1];
  return decodeURIComponent(last);
};

export default function ClientFiles({ client, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(null);
  const files = client.file_attachments || [];

  const handleUpload = async (e) => {
    const fileList = Array.from(e.target.files);
    if (!fileList.length) return;
    setUploading(true);
    try {
      const urls = [...files];
      for (const file of fileList) {
        const result = await base44.integrations.Core.UploadFile({ file });
        urls.push(result.file_url);
      }
      const updated = await base44.entities.Client.update(client.id, { file_attachments: urls });
      onUpdated(updated);
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleRemove = async (url) => {
    setRemoving(url);
    try {
      const urls = files.filter(u => u !== url);
      const updated = await base44.entities.Client.update(client.id, { file_attachments: urls });
      onUpdated(updated);
    } catch (err) {
      console.error('Remove error:', err);
    }
    setRemoving(null);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-accent" /> Files
        </h3>
        <label className="cursor-pointer">
          <input type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          <span className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </span>
        </label>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files attached yet.</p>
      ) : (
        <div className="space-y-1.5">
          {files.map((url, idx) => (
            <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-accent truncate min-w-0">
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{getFileName(url)}</span>
              </a>
              <button
                onClick={() => handleRemove(url)}
                disabled={removing === url}
                className="text-muted-foreground hover:text-red-400 flex-shrink-0 ml-2 transition-colors disabled:opacity-50"
              >
                {removing === url ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}