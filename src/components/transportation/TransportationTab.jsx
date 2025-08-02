
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Route, DollarSign, Hotel, PlusCircle } from 'lucide-react';
import { formatNumber, toDisplayDate } from '@/lib/utils';

export function TransportationTab() {
    const [transportEvents, setTransportEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchTransportData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('transportation')
            .select('*, puppies(name), buyers(full_name)')
            .eq('user_id', user.id)
            .order('delivery_date', { ascending: false });

        if (error) {
            toast({ title: 'Error fetching transportation data', description: error.message, variant: 'destructive' });
        } else {
            setTransportEvents(data || []);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchTransportData();
    }, [fetchTransportData]);

    const totalMileage = transportEvents.reduce((sum, event) => sum + (Number(event.mileage) || 0), 0) * 2;
    const totalCost = transportEvents.reduce((sum, event) => sum + (Number(event.cost) || 0), 0);

    if (loading) {
        return <div className="text-center py-10">Loading transportation data...</div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold">Transportation</h1>
                <p className="text-muted-foreground">Overview of all puppy drop-off events and associated costs.</p>
            </motion.div>

            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Mileage</CardTitle>
                        <Route className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(totalMileage, 0)} mi</div>
                        <p className="text-xs text-muted-foreground">Total round trip miles</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${formatNumber(totalCost)}</div>
                        <p className="text-xs text-muted-foreground">Total transportation costs</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery History</CardTitle>
                        <CardDescription>A log of all recorded puppy drop-off events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Delivery Date</TableHead>
                                        <TableHead>Puppy</TableHead>
                                        <TableHead>Buyer</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Mileage (RT)</TableHead>
                                        <TableHead>Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transportEvents.length > 0 ? (
                                        transportEvents.map(event => (
                                            <TableRow key={event.id}>
                                                <TableCell>{toDisplayDate(event.delivery_date)}</TableCell>
                                                <TableCell className="font-medium">{event.puppies?.name || 'N/A'}</TableCell>
                                                <TableCell>{event.buyers?.full_name || 'N/A'}</TableCell>
                                                <TableCell>{event.method}</TableCell>
                                                <TableCell>{formatNumber((event.mileage || 0) * 2, 0)} mi</TableCell>
                                                <TableCell>${formatNumber(event.cost)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">
                                                No transportation events found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
