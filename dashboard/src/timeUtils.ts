export const getAge = (obj1: Date | number | string): string => {
  const date = new Date(obj1);
  const dateNext = new Date();
  const diff = dateNext.getTime() - date.getTime();

  const units: [string, number][] = [
    ["years", 24 * 60 * 60 * 1000 * 365],
    ["months", 24 * 60 * 60 * 1000 * 30],
    ["days", 24 * 60 * 60 * 1000],
    ["hours", 60 * 60 * 1000],
    ["minutes", 60 * 1000],
    ["seconds", 1000],
    ["milliseconds", 1]
  ];
  
  const map: any = {
    years: "yr",
    months: "mo",
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    milliseconds: "ms",
  };

  for (let [unit, value] of units) {
    const val = diff / value;
    if (val >= 1) {
      return Math.round(val) + map[unit];
    }
  }
  
  return "n/a";
}
