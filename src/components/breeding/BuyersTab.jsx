
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BuyerListSection } from './buyers/BuyerListSection';
import { BuyerDetailSection } from './buyers/BuyerDetailSection';
import { BuyerForm } from './buyers/BuyerForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function BuyersTab() {
  const [buyers, setBuyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [puppies, setPuppies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, puppiesSold: 0, puppiesGivenAway: 0, totalLitters: 0 });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: buyersResData, error: buyersResError } = await supabase.rpc('get_customer_financials');
    
    if (buyersResError) {
        toast({ title: 'Error fetching buyers', variant: 'destructive', description: buyersResError.message });
        setBuyers([]);
    } else {
        setBuyers(buyersResData || []);
    }

    const [puppiesRes, littersRes] = await Promise.all([
        supabase.from('puppies').select('*').eq('user_id', user.id),
        supabase.from('litters').select('id', { count: 'exact' }).eq('user_id', user.id)
    ]);
    
    if (puppiesRes.error) toast({ title: 'Error fetching puppies', variant: 'destructive', description: puppiesRes.error.message });
    else {
        const puppyData = puppiesRes.data || [];
        const soldPuppies = puppyData.filter(p => p.status === 'Sold');
        const givenPuppies = puppyData.filter(p => p.status === 'Kept' || (p.status === 'Sold' && p.price_sold === 0));
        const totalSales = soldPuppies.reduce((sum, p) => sum + (p.price_sold || 0), 0);
        
        setStats({
            totalSales: totalSales,
            puppiesSold: soldPuppies.length,
            puppiesGivenAway: givenPuppies.length,
            totalLitters: littersRes.count || 0
        });
    }
  }, [user, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchBuyerDetails = useCallback(async (buyerId) => {
    if (!user || !buyerId) return;
    const [puppiesRes, docsRes, paymentsRes] = await Promise.all([
      supabase.from('puppies').select('*, litters(litter_date, dam_id, sire_name, breeding_dogs(name))').eq('buyer_id', buyerId),
      supabase.from('buyer_documents').select('*').eq('buyer_id', buyerId).order('uploaded_at', { ascending: false }),
      supabase.from('payout_details').select('*, puppies(name)').eq('buyer_id', buyerId).order('created_at', { ascending: false })
    ]);
    if (puppiesRes.error) toast({ title: 'Error fetching puppies', description: puppiesRes.error.message, variant: 'destructive' }); else setPuppies(puppiesRes.data || []);
    if (docsRes.error) toast({ title: 'Error fetching documents', variant: 'destructive' }); else setDocuments(docsRes.data || []);
    if (paymentsRes.error) toast({ title: 'Error fetching payments', variant: 'destructive' }); else setPayments(paymentsRes.data || []);
  }, [user, toast]);

  useEffect(() => {
    if (selectedBuyer) fetchBuyerDetails(selectedBuyer.id);
    else { setPuppies([]); setDocuments([]); setPayments([]); }
  }, [selectedBuyer, fetchBuyerDetails]);

  const getNextCustomerNumber = async () => {
    const { data, error } = await supabase.from('buyers').select('customer_number').order('customer_number', { ascending: false }).limit(1);
    if (error || !data || data.length === 0) return 1;
    return (data[0].customer_number || 0) + 1;
  };

  const handleSaveBuyer = async (formData) => {
    let customerNumber = formData.customer_number;
    if (!editingBuyer && !customerNumber) { customerNumber = await getNextCustomerNumber(); }
    const buyerData = { user_id: user.id, ...formData, customer_number: parseInt(customerNumber), credit: parseFloat(formData.credit || 0) };
    const { error } = editingBuyer ? await supabase.from('buyers').update(buyerData).eq('id', editingBuyer.id) : await supabase.from('buyers').insert(buyerData);
    if (error) toast({ title: `Error saving buyer`, variant: 'destructive', description: error.message });
    else {
      toast({ title: "Success", description: `Buyer ${editingBuyer ? 'updated' : 'saved'}` });
      setIsDialogOpen(false); setEditingBuyer(null);
      
      const { data: updatedBuyers } = await supabase.rpc('get_customer_financials');
      if (updatedBuyers) setBuyers(updatedBuyers);
      
      if (editingBuyer && selectedBuyer?.id === editingBuyer.id) {
        const updatedBuyer = updatedBuyers.find(b => b.id === editingBuyer.id);
        if(updatedBuyer) setSelectedBuyer(updatedBuyer);
      }
    }
  };

  const handleSavePayment = async (formData) => {
    const paymentData = { ...formData, user_id: user.id, buyer_id: selectedBuyer.id, buyer_name: selectedBuyer.name, puppy_id: formData.puppy_id || null };
    const { error } = await supabase.from('payout_details').insert(paymentData);
    if (error) toast({ title: 'Error saving payment', variant: 'destructive', description: error.message });
    else {
      toast({ title: 'Success', description: 'Payment saved.' });
      setIsPaymentDialogOpen(false);
      fetchBuyerDetails(selectedBuyer.id);
      fetchData();
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const { error } = await supabase.from('payout_details').delete().eq('id', paymentId);
    if (error) toast({ title: 'Error deleting payment', variant: 'destructive', description: error.message });
    else {
      toast({ title: 'Success', description: 'Payment deleted.' });
      fetchBuyerDetails(selectedBuyer.id);
      fetchData();
    }
  };

  const handleUploadDocument = async (file) => {
    const filePath = `${user.id}/buyer_documents/${selectedBuyer.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Error uploading file', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const { error: dbError } = await supabase.from('buyer_documents').insert({ user_id: user.id, buyer_id: selectedBuyer.id, file_name: file.name, file_path: filePath });
    if (dbError) toast({ title: 'Error saving document record', variant: 'destructive', description: dbError.message });
    else {
      toast({ title: 'Success', description: 'Document uploaded.' });
      fetchBuyerDetails(selectedBuyer.id);
    }
  };

  const handleDeleteDocument = async (doc) => {
    const { error: storageError } = await supabase.storage.from('dog_images').remove([doc.file_path]);
    if (storageError) {
      toast({ title: 'Error deleting file from storage', description: storageError.message, variant: 'destructive' });
    }
    const { error: dbError } = await supabase.from('buyer_documents').delete().eq('id', doc.id);
    if (dbError) toast({ title: 'Error deleting document record', variant: 'destructive', description: dbError.message });
    else {
      toast({ title: 'Success', description: 'Document deleted.' });
      fetchBuyerDetails(selectedBuyer.id);
    }
  };

  const handleEditBuyer = (buyer) => {
    setEditingBuyer(buyer);
    setIsDialogOpen(true);
  };

  const handleDeleteBuyer = async (id) => {
    const { error } = await supabase.from('buyers').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting buyer', variant: 'destructive', description: error.message });
    else { 
      toast({ title: "Success", description: "Buyer deleted" }); 
      fetchData(); 
      if (selectedBuyer?.id === id) setSelectedBuyer(null); 
    }
  };

  const totalBalanceOwed = useMemo(() => {
    if (!selectedBuyer) return 0;
    return selectedBuyer.balance;
  }, [selectedBuyer]);

  const filteredBuyers = buyers.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 flex flex-col gap-6">
        <BuyerListSection 
          buyers={filteredBuyers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedBuyer={selectedBuyer}
          setSelectedBuyer={setSelectedBuyer}
          handleEdit={handleEditBuyer}
          handleDeleteBuyer={handleDeleteBuyer}
          setIsDialogOpen={setIsDialogOpen}
          setEditingBuyer={setEditingBuyer}
          stats={stats}
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent><DialogHeader><DialogTitle>{editingBuyer ? 'Edit' : 'Add'} Buyer</DialogTitle></DialogHeader>
              <BuyerForm editingBuyer={editingBuyer} onSave={handleSaveBuyer} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 flex flex-col gap-6">
        <BuyerDetailSection
          selectedBuyer={selectedBuyer}
          puppies={puppies}
          payments={payments}
          documents={documents}
          totalBalanceOwed={totalBalanceOwed}
          handleSavePayment={handleSavePayment}
          handleDeletePayment={handleDeletePayment}
          handleUploadDocument={handleUploadDocument}
          handleDeleteDocument={handleDeleteDocument}
          setIsPaymentDialogOpen={setIsPaymentDialogOpen}
          isPaymentDialogOpen={isPaymentDialogOpen}
        />
      </motion.div>
    </div>
  );
}
