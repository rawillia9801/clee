import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Globe, Calendar, DollarSign, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';

export function DomainsTab() {
  const [domains, setDomains] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [formData, setFormData] = useState({
    domain_name: '', registrar: '', purchase_date: '', expiration_date: '', purchase_cost: '', renewal_cost: '', notes: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDomains = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('domains').select('*').eq('user_id', user.id).order('expiration_date', { ascending: true });
    if (error) {
      toast({ title: 'Error fetching domains', description: error.message, variant: 'destructive' });
    } else {
      setDomains(data);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.domain_name || !formData.registrar || !formData.expiration_date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const domainData = {
      user_id: user.id,
      ...formData,
      purchase_date: formData.purchase_date || null,
      purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
      renewal_cost: formData.renewal_cost ? parseFloat(formData.renewal_cost) : null,
    };

    let error;
    if (editingDomain) {
      const { error: updateError } = await supabase.from('domains').update(domainData).eq('id', editingDomain.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('domains').insert(domainData);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingDomain ? 'updating' : 'adding'} domain`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: `Domain ${editingDomain ? 'updated' : 'added'} successfully` });
      resetForm();
      fetchDomains();
    }
  };

  const resetForm = () => {
    setFormData({ domain_name: '', registrar: '', purchase_date: '', expiration_date: '', purchase_cost: '', renewal_cost: '', notes: '' });
    setEditingDomain(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (domain) => {
    setEditingDomain(domain);
    const formattedDomain = { ...domain };
    Object.keys(formattedDomain).forEach(key => {
        if (formattedDomain[key] === null) {
            formattedDomain[key] = '';
        } else if (typeof formattedDomain[key] === 'number') {
            formattedDomain[key] = formattedDomain[key].toString();
        }
    });
    setFormData(formattedDomain);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('domains').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting domain', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: "Domain deleted successfully" });
      fetchDomains();
    }
  };

  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (expirationDate) => {
    const daysUntil = getDaysUntilExpiration(expirationDate);
    if (daysUntil < 0) return { status: 'Expired', color: 'text-red-500' };
    if (daysUntil <= 30) return { status: 'Expiring Soon', color: 'text-yellow-500' };
    if (daysUntil <= 90) return { status: 'Renewal Due', color: 'text-orange-500' };
    return { status: 'Active', color: 'text-green-500' };
  };

  const totalRenewalCost = domains.reduce((sum, domain) => sum + (domain.renewal_cost || 0), 0);
  const expiringDomains = domains.filter(domain => getDaysUntilExpiration(domain.expiration_date) <= 30).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white text-black"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Domains</CardTitle><Globe className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-black">{domains.length}</div></CardContent></Card>
        <Card className="bg-white text-black"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-500">Annual Renewal Cost</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-black">${totalRenewalCost.toFixed(2)}</div></CardContent></Card>
        <Card className="bg-white text-black"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-500">Expiring Soon</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-black">{expiringDomains}</div></CardContent></Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="bg-white text-black">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle className="text-black">Domain Management</CardTitle><CardDescription className="text-gray-500">Track domain registrations, expiration dates, and renewal costs</CardDescription></div>
              <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Domain</Button></DialogTrigger>
                <DialogContent className="bg-white text-black max-w-2xl">
                  <DialogHeader><DialogTitle>{editingDomain ? 'Edit' : 'Add'} Domain</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="domain_name">Domain Name *</Label><Input id="domain_name" value={formData.domain_name} onChange={(e) => setFormData(prev => ({ ...prev, domain_name: e.target.value }))} placeholder="example.com" required/></div>
                      <div className="space-y-2"><Label htmlFor="registrar">Registrar *</Label><Input id="registrar" value={formData.registrar} onChange={(e) => setFormData(prev => ({ ...prev, registrar: e.target.value }))} placeholder="e.g., GoDaddy" required/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="purchase_date">Purchase Date</Label><Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))} /></div>
                      <div className="space-y-2"><Label htmlFor="expiration_date">Expiration Date *</Label><Input id="expiration_date" type="date" value={formData.expiration_date} onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))} required/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="purchase_cost">Purchase Cost</Label><Input id="purchase_cost" type="number" step="0.01" value={formData.purchase_cost} onChange={(e) => setFormData(prev => ({ ...prev, purchase_cost: e.target.value }))} /></div>
                      <div className="space-y-2"><Label htmlFor="renewal_cost">Annual Renewal Cost</Label><Input id="renewal_cost" type="number" step="0.01" value={formData.renewal_cost} onChange={(e) => setFormData(prev => ({ ...prev, renewal_cost: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes" /></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button><Button type="submit">{editingDomain ? 'Update' : 'Add'} Domain</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader><TableRow className="border-gray-200"><TableHead className="text-gray-600">Domain</TableHead><TableHead className="text-gray-600">Registrar</TableHead><TableHead className="text-gray-600">Expiration</TableHead><TableHead className="text-gray-600">Status</TableHead><TableHead className="text-gray-600">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {domains.map((domain) => {
                    const status = getExpirationStatus(domain.expiration_date);
                    return (
                      <TableRow key={domain.id} className="border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(domain)}>
                        <TableCell className="text-black font-medium">{domain.domain_name}</TableCell>
                        <TableCell className="text-gray-600">{domain.registrar}</TableCell>
                        <TableCell className="text-gray-600">{new Date(domain.expiration_date).toLocaleDateString()}</TableCell>
                        <TableCell className={`font-medium ${status.color}`}>{status.status}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(domain)}><Edit className="w-4 h-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(domain.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {domains.length === 0 && (<div className="text-center py-8 text-gray-500">No domains recorded yet</div>)}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}