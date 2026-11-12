import { Skeleton } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-3">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton key={columnIndex} className="h-10 flex-1" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}