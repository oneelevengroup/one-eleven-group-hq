import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Rabbit, Loader2, Sparkles } from 'lucide-react';

export default function BrainDump({ onTasksCreated }) {
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('parseBrainDump', { text });
      setResult(res.data);
    } catch (e) {
      setResult({ error: 'Something went wrong. Try again.' });
    }
    setProcessing(false);
  };

  const handleDone = () => {
    setText('');
    setResult(null);
    if (onTasksCreated) onTasksCreated();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Rabbit className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-foreground text-sm">Peter · The Task Rabbit</h3>
          <p className="text-xs text-muted-foreground">Dump everything you need to do — Peter will add it to your to-do list</p>
        </div>
      </div>

      {!result ? (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder="e.g. Call Sarah at Jet Set Pilates about the website redesign by Friday, follow up with Bloom about their social media content, review the SEO report for The Well by end of week..."
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 mb-3"
          />
          <Button
            onClick={handleSubmit}
            disabled={processing || !text.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold w-full"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Create Tasks</>
            )}
          </Button>
        </>
      ) : result.error ? (
        <div className="text-center py-4">
          <p className="text-sm text-red-400 mb-3">{result.error}</p>
          <Button variant="outline" size="sm" onClick={() => setResult(null)} className="border-border">Try Again</Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <p className="text-foreground font-semibold mb-1">{result.count} task{result.count !== 1 ? 's' : ''} created</p>
          <div className="text-xs text-muted-foreground space-y-0.5 mt-2 mb-4">
            {result.tasks?.map((t, i) => (
              <p key={i} className="flex items-center justify-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  t.priority === 'Urgent' ? 'bg-red-400' : t.priority === 'High' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                {t.name}
              </p>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={handleDone} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Done</Button>
            <Button size="sm" variant="outline" onClick={() => setResult(null)} className="border-border">Dump More</Button>
          </div>
        </div>
      )}
    </div>
  );
}