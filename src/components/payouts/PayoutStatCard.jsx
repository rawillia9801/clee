
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function PayoutStatCard({ title, value, isPercentage = false }) {
    const getIcon = () => {
        if (!isPercentage) return null;
        if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    const displayValue = isPercentage 
        ? `${value.toFixed(2)}%`
        : `$${formatNumber(value)}`;

    const valueColor = isPercentage 
        ? value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground'
        : 'text-foreground';

    return (
        <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {getIcon()}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueColor}`}>{displayValue}</div>
            </CardContent>
        </Card>
    );
}
