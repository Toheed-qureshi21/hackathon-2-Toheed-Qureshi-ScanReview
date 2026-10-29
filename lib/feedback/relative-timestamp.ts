export function formatRelativeTimestamp(
  iso: string,
  nowMs = Date.now(),
): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) {
    return "";
  }

  const diffSec = Math.round((nowMs - then) / 1000);
  if (diffSec < 45) {
    return "Just now";
  }
  if (diffSec < 90) {
    return "1 min ago";
  }
  if (diffSec < 3600) {
    return `${Math.round(diffSec / 60)} min ago`;
  }
  if (diffSec < 5400) {
    return "1 hr ago";
  }
  if (diffSec < 86_400) {
    return `${Math.round(diffSec / 3600)} hr ago`;
  }
  if (diffSec < 172_800) {
    return "Yesterday";
  }

  const days = Math.round(diffSec / 86_400);
  if (days < 7) {
    return `${days} days ago`;
  }

  return new Date(then).toLocaleDateString();
}
