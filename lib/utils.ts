export const formatTime = (totalMinutes: number) => {
    if (!totalMinutes || totalMinutes === 0) return [{ value: 0, unit: 'MIN' }];

    const years = Math.floor(totalMinutes / 525600);
    const months = Math.floor((totalMinutes % 525600) / 43200);
    const days = Math.floor((totalMinutes % 43200) / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (years > 0) parts.push({ value: years, unit: years === 1 ? 'AÑO' : 'AÑOS' });
    if (months > 0) parts.push({ value: months, unit: months === 1 ? 'MES' : 'MESES' });
    if (days > 0 && years === 0) parts.push({ value: days, unit: days === 1 ? 'DÍA' : 'DÍAS' });
    if (hours > 0 && months === 0 && years === 0) parts.push({ value: hours, unit: 'H' });
    if (minutes > 0 && days === 0 && months === 0 && years === 0) parts.push({ value: minutes, unit: 'MIN' });

    return parts.slice(0, 2);
};

export function getStartDate(filter: string): string | null {
  if (filter === 'all') return null;
  const days = parseInt(filter);
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}