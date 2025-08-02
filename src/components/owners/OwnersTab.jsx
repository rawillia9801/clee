import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OwnerForm } from './OwnerForm';
import { OwnerDetails } from './OwnerDetails';

export function OwnersTab() {
  const [buyers, setBuyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('buyers').select('*').eq('user_id', user.id).order('customer_number', { ascending: true });
    if (error) toast({ title: 'Error fetching owners', variant: 'destructive' }); else setBuyers(data || []);
  }, [user, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveBuyer = async (formData) => {
    const { error } = editingBuyer ? await supabase.from('buyers').update(formData).eq('id', editingBuyer.id) : await supabase.from('buyers').insert({ ...formData, user_id: user.id });
    if (error) toast({ title: `Error saving owner`, variant: 'destructive' });
    else {
      toast({ title: "Success", description: `Owner ${editingBuyer ? 'updated' : 'saved'}` });
      setIsDialogOpen(false); setEditingBuyer(null); fetchData();
    }
  };

  const handleEdit = (buyer) => { setEditingBuyer(buyer); setIsDialogOpen(true); };
  
  const handleDeleteBuyer = async (id) => {
    const { error } = await supabase.from('buyers').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting owner', variant: 'destructive' });
    else { toast({ title: "Success", description: "Owner deleted" }); fetchData(); if (selectedBuyer?.id === id) setSelectedBuyer(null); }
  };
  
  const filteredBuyers = buyers.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (selectedBuyer) {
      return <OwnerDetails owner={selectedBuyer} onBack={() => setSelectedBuyer(null)} onUpdate={fetchData} />
  }

  return (
    <div className="h-full">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <OwnerForm editingBuyer={editingBuyer} onSave={handleSaveBuyer} onCancel={() => setIsDialogOpen(false)} />
      </Dialog>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
        <Card className="bg-white text-black h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Puppy Owners</CardTitle>
              <DialogTrigger asChild><Button onClick={() => { setEditingBuyer(null); setIsDialogOpen(true);}} className="ml-2"><Plus className="w-4 h-4 mr-2" />Add Owner</Button></DialogTrigger>
            </div>
            <div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search owners..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredBuyers.map(buyer => (
                    <TableRow key={buyer.id} onClick={() => setSelectedBuyer(buyer)} className={`cursor-pointer hover:bg-gray-100`}>
                        <TableCell>#{buyer.customer_number} - {buyer.name}</TableCell>
                        <TableCell>{buyer.city_state || 'N/A'}</TableCell>
                        <TableCell className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(buyer); }}><Edit className="w-4 h-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4 text-red-500" /></Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the owner.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteBuyer(buyer.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}