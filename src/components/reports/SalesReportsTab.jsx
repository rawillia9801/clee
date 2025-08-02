
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SalesReportsTab() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { user } = useAuth();

    const fetchSales = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        let query = supabase.from('sales').select('*, sale_items(inventory(item_name))').eq('user_id', user.id);
        if (filter !== 'all') {
            query = query.eq('platform', filter);
        }
        const { data, error } = await query.order('sale_date', { ascending: false });

        if (!error) setSales(data);
        setLoading(false);
    }, [user, filter]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Sales Report", 14, 16);
        autoTable(doc, {
            head: [['Date', 'Customer', 'Platform', 'Total Amount']],
            body: sales.map(s => [
                s.sale_date ? format(new Date(s.sale_date), 'MM/dd/yyyy') : 'N/A',
                s.customer_name,
                s.platform || 'N/A',
                `$${formatNumber(s.total_amount)}`,
            ]),
            startY: 20
        });
        doc.save('sales-report.pdf');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Sales Report</CardTitle>
                            <CardDescription>A detailed report of all sales transactions.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sales</SelectItem>
                                    <SelectItem value="Marketplace">eCommerce</SelectItem>
                                    <SelectItem value="Direct">Direct Sales</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={exportToPDF}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.sale_date ? format(new Date(sale.sale_date), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                        <TableCell>{sale.customer_name}</TableCell>
                                        <TableCell>{sale.platform || 'N/A'}</TableCell>
                                        <TableCell>${formatNumber(sale.total_amount)}</TableCell>
                                        <TableCell>{sale.notes}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
