import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';

export function LoginsTab() {
  const [credentials, setCredentials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [formData, setFormData] = useState({
    website_name: '',
    username: '',
    password: '',
    card_info: '',
    account_number: '',
    notes: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('website_name', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching credentials', description: error.message, variant: 'destructive' });
    } else {
      setCredentials(data);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const filteredCredentials = credentials.filter(item =>
    item.website_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.website_name) {
      toast({ title: "Error", description: "Website Name is required.", variant: "destructive" });
      return;
    }

    const credentialData = {
      user_id: user.id,
      ...formData,
    };

    let error;
    if (editingCredential) {
      const { error: updateError } = await supabase
        .from('credentials')
        .update({ ...credentialData, updated_at: new Date().toISOString() })
        .eq('id', editingCredential.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('credentials').insert(credentialData);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingCredential ? 'updating' : 'adding'} credential`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: `Credential ${editingCredential ? 'updated' : 'added'} successfully` });
      resetForm();
      fetchCredentials();
    }
  };

  const resetForm = () => {
    setFormData({ website_name: '', username: '', password: '', card_info: '', account_number: '', notes: '' });
    setEditingCredential(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item) => {
    setEditingCredential(item);
    setFormData({
      website_name: item.website_name || '',
      username: item.username || '',
      password: item.password || '',
      card_info: item.card_info || '',
      account_number: item.account_number || '',
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('credentials').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting credential', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: "Credential deleted successfully" });
      fetchCredentials();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <KeyRound className="w-6 h-6" />
              <span>Logins & Passwords</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Securely store and manage your website logins, passwords, and other sensitive information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by website or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credential
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingCredential ? 'Edit' : 'Add'} Credential</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      All fields are optional except for Website Name.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="website_name">Website Name *</Label>
                      <Input id="website_name" value={formData.website_name} onChange={(e) => setFormData(prev => ({ ...prev, website_name: e.target.value }))} className="bg-white/10 border-white/20 text-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="bg-white/10 border-white/20 text-white pr-10" />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card_info">Card Info</Label>
                      <Textarea id="card_info" value={formData.card_info} onChange={(e) => setFormData(prev => ({ ...prev, card_info: e.target.value }))} className="bg-white/10 border-white/20 text-white" placeholder="e.g., Visa **** 1234, Exp 12/25, CVV 123" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input id="account_number" value={formData.account_number} onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                      <Button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500">{editingCredential ? 'Update' : 'Add'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCredentials.map((item) => (
                <motion.div key={item.id} layout>
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-white flex justify-between items-center">
                        {item.website_name}
                        <div className="flex space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-gray-400">{item.username}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-300 space-y-2">
                      {item.password && <p>Password: ••••••••</p>}
                      {item.card_info && <p>Card: {item.card_info}</p>}
                      {item.account_number && <p>Account #: {item.account_number}</p>}
                      {item.notes && <p className="pt-2 border-t border-white/10">Notes: {item.notes}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {filteredCredentials.length === 0 && (
              <div className="text-center py-8 text-gray-400">No credentials found. Add one to get started!</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}