
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { SalesDialog } from './SalesDialog';
import { formatNumber } from '@/lib/utils';

export function AllSalesTab() {
    const [sales, setSales] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const [salesRes, inventoryRes, buyersRes] = await Promise.all([
            supabase.from('sales').select('*, inventory(item_name), buyers(name)').eq('user_id', user.id).order('sale_date', { ascending: false }),
            supabase.from('inventory').select('*').eq('user_id', user.id),
            supabase.from('buyers').select('id, name').eq('user_id', user.id)
        ]);

        if (salesRes.error) toast({ title: 'Error fetching sales', description: salesRes.error.message, variant: 'destructive' });
        else setSales(salesRes.data || []);

        if (inventoryRes.error) toast({ title: 'Error fetching inventory', description: inventoryRes.error.message, variant: 'destructive' });
        else setInventory(inventoryRes.data || []);
        
        if (buyersRes.error) toast({ title: 'Error fetching buyers', description: buyersRes.error.message, variant: 'destructive' });
        else setBuyers(buyersRes.data || []);

        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSale = () => {
        fetchData();
        setIsFormOpen(false);
        setEditingSale(null);
    };

    const handleDeleteSale = async (id) => {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) toast({ title: 'Error deleting sale', variant: 'destructive' });
        else {
            toast({ title: 'Sale deleted successfully' });
            fetchData();
        }
    };

    const filteredSales = useMemo(() => {
        return sales.filter(sale =>
            (sale.inventory?.item_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (sale.buyers?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (sale.platform?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [sales, searchTerm]);

    if (loading) {
        return <div className="flex items-center justify-center h-full"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" /></div>
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>All Sales History</CardTitle>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild><Button onClick={() => setEditingSale(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add Sale</Button></DialogTrigger>
                            <SalesDialog isOpen={isFormOpen} setIsOpen={setIsFormOpen} editingSale={editingSale} onSaleAdded={handleSaveSale} inventory={inventory} buyers={buyers} />
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input type="search" placeholder="Search sales..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product/Item</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Sale Price</TableHead>
                                    <TableHead>Profit</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSales.length === 0 ? (
                                    <TableRow><TableCell colSpan="7" className="text-center">No sales found.</TableCell></TableRow>
                                ) : (
                                    filteredSales.map(sale => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{sale.sale_date ? format(new Date(sale.sale_date), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{sale.inventory?.item_name || 'N/A'}</TableCell>
                                            <TableCell>{sale.buyers?.name || 'N/A'}</TableCell>
                                            <TableCell>{sale.platform || 'N/A'}</TableCell>
                                            <TableCell>${formatNumber(sale.total_amount)}</TableCell>
                                            <TableCell>${formatNumber(sale.profit)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingSale(sale); setIsFormOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete this sale record. This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteSale(sale.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
