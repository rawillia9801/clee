
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog, Truck, AlertTriangle, Repeat, PieChart, LineChart, BarChart3 } from 'lucide-react';
import { format, startOfYear, endOfYear, addDays, isWithinInterval, getMonth, eachMonthOfInterval } from 'date-fns';
import { Bar, Pie, Line, ResponsiveContainer, BarChart as RechartsBarChart, PieChart as RechartsPieChart, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';

const StatCard = ({ title, value, icon: Icon, description, onClick, colorClass = 'text-primary' }) => (
    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Card className={`h-full ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${colorClass}`} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </motion.div>
);

const PIE_COLORS = ['#0088FE', '#00C49F'];

export function Dashboard() {
    const [stats, setStats] = useState({
        revenueYTD: 0,
        upcomingAppointments: [],
        pendingDeliveries: 0,
        outstandingBalances: 0,
        puppiesAwaitingPickup: 0,
        repeatCustomers: 0,
        monthlyPuppySales: [],
        revenueByPlatform: [],
        monthlyMileage: [],
    });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const today = new Date();
        const ytdStart = startOfYear(today);
        const ytdEnd = endOfYear(today);
        const nextWeekStart = today;
        const nextWeekEnd = addDays(today, 7);

        const [puppiesRes, eventsRes, buyersRes, salesRes, transportRes, balancesRes] = await Promise.all([
            supabase.from('puppies').select('status, price_sold, go_home_date').eq('user_id', user.id),
            supabase.from('calendar_events').select('title, start_time, event_type, notes').eq('user_id', user.id),
            supabase.from('buyers').select('id, internal_notes').eq('user_id', user.id),
            supabase.from('sales').select('total_amount, platform, sale_date').eq('user_id', user.id),
            supabase.from('transportation').select('mileage, delivery_date').eq('user_id', user.id),
            supabase.rpc('get_customer_financials')
        ]);

        if(balancesRes.error) {
            console.error("Error fetching customer financials:", balancesRes.error.message);
        }

        const ytdPuppies = puppiesRes.data?.filter(p => p.go_home_date && isWithinInterval(new Date(p.go_home_date), { start: ytdStart, end: ytdEnd })) || [];
        const revenueYTD = ytdPuppies.reduce((sum, p) => sum + (p.price_sold || 0), 0) || 0;
        
        const upcomingAppointments = eventsRes.data?.filter(e => e.start_time && isWithinInterval(new Date(e.start_time), { start: nextWeekStart, end: nextWeekEnd })) || [];
        const pendingDeliveries = upcomingAppointments.filter(e => e.event_type === 'Puppy Drop Off').length;
        
        const outstandingBalances = balancesRes.data?.filter(b => b.balance > 0).length || 0;
        
        const puppiesAwaitingPickup = puppiesRes.data?.filter(p => p.status === 'Sold' && p.go_home_date && new Date(p.go_home_date) < new Date()).length || 0;
        
        const repeatCustomers = buyersRes.data?.filter(b => b.internal_notes && b.internal_notes.toLowerCase().includes('repeat')).length || 0;

        const monthlyPuppySalesData = eachMonthOfInterval({ start: ytdStart, end: ytdEnd }).map(month => ({
            name: format(month, 'MMM'),
            sales: ytdPuppies.filter(p => p.go_home_date && getMonth(new Date(p.go_home_date)) === getMonth(month)).length,
        }));
        
        const ytdSales = salesRes.data?.filter(s => s.sale_date && isWithinInterval(new Date(s.sale_date), { start: ytdStart, end: ytdEnd })) || [];
        const eCommerceRevenue = ytdSales.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
        const revenueByPlatformData = [
            { name: 'Puppy Sales', value: revenueYTD },
            { name: 'eCommerce', value: eCommerceRevenue },
        ];
        
        const ytdTransport = transportRes.data?.filter(t => t.delivery_date && isWithinInterval(new Date(t.delivery_date), { start: ytdStart, end: ytdEnd })) || [];
        const monthlyMileageData = eachMonthOfInterval({ start: ytdStart, end: ytdEnd }).map(month => ({
            name: format(month, 'MMM'),
            mileage: ytdTransport.filter(t => t.delivery_date && getMonth(new Date(t.delivery_date)) === getMonth(month)).reduce((sum, t) => sum + (t.mileage || 0), 0),
        }));

        setStats({
            revenueYTD,
            upcomingAppointments,
            pendingDeliveries,
            outstandingBalances,
            puppiesAwaitingPickup,
            repeatCustomers,
            monthlyPuppySales: monthlyPuppySalesData,
            revenueByPlatform: revenueByPlatformData,
            monthlyMileage: monthlyMileageData,
        });

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleCardClick = (tab) => {
        window.dispatchEvent(new CustomEvent('setactivetab', { detail: tab }));
    };

    if (loading) {
        return <div className="text-center py-10">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight">Dashboard</motion.h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={Truck} description="This week" onClick={() => handleCardClick('calendar')} colorClass="text-orange-500" />
                <StatCard title="Outstanding Balances" value={stats.outstandingBalances} icon={AlertTriangle} description="From all customers" onClick={() => handleCardClick('all-orders')} colorClass="text-red-500" />
                <StatCard title="Awaiting Pickup" value={stats.puppiesAwaitingPickup} icon={Dog} description="Puppies sold, not delivered" onClick={() => handleCardClick('breeding-program_my-litters')} colorClass="text-blue-500" />
                <StatCard title="Repeat Customers" value={stats.repeatCustomers} icon={Repeat} description="Total repeat buyers" onClick={() => handleCardClick('all-orders')} colorClass="text-green-500" />
            </div>

             <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><LineChart size={20}/>Puppy Sales per Month</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={stats.monthlyPuppySales}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><PieChart size={20}/>Revenue by Platform</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie data={stats.revenueByPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {stats.revenueByPlatform.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
             </div>
             
             <div className="grid gap-6">
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                     <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 size={20}/>Mileage by Month</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={stats.monthlyMileage}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                                    <Legend />
                                    <Bar dataKey="mileage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                     </Card>
                 </motion.div>
             </div>
        </div>
    );
}
