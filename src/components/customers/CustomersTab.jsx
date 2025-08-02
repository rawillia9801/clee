
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Map, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CustomerForm } from './CustomerForm';
import { CustomerDetails } from './CustomerDetails';
import { LocationMap } from '@/components/maps/LocationMap';
import { formatNumber, cn, toDisplayDate } from '@/lib/utils';

const CustomerTable = ({ customers, onRowClick, onDelete }) => (
    <div className="rounded-lg border overflow-hidden">
        <Table>
            <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead>Customer ID</TableHead><TableHead>Name</TableHead><TableHead>Puppy Name</TableHead><TableHead>Sold Date</TableHead>
                    <TableHead>Puppy Price</TableHead><TableHead>Payments</TableHead><TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.length === 0 ? (
                    <TableRow><TableCell colSpan="8" className="text-center h-24 text-muted-foreground">No customers found.</TableCell></TableRow>
                ) : (
                    customers.map(customer => {
                        const balance = (customer.puppy_price || 0) - (customer.total_payments || 0);
                        const isPaidOff = balance <= 0;
                        const onPaymentPlan = customer.on_payment_plan;
                        return (
                            <TableRow key={customer.id} onClick={() => onRowClick(customer.id)} 
                                className={cn("cursor-pointer hover:bg-gray-100/50", 
                                    isPaidOff && "bg-green-50/50 hover:bg-green-100/50", 
                                    onPaymentPlan && !isPaidOff && "bg-yellow-50/50 hover:bg-yellow-100/50"
                                )}>
                                <TableCell>{customer.customer_id || 'N/A'}</TableCell>
                                <TableCell className="font-medium">{customer.full_name}</TableCell>
                                <TableCell>{customer.puppy_name || 'N/A'}</TableCell>
                                <TableCell>{toDisplayDate(customer.purchase_date)}</TableCell>
                                <TableCell>${formatNumber(customer.puppy_price)}</TableCell>
                                <TableCell>${formatNumber(customer.total_payments)}</TableCell>
                                <TableCell className={cn(balance > 0 ? "text-red-600" : "text-green-600", "font-bold")}>${formatNumber(balance)}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the customer and all related notes. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(customer.id); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    </div>
);

export function CustomersTab() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchCustomers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_customer_details');

        if (error) {
            toast({ title: 'Error fetching customers', description: error.message, variant: 'destructive' });
        } else {
            setCustomers(data || []);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const handleSaveCustomer = async (customerData, puppyId) => {
        const dataToUpsert = { ...customerData, user_id: user.id };
        
        let savedCustomer;
        if (editingCustomer) {
            const { data, error } = await supabase.from('buyers').update(dataToUpsert).eq('id', editingCustomer.id).select().single();
            if (error) { toast({ title: 'Error updating customer', variant: 'destructive', description: error.message }); return; }
            savedCustomer = data;
        } else {
            const { data, error } = await supabase.from('buyers').insert(dataToUpsert).select().single();
            if (error) { toast({ title: 'Error adding customer', variant: 'destructive', description: error.message }); return; }
            savedCustomer = data;
        }

        if (puppyId && savedCustomer) {
            const { error: puppyError } = await supabase.from('puppies').update({ buyer_id: savedCustomer.id, status: 'Sold' }).eq('id', puppyId);
            if (puppyError) toast({ title: 'Error assigning puppy', description: puppyError.message, variant: 'destructive' });
        }

        toast({ title: `Customer ${editingCustomer ? 'updated' : 'added'} successfully` });
        fetchCustomers();
        setIsFormOpen(false);
        setEditingCustomer(null);
    };
    
    const handleDeleteCustomer = async (id) => {
        const { error } = await supabase.from('buyers').delete().eq('id', id);
        if (error) toast({ title: 'Error deleting customer', variant: 'destructive' });
        else {
            toast({ title: 'Customer deleted successfully' });
            fetchCustomers();
            if (selectedCustomerId === id) setSelectedCustomerId(null);
        }
    };

    const handleRowClick = (customerId) => setSelectedCustomerId(customerId);

    const { activeCustomers, archivedCustomersByYear } = useMemo(() => {
        const filtered = customers.filter(c =>
            (c.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.customer_id?.toString() || '').includes(searchTerm) ||
            (c.puppy_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        const active = filtered.filter(c => ((c.puppy_price || 0) - (c.total_payments || 0)) > 0 || (c.credits || 0) > 0);
        const archived = filtered.filter(c => ((c.puppy_price || 0) - (c.total_payments || 0)) <= 0 && (c.credits || 0) <= 0 && c.purchase_date);

        const byYear = archived.reduce((acc, customer) => {
            const year = new Date(customer.purchase_date).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(customer);
            return acc;
        }, {});

        return { activeCustomers: active, archivedCustomersByYear: byYear };
    }, [customers, searchTerm]);
    
    const mapLocations = useMemo(() => 
        customers.filter(c => c.address_city && c.address_state).map(c => ({
            location: `${c.address_city}, ${c.address_state}`,
            tooltip: `${c.full_name} (${c.address_city}, ${c.address_state})`
        })), [customers]);

    if (selectedCustomerId) {
        return <CustomerDetails customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} onUpdate={fetchCustomers} />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">Customers</CardTitle>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild><Button onClick={() => setEditingCustomer(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add Customer</Button></DialogTrigger>
                            <CustomerForm editingCustomer={editingCustomer} onSave={handleSaveCustomer} onCancel={() => setIsFormOpen(false)} />
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4"><div className="relative"><Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search by name, customer #, or puppy name..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                    
                    <h3 className="text-lg font-semibold mb-2">Active Customers</h3>
                    <CustomerTable customers={activeCustomers} onRowClick={handleRowClick} onDelete={handleDeleteCustomer} />

                    <div className="mt-6 space-y-2">
                        <h3 className="text-lg font-semibold">Archived Customers</h3>
                        {Object.keys(archivedCustomersByYear).sort((a, b) => b - a).map(year => (
                            <Collapsible key={year} className="border rounded-lg">
                                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 font-semibold bg-gray-50 hover:bg-gray-100/80">
                                    <span>{year} Sales</span>
                                    <ChevronDown className="h-5 w-5 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CustomerTable customers={archivedCustomersByYear[year]} onRowClick={handleRowClick} onDelete={handleDeleteCustomer} />
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Map /> Customer Locations</CardTitle></CardHeader>
                <CardContent className="h-[500px] relative z-0"><LocationMap locations={mapLocations} /></CardContent>
            </Card>
        </motion.div>
    );
}
