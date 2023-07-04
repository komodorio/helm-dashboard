import { NonEmptyArray } from "./types";

export const isNewerVersion = (oldVer: string, newVer: string) => {
  if (oldVer && oldVer[0] === "v") {
    oldVer = oldVer.substring(1);
  }

  if (newVer && newVer[0] === "v") {
    newVer = newVer.substring(1);
  }

  const oldParts = oldVer.split(".");
  const newParts = newVer.split(".");
  for (let i = 0; i < newParts.length; i++) {
    const a = ~~newParts[i]; // parse int
    const b = ~~oldParts[i]; // parse int
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
};

export function isNoneEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return Array.isArray(arr) && arr.length > 0;
}
