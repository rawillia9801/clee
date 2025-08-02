
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PnlReportsTab() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const { user } = useAuth();
    
    const fetchPnlData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 11, 31));
        
        const [salesRes, billsRes] = await Promise.all([
            supabase.from('sales').select('sale_date, total_amount, notes').eq('user_id', user.id).gte('sale_date', startDate.toISOString()).lte('sale_date', endDate.toISOString()),
            supabase.from('bills').select('due_date, amount').eq('user_id', user.id).gte('due_date', startDate.toISOString()).lte('due_date', endDate.toISOString())
        ]);
        
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        const pnlData = months.map(monthStart => {
            const monthEnd = endOfYear(monthStart);
            const monthName = format(monthStart, 'MMM');
            
            const salesInMonth = (salesRes.data || []).filter(s => new Date(s.sale_date) >= monthStart && new Date(s.sale_date) <= monthEnd);
            const billsInMonth = (billsRes.data || []).filter(b => new Date(b.due_date) >= monthStart && new Date(b.due_date) <= monthEnd);

            const revenue = salesInMonth.reduce((sum, s) => sum + s.total_amount, 0);
            // COGS would need to be calculated from inventory or puppy costs, not available directly in sales table
            const cogs = 0; 
            const expenses = billsInMonth.reduce((sum, b) => sum + b.amount, 0);
            const profit = revenue - cogs - expenses;

            return { name: monthName, revenue, cogs, expenses, profit };
        });

        setMonthlyData(pnlData);
        setLoading(false);
    }, [user, year]);

    useEffect(() => {
        fetchPnlData();
    }, [fetchPnlData]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
        const totalCogs = monthlyData.reduce((sum, d) => sum + d.cogs, 0);
        const totalExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0);
        const totalProfit = monthlyData.reduce((sum, d) => sum + d.profit, 0);
        
        doc.text(`Profit & Loss Statement for ${year}`, 14, 16);
        autoTable(doc, {
            head: [['Month', 'Revenue', 'COGS', 'Expenses', 'Profit']],
            body: monthlyData.map(d => [d.name, `$${formatNumber(d.revenue)}`, `$${formatNumber(d.cogs)}`, `$${formatNumber(d.expenses)}`, `$${formatNumber(d.profit)}`]),
            startY: 20,
            didDrawPage: (data) => {
                doc.text(`Totals: Revenue $${formatNumber(totalRevenue)}, COGS $${formatNumber(totalCogs)}, Expenses $${formatNumber(totalExpenses)}, Profit $${formatNumber(totalProfit)}`, 14, doc.internal.pageSize.height - 10);
            }
        });
        doc.save(`pnl-report-${year}.pdf`);
    };

    const availableYears = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Profit & Loss Report</CardTitle>
                            <CardDescription>Monthly breakdown of revenue, costs, and profit for the selected year.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={year.toString()} onValueChange={val => setYear(parseInt(val))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={exportToPDF}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `$${formatNumber(value, 0)}`} />
                                    <Tooltip formatter={(value, name) => [`$${formatNumber(value)}`, name]} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#82ca9d" />
                                    <Bar dataKey="profit" fill="#8884d8" />
                                    <Bar dataKey="expenses" fill="#ffc658" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
