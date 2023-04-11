export function getAge(date: Date | number | string) {
  if (typeof date === "number" || typeof date === "string") {
    date = new Date(date);
  }
  const age = Date.now() - date.getTime();
  const seconds = Math.floor(age / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (hours > 24) {
    return `${days}d`;
  } else if (minutes > 60) {
    return `${hours}h`;
  } else if (seconds > 60) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
