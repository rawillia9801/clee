
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CustomerProfileCard } from './details/CustomerProfileCard';
import { CustomerFinancialsCard } from './details/CustomerFinancialsCard';
import { CustomerNotesCard } from './details/CustomerNotesCard';
import { CustomerPuppiesCard } from './details/CustomerPuppiesCard';
import { CustomerTransportationCard } from './details/CustomerTransportationCard';
import { CustomerDocumentsCard } from './details/CustomerDocumentsCard';

export function CustomerDetails({ customerId, onBack, onUpdate }) {
    const [customer, setCustomer] = useState(null);
    const [puppies, setPuppies] = useState([]);
    const [payments, setPayments] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchAllDetails = useCallback(async () => {
        if (!customerId || !user) return;
        setLoading(true);
        
        const { data: currentCustomer, error: customerError } = await supabase.from('buyers').select('*').eq('id', customerId).eq('user_id', user.id).single();
        if (customerError) {
            toast({ title: 'Error fetching customer data', variant: 'destructive' });
            setLoading(false);
            return;
        }
        setCustomer(currentCustomer);

        const customerIdsToFetch = [customerId];
        if (currentCustomer.is_repeat_buyer && currentCustomer.linked_customer_number) {
            const { data: linkedCustomer } = await supabase.from('buyers').select('id').eq('customer_number', currentCustomer.linked_customer_number).eq('user_id', user.id).single();
            if (linkedCustomer) customerIdsToFetch.push(linkedCustomer.id);
        }

        const { data: allPuppies } = await supabase.from('puppies').select('id').in('buyer_id', customerIdsToFetch).eq('user_id', user.id);
        const puppyIds = allPuppies?.map(p => p.id) || [];

        const [puppiesRes, paymentsRes, docsRes] = await Promise.all([
            supabase.from('puppies').select('*').in('id', puppyIds),
            supabase.from('puppy_payments').select('*').in('puppy_id', puppyIds),
            supabase.from('buyer_documents').select('*').in('buyer_id', customerIdsToFetch).eq('user_id', user.id),
        ]);

        const fetchedPuppies = puppiesRes.data || [];
        const puppyDocs = fetchedPuppies.flatMap(p => 
            [
                p.application_path && { file_path: p.application_path, file_name: `${p.name} - Application`, document_type: 'Puppy Document' },
                p.deposit_agreement_path && { file_path: p.deposit_agreement_path, file_name: `${p.name} - Deposit Agreement`, document_type: 'Puppy Document' },
                p.bill_of_sale_path && { file_path: p.bill_of_sale_path, file_name: `${p.name} - Bill of Sale`, document_type: 'Puppy Document' }
            ].filter(Boolean)
        );

        const allDocs = [...(docsRes.data || []), ...puppyDocs];

        setPuppies(fetchedPuppies);
        setPayments(paymentsRes.data || []);
        setDocuments(allDocs);
        setLoading(false);
    }, [customerId, user, toast]);

    useEffect(() => { fetchAllDetails(); }, [fetchAllDetails]);
    
    const handleDeleteCustomer = async () => {
        if (!customer) return;
        const { error: notesError } = await supabase.from('customer_notes').delete().eq('customer_id', customer.id);
        if (notesError) { toast({ title: 'Error deleting customer notes', variant: 'destructive' }); return; }

        const { error } = await supabase.from('buyers').delete().eq('id', customer.id);
        if (error) toast({ title: 'Error deleting customer', variant: 'destructive' });
        else {
            toast({ title: 'Customer Deleted' });
            onUpdate();
            onBack();
        }
    };

    if (loading) return <div>Loading customer details...</div>;
    if (!customer) return <div>Customer not found. <Button onClick={onBack}>Go Back</Button></div>;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button onClick={onBack} variant="outline" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers</Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <CustomerProfileCard customer={customer} onUpdate={fetchAllDetails} onDelete={handleDeleteCustomer} />
                    <CustomerFinancialsCard customer={customer} puppies={puppies} payments={payments} onUpdate={fetchAllDetails} />
                    <CustomerNotesCard customerId={customerId} onUpdate={fetchAllDetails} />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <CustomerPuppiesCard customer={customer} puppies={puppies} onUpdate={fetchAllDetails} />
                    <CustomerTransportationCard puppies={puppies} onUpdate={fetchAllDetails} />
                    <CustomerDocumentsCard documents={documents} />
                </div>
            </div>
        </motion.div>
    );
}
