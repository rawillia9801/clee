
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Dog, GitBranch, Gift } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function BuyerStats({ stats }) {
    return (
        <Card className="bg-muted/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Breeding Program Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary"/>
                    <div>
                        <p className="font-bold">${formatNumber(stats.totalSales)}</p>
                        <p className="text-xs text-muted-foreground">Total Sales</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dog className="w-5 h-5 text-primary"/>
                    <div>
                        <p className="font-bold">{stats.puppiesSold}</p>
                        <p className="text-xs text-muted-foreground">Puppies Sold</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary"/>
                    <div>
                        <p className="font-bold">{stats.puppiesGivenAway}</p>
                        <p className="text-xs text-muted-foreground">Kept/Gifted</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-primary"/>
                    <div>
                        <p className="font-bold">{stats.totalLitters}</p>
                        <p className="text-xs text-muted-foreground">Total Litters</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
