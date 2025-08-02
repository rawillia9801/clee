
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dog, Calendar, DollarSign, Gift, GitBranch, Route } from 'lucide-react';
import { formatNumber, toDisplayDate } from '@/lib/utils';
import { startOfYear, startOfMonth, subMonths, endOfMonth } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, prefix = '$', isCount = false }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isCount ? '' : prefix}{isCount ? value : formatNumber(value)}</div>
      </CardContent>
    </Card>
);

export function PuppySalesInsightsTab() {
    const [loading, setLoading] = useState(true);
    const [puppySalesStats, setPuppySalesStats] = useState({ thisMonth: 0, lastMonth: 0, ytd: 0 });
    const [upcomingLitters, setUpcomingLitters] = useState([]);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const endOfThisMonth = endOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));
        const endOfLastMonth = endOfMonth(subMonths(now, 1));
        const startOfThisYear = startOfYear(now);

        const [thisMonthSales, lastMonthSales, ytdSales, littersRes] = await Promise.all([
            supabase.from('sales').select('id').eq('user_id', user.id).eq('sale_type', 'SWVA Chihuahua').gte('date', startOfThisMonth.toISOString()).lte('date', endOfThisMonth.toISOString()),
            supabase.from('sales').select('id').eq('user_id', user.id).eq('sale_type', 'SWVA Chihuahua').gte('date', startOfLastMonth.toISOString()).lte('date', endOfLastMonth.toISOString()),
            supabase.from('sales').select('id').eq('user_id', user.id).eq('sale_type', 'SWVA Chihuahua').gte('date', startOfThisYear.toISOString()).lte('date', endOfThisMonth.toISOString()),
            supabase.from('litters').select('*, breeding_dogs(name), puppies(price_sold)').eq('user_id', user.id).gte('litter_date', now.toISOString()).order('litter_date'),
        ]);

        if (thisMonthSales.error || lastMonthSales.error || ytdSales.error || littersRes.error) {
            toast({ title: 'Error fetching puppy insights', variant: 'destructive' });
        } else {
            setPuppySalesStats({ thisMonth: thisMonthSales.data?.length || 0, lastMonth: lastMonthSales.data?.length || 0, ytd: ytdSales.data?.length || 0 });
            
            const littersWithRevenue = littersRes.data?.map(litter => {
                const totalRevenue = litter.puppies.reduce((sum, p) => sum + (p.price_sold || 0), 0);
                return { ...litter, totalRevenue };
            }) || [];
            setUpcomingLitters(littersWithRevenue);
        }
        
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div>Loading insights...</div>;

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Puppy Insights</h2>
                    <p className="text-muted-foreground">Sales performance and upcoming litters.</p>
                </div>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Dog className="text-primary"/>Puppy Sales</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                        <StatCard title="This Month" value={puppySalesStats.thisMonth} icon={Calendar} isCount={true} />
                        <StatCard title="Last Month" value={puppySalesStats.lastMonth} icon={Calendar} isCount={true} />
                        <StatCard title="Year-to-Date" value={puppySalesStats.ytd} icon={Calendar} isCount={true} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="text-primary"/>Upcoming Litters</CardTitle></CardHeader>
                    <CardContent>
                        {upcomingLitters.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingLitters.map(litter => (
                                    <Card key={litter.id}>
                                        <CardHeader><CardTitle>{litter.breeding_dogs.name}</CardTitle><CardDescription>{toDisplayDate(litter.litter_date)}</CardDescription></CardHeader>
                                        <CardContent>
                                            <p>Expected Puppies: {litter.number_of_puppies || 'N/A'}</p>
                                            <p>Dam Revenue (YTD): ${formatNumber(litter.totalRevenue)}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground">No upcoming litters scheduled.</p>}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
