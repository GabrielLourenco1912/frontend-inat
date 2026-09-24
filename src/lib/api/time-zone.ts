export const APPLICATION_TIME_ZONE = "America/Sao_Paulo";

const inputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APPLICATION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const inputPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function wallTimeParts(date: Date) {
  return Object.fromEntries(
    inputFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

export function saoPauloDateTimeInputValue(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const { year, month, day, hour, minute } = wallTimeParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function parseSaoPauloDateTimeInput(value: string) {
  const match = inputPattern.exec(value);
  if (!match) return new Date(NaN);

  const target = Date.UTC(
    Number(match[1]), Number(match[2]) - 1, Number(match[3]),
    Number(match[4]), Number(match[5]),
  );
  let instant = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const visible = inputPattern.exec(saoPauloDateTimeInputValue(new Date(instant)));
    if (!visible) return new Date(NaN);
    const visibleAsUtc = Date.UTC(
      Number(visible[1]), Number(visible[2]) - 1, Number(visible[3]),
      Number(visible[4]), Number(visible[5]),
    );
    const adjustment = target - visibleAsUtc;
    instant += adjustment;
    if (adjustment === 0) break;
  }

  const date = new Date(instant);
  return saoPauloDateTimeInputValue(date) === value ? date : new Date(NaN);
}
