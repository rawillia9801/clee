
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];

export function PlatformInsightsTab() {
    const [platformData, setPlatformData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.from('sales').select('platform, total_amount, notes').eq('user_id', user.id);
        if (!error) {
            const aggregated = data.reduce((acc, sale) => {
                const platform = sale.platform || 'Direct Sale';
                if (!acc[platform]) {
                    acc[platform] = { name: platform, revenue: 0, profit: 0, salesCount: 0 };
                }
                acc[platform].revenue += sale.total_amount;
                // Profit calculation would need cost of goods, which is not in sales table.
                // For now, we can't calculate profit accurately here.
                acc[platform].salesCount++;
                return acc;
            }, {});
            setPlatformData(Object.values(aggregated));
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const totalRevenue = useMemo(() => platformData.reduce((sum, p) => sum + p.revenue, 0), [platformData]);

    if (loading) return <p>Loading platform insights...</p>;
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Performance</CardTitle>
                    <CardDescription>Revenue and profit breakdown by sales platform.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={platformData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                    {platformData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${formatNumber(value)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Detailed Breakdown</h3>
                        {platformData.map(p => (
                            <div key={p.name} className="p-3 bg-muted rounded-lg">
                                <p className="font-bold">{p.name}</p>
                                <div className="text-sm space-y-1 mt-1">
                                    <p>Revenue: <span className="font-semibold">${formatNumber(p.revenue)} ({totalRevenue > 0 ? (p.revenue / totalRevenue * 100).toFixed(1) : 0}%)</span></p>
                                    <p>Sales Count: <span className="font-semibold">{p.salesCount}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
