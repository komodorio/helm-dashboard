import { DateTime, type DurationLikeObject } from "luxon";
import { ReleaseRevision } from "./data/types";

export function getAge(obj1: ReleaseRevision, obj2?: ReleaseRevision) {
  const date = DateTime.fromISO(obj1.updated);
  let dateNext = DateTime.now();
  if (obj2) {
    dateNext = DateTime.fromISO(obj2.updated);
  }
  const diff = dateNext.diff(date);

  const map: Record<string, string> = {
    years: "yr",
    months: "mo",
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    milliseconds: "ms",
  };

  for (const unit of Object.keys(map)) {
    const val = diff.as(unit as keyof DurationLikeObject);
    if (val >= 1) {
      return Math.round(val) + map[unit];
    }
  }
  return "n/a";
}
