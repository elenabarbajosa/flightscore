export function formatPriceEUR(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatFactor(value: number): string {
  return value.toFixed(2);
}

export function formatPercentContribution(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function getPrimaryCarrier(
  operatingCarrier: string,
  marketingCarrier: string,
): string {
  return operatingCarrier || marketingCarrier;
}

export function summarizeLayovers(
  layovers: Array<{ airport: string; durationMinutes: number }>,
): string {
  if (layovers.length === 0) {
    return "Direct";
  }

  return layovers
    .map((layover) => `${layover.airport} ${formatDuration(layover.durationMinutes)}`)
    .join(" · ");
}
