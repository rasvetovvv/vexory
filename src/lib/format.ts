export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const statusLabels: Record<string, string> = {
  IDEA: "Idea",
  BUILDING: "Building",
  MVP_LAUNCHED: "MVP Launched",
  LAUNCHED: "Launched",
  PAUSED: "Paused",
  ACQUIRED: "Acquired",
};

export const roleLabels: Record<string, string> = {
  FOUNDER: "Founder",
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  PRODUCT_MANAGER: "Product Manager",
  MARKETER: "Marketer",
  AI_ENGINEER: "AI Engineer",
  COPYWRITER: "Copywriter",
  INVESTOR: "Investor",
  QA: "QA",
  DEVOPS: "DevOps",
  FREELANCER: "Freelancer",
  OTHER: "Other",
};

export const compensationLabels: Record<string, string> = {
  EQUITY: "Equity",
  PAID: "Paid",
  CONTRACT: "Contract",
  VOLUNTEER: "Volunteer",
};
