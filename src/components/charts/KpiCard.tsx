import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string
  unit: string
  sub?: string
  trend?: 'good' | 'bad' | 'neutral'
  icon?: React.ReactNode
}

export function KpiCard({ title, value, unit, sub, trend = 'neutral', icon }: Props) {
  const trendColor = {
    good: 'text-green-600',
    bad: 'text-red-500',
    neutral: 'text-gray-900',
  }[trend]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold tabular-nums', trendColor)}>
          {value}
          <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
        </div>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
