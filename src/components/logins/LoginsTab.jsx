
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, KeyRound, Dog, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CredentialCard } from './CredentialCard';
import { CredentialDialog } from './CredentialDialog';

export function LoginsTab() {
  const [credentials, setCredentials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('logins').select('*').eq('user_id', user.id).order('website_name', { ascending: true });
    if (error) {
      toast({ title: 'Error fetching credentials', description: error.message, variant: 'destructive' });
      setCredentials([]);
    } else {
      setCredentials(data || []);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const filteredCredentials = useMemo(() => credentials.filter(item =>
    item.website_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [credentials, searchTerm]);

  const handleSave = async (formData) => {
    const credentialData = { user_id: user.id, ...formData };
    const { error } = editingCredential
      ? await supabase.from('logins').update({ ...credentialData, updated_at: new Date().toISOString() }).eq('id', editingCredential.id)
      : await supabase.from('logins').insert(credentialData);

    if (error) toast({ title: `Error saving credential`, variant: 'destructive', description: error.message });
    else {
      toast({ title: "Success", description: `Credential ${editingCredential ? 'updated' : 'saved'}` });
      setIsDialogOpen(false);
      setEditingCredential(null);
      fetchCredentials();
    }
  };

  const handleEdit = (item) => { setEditingCredential(item); setIsDialogOpen(true); };
  const handleDelete = async (id) => {
    const { error } = await supabase.from('logins').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting credential', variant: 'destructive', description: error.message });
    else { toast({ title: "Success", description: "Credential deleted" }); fetchCredentials(); }
  };

  const renderCredentialList = (category) => {
    const items = searchTerm ? filteredCredentials.filter(c => c.category === category) : credentials.filter(c => c.category === category);
    if (items.length === 0) {
        return <div className="text-center py-8 text-gray-500 col-span-full">No credentials in this category.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => <motion.div key={item.id} layout><CredentialCard item={item} onEdit={handleEdit} onDelete={handleDelete} /></motion.div>)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><KeyRound className="w-6 h-6" /><span>Logins & Passwords</span></CardTitle>
            <CardDescription>Securely store and manage your website logins, passwords, and other sensitive information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search all credentials..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => { setEditingCredential(null); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Credential</Button>
            </div>
            <Tabs defaultValue="Dog Information" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="Dog Information"><Dog className="w-4 h-4 mr-2" />Dog Info</TabsTrigger>
                <TabsTrigger value="E-Commerce"><ShoppingCart className="w-4 h-4 mr-2" />E-Commerce</TabsTrigger>
                <TabsTrigger value="Personal"><Home className="w-4 h-4 mr-2" />Personal</TabsTrigger>
              </TabsList>
              <TabsContent value="Dog Information" className="mt-4">{renderCredentialList('Dog Information')}</TabsContent>
              <TabsContent value="E-Commerce" className="mt-4">{renderCredentialList('E-Commerce')}</TabsContent>
              <TabsContent value="Personal" className="mt-4">{renderCredentialList('Personal')}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
      <CredentialDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} editingCredential={editingCredential} onSave={handleSave} />
    </div>
  );
}
