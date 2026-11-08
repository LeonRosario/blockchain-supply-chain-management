/**
 * StatsCard — summary metric card for the dashboard overview.
 * Placeholder — UI implementation pending.
 */
interface StatsCardProps {
  title: string;
  value: string | number;
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  );
}
