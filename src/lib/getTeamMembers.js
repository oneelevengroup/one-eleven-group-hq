import { base44 } from '@/api/base44Client';

// Fetches the team roster via a backend function running as service role,
// so non-admin users can still see teammate display names/emails.
// Always returns an array (empty on failure) — never throws.
export async function getTeamMembers() {
  try {
    const res = await base44.functions.invoke('getTeamMembers', {});
    return res.data || res || [];
  } catch {
    return [];
  }
}