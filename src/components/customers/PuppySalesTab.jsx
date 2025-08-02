import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Map, Trash2 } from 'lucide-react';
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
import { CustomerForm } from './CustomerForm';
import { CustomerDetails } from './CustomerDetails';
import { LocationMap } from '@/components/maps/LocationMap';

export function PuppySalesTab() {
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
        const { data, error } = await supabase
            .from('buyers')
            .select('*, puppies(name, date_sold)')
            .eq('user_id', user.id)
            .order('customer_number', { ascending: true });

        if (error) {
            toast({ title: 'Error fetching customers', description: error.message, variant: 'destructive' });
        } else {
            setCustomers(data);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSaveCustomer = async (customerData) => {
        const { puppy_id, ...buyerData } = customerData;
        const dataToUpsert = { ...buyerData, user_id: user.id };
        
        let savedCustomer;

        if (editingCustomer) {
            const { data, error } = await supabase.from('buyers').update(dataToUpsert).eq('id', editingCustomer.id).select().single();
            if (error) {
                toast({ title: 'Error updating customer', description: error.message, variant: 'destructive' });
                return;
            }
            savedCustomer = data;
        } else {
            const { data, error } = await supabase.from('buyers').insert(dataToUpsert).select().single();
            if (error) {
                toast({ title: 'Error adding customer', description: error.message, variant: 'destructive' });
                return;
            }
            savedCustomer = data;
        }

        if (puppy_id && savedCustomer) {
            const { error: puppyError } = await supabase.from('puppies').update({ buyer_id: savedCustomer.id }).eq('id', puppy_id);
            if (puppyError) {
                toast({ title: 'Error assigning puppy', description: puppyError.message, variant: 'destructive' });
            }
        }

        toast({ title: `Customer ${editingCustomer ? 'updated' : 'added'} successfully` });
        fetchCustomers();
        setIsFormOpen(false);
        setEditingCustomer(null);
    };
    
    const handleDeleteCustomer = async (id) => {
        const { error: notesError } = await supabase.from('customer_notes').delete().eq('customer_id', id);
        if (notesError) {
            toast({ title: 'Error deleting customer notes', description: notesError.message, variant: 'destructive' });
            return;
        }

        const { error } = await supabase.from('buyers').delete().eq('id', id);
        if (error) {
            toast({ title: 'Error deleting customer', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Customer deleted successfully' });
            fetchCustomers();
            if (selectedCustomerId === id) {
                setSelectedCustomerId(null);
            }
        }
    };

    const handleRowClick = (customerId) => {
        setSelectedCustomerId(customerId);
    };

    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.customer_number?.toString() || '').includes(searchTerm) ||
        (c.puppies.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    
    const mapLocations = useMemo(() => 
        customers.filter(c => c.city_state).map(c => ({
            location: c.city_state,
            tooltip: `${c.name} (${c.city_state})`
        })), [customers]);

    if (selectedCustomerId) {
        return <CustomerDetails customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} onUpdate={fetchCustomers} />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Map /> Customer Locations</CardTitle></CardHeader>
                <CardContent>
                    <LocationMap locations={mapLocations} />
                </CardContent>
            </Card>
            <Card className="bg-white text-black">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Puppy Sales & Customers</CardTitle>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingCustomer(null)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                                </Button>
                            </DialogTrigger>
                            <CustomerForm editingCustomer={editingCustomer} onSave={handleSaveCustomer} onCancel={() => setIsFormOpen(false)} />
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder="Search by name, customer #, or puppy name..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer #</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Puppy</TableHead>
                                <TableHead>Date Sold</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>
                            ) : (
                                filteredCustomers.map(customer => {
                                    const lastPuppy = customer.puppies.length > 0 ? customer.puppies.sort((a, b) => new Date(b.date_sold) - new Date(a.date_sold))[0] : null;
                                    return (
                                        <TableRow key={customer.id} onClick={() => handleRowClick(customer.id)} className="cursor-pointer hover:bg-gray-50">
                                            <TableCell>{customer.customer_number || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>{lastPuppy ? lastPuppy.name : 'N/A'}</TableCell>
                                            <TableCell>{lastPuppy && lastPuppy.date_sold ? format(new Date(lastPuppy.date_sold), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the customer and all related notes. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}>Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    );
}