export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  });
}

export function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function avatarColor(name: string): string {
  const colors = ["#0066FF","#7C3AED","#059669","#DC2626","#D97706","#0891B2"];
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFFFF;
  return colors[Math.abs(hash) % colors.length];
}

export const delay = (ms: number = 400): Promise<void> => new Promise(r => setTimeout(r, ms));

export interface User {
  id: string;
  fullName: string;
  studentId?: string;
  email?: string;
  role: "student" | "lecturer";
  avatarColor: string;
}