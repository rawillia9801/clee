
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/utils';

export const MonthlyReport = ({ data }) => {
  const chartData = [
    { name: 'Sales', value: data.totalSales },
    { name: 'CoGS', value: data.costOfGoods },
    { name: 'Shipping', value: data.shipping },
    { name: 'Fees', value: data.fees },
    { name: 'Refunds', value: data.refunds },
    { name: 'Profit', value: data.profit },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Sales:</span> <span className="font-medium">${formatNumber(data.totalSales)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cost of Goods:</span> <span className="font-medium text-destructive">-${formatNumber(data.costOfGoods)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping Costs:</span> <span className="font-medium text-destructive">-${formatNumber(data.shipping)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Commissions & Fees:</span> <span className="font-medium text-destructive">-${formatNumber(data.fees)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Refunds:</span> <span className="font-medium text-destructive">-${formatNumber(data.refunds)}</span></div>
          <hr className="my-2 border-border" />
          <div className="flex justify-between font-bold text-lg"><span className="text-foreground">Net Profit:</span> <span className={data.profit >= 0 ? 'text-primary' : 'text-destructive'}>${formatNumber(data.profit)}</span></div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} cursor={{ fill: 'rgba(132, 204, 22, 0.1)' }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
