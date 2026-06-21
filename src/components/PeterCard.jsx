import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Sparkles } from 'lucide-react';

export default function PeterCard() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    setScanning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('peterScanMessages', {});
      setResult(res.data || res);
    } catch (err) {
      setResult({ error: err.message || 'Scan failed' });
    }
    setScanning(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">🐰</div>
          <div>
            <h3 className="font-heading font-bold text-foreground flex items-center gap-1.5">
              Peter the Task Rabbit <Sparkles className="w-3.5 h-3.5 text-accent" />
            </h3>
            <p className="text-xs text-muted-foreground">Auto-extracts to-dos from team messages every 15 minutes.</p>
          </div>
        </div>
        <Button onClick={handleScan} disabled={scanning} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shrink-0">
          {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning…</> : <><Search className="w-4 h-4 mr-2" /> Scan for to-dos</>}
        </Button>
      </div>
      {result && !result.error && (
        <p className="text-sm text-foreground mt-4 bg-accent/10 rounded-lg px-3 py-2">
          ✅ Peter created <span className="font-bold">{result.created}</span> to-do{result.created !== 1 ? 's' : ''} from <span className="font-bold">{result.scanned}</span> message{result.scanned !== 1 ? 's' : ''}.
        </p>
      )}
      {result?.error && (
        <p className="text-sm text-red-500 mt-4 bg-red-500/10 rounded-lg px-3 py-2">⚠️ {result.error}</p>
      )}
    </div>
  );
}