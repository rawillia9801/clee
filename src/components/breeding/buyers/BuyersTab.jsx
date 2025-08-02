
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BuyerListSection } from './BuyerListSection';
import { BuyerDetailSection } from './BuyerDetailSection';
import { BuyerForm } from './BuyerForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function BuyersTab() {
  const [buyers, setBuyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
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

  const getNextCustomerNumber = async () => {
    const { data, error } = await supabase.from('buyers').select('customer_number').order('customer_number', { ascending: false }).limit(1);
    if (error || !data || data.length === 0) return 1;
    return (data[0].customer_number || 0) + 1;
  };

  const handleSaveBuyer = async (formData) => {
    let customerNumber = formData.customer_number;
    if (!formData.id && !customerNumber) { customerNumber = await getNextCustomerNumber(); }
    
    const { id, ...restData } = formData;
    
    const buyerData = {
        ...restData,
        user_id: user.id,
        customer_number: parseInt(customerNumber),
        credit: parseFloat(formData.credit || 0),
    };

    const { data: savedData, error } = id
        ? await supabase.from('buyers').update(buyerData).eq('id', id).select().single()
        : await supabase.from('buyers').insert(buyerData).select().single();

    if (error) {
        toast({ title: `Error saving buyer`, variant: 'destructive', description: error.message });
    } else {
      toast({ title: "Success", description: `Buyer ${id ? 'updated' : 'saved'}` });
      setIsDialogOpen(false); 
      setEditingBuyer(null);
      
      await fetchData();

      if (selectedBuyer && savedData && selectedBuyer.id === savedData.id) {
        const { data: updatedBuyers } = await supabase.rpc('get_customer_financials');
        if (updatedBuyers) {
            const updatedSelected = updatedBuyers.find(b => b.id === savedData.id);
            if (updatedSelected) {
                const { data: fullBuyerData } = await supabase.from('buyers').select('*').eq('id', updatedSelected.id).single();
                setSelectedBuyer(fullBuyerData);
            }
        }
      }
      if(!id) {
          const { data: newBuyerData } = await supabase.from('buyers').select('*').eq('id', savedData.id).single();
          setSelectedBuyer(newBuyerData);
      }
    }
  };

  const handleEditBuyer = async (buyer) => {
    const { data, error } = await supabase.from('buyers').select('*').eq('id', buyer.id).single();
    if (error) {
        toast({ title: 'Error fetching buyer details', variant: 'destructive', description: error.message });
        return;
    }
    setEditingBuyer(data);
    setIsDialogOpen(true);
  };
  
  const handleSelectBuyer = async (buyer) => {
    const { data, error } = await supabase.from('buyers').select('*').eq('id', buyer.id).single();
    if (error) {
        toast({ title: 'Error fetching buyer details', variant: 'destructive', description: error.message });
        return;
    }
    setSelectedBuyer(data);
  }

  const handleDeleteBuyer = async (id) => {
    const { error } = await supabase.from('buyers').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting buyer', variant: 'destructive', description: error.message });
    else { 
      toast({ title: "Success", description: "Buyer deleted" }); 
      fetchData(); 
      if (selectedBuyer?.id === id) setSelectedBuyer(null); 
    }
  };

  const filteredBuyers = buyers.filter(b => b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 flex flex-col gap-6">
        <BuyerListSection 
          buyers={filteredBuyers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedBuyer={selectedBuyer}
          onSelectBuyer={handleSelectBuyer}
          onEditBuyer={handleEditBuyer}
          onDeleteBuyer={handleDeleteBuyer}
          onAddBuyer={() => { setEditingBuyer(null); setIsDialogOpen(true); }}
          stats={stats}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 flex flex-col gap-6">
        {selectedBuyer ? (
            <BuyerDetailSection
              key={selectedBuyer.id}
              buyer={selectedBuyer}
              onSave={handleSaveBuyer}
            />
        ) : (
            <div className="flex items-center justify-center h-full bg-card rounded-lg shadow-sm">
                <p className="text-muted-foreground">Select a buyer to view their details or add a new one.</p>
            </div>
        )}
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{editingBuyer ? 'Edit' : 'Add'} Buyer</DialogTitle>
            </DialogHeader>
            <BuyerForm 
                editingBuyer={editingBuyer} 
                onSave={handleSaveBuyer} 
                onCancel={() => {
                  setIsDialogOpen(false); 
                  setEditingBuyer(null);
                }}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
