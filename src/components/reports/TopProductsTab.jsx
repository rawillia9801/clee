
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TopProductsTab() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState('revenue');
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.from('sale_items').select('quantity, price_per_unit, inventory(item_name, cost)').eq('inventory.user_id', user.id);
        if (!error) setSales(data);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const productPerformance = useMemo(() => {
        const aggregated = sales.reduce((acc, sale) => {
            const name = sale.inventory.item_name;
            if (!acc[name]) {
                acc[name] = { name, quantity: 0, revenue: 0, profit: 0 };
            }
            const saleRevenue = sale.price_per_unit * sale.quantity;
            const saleCost = sale.inventory.cost * sale.quantity;
            acc[name].quantity += sale.quantity;
            acc[name].revenue += saleRevenue;
            acc[name].profit += saleRevenue - saleCost;
            return acc;
        }, {});
        
        return Object.values(aggregated).sort((a, b) => b[sortKey] - a[sortKey]);
    }, [sales, sortKey]);

    if (loading) return <p>Loading product data...</p>;
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Top Products Report</CardTitle>
                            <CardDescription>Performance breakdown by product.</CardDescription>
                        </div>
                        <Select value={sortKey} onValueChange={setSortKey}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="revenue">Sort by Revenue</SelectItem>
                                <SelectItem value="profit">Sort by Profit</SelectItem>
                                <SelectItem value="quantity">Sort by Quantity</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Quantity Sold</TableHead>
                                <TableHead>Total Revenue</TableHead>
                                <TableHead>Total Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productPerformance.slice(0, 20).map(product => (
                                <TableRow key={product.name}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>${formatNumber(product.revenue)}</TableCell>
                                    <TableCell className={product.profit >= 0 ? 'text-green-600' : 'text-red-600'}>${formatNumber(product.profit)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    );
}
