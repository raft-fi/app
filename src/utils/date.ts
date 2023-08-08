export const formatYYYYMMDD = (date?: Date) =>
  date
    ? [
        date.getFullYear().toString().padStart(4, '0'),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0'),
      ].join('-')
    : undefined;

export const normalizeDate = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};

export const getToday = () => normalizeDate(new Date());

export const getDateAfter = (ms: number) => {
  const today = getToday();
  const tmr = today.getTime() + ms;
  return new Date(tmr);
};
