import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Printer, Plus, Edit, Trash2, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const numberToWords = (num) => {
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
};

const CheckForm = ({ onSave, initialData, onCancel, nextCheckNumber, templates, defaultTemplateId }) => {
  const [formData, setFormData] = useState(initialData || {
    check_number: nextCheckNumber || '',
    check_date: format(new Date(), 'yyyy-MM-dd'),
    payee_name: '',
    payee_address_line1: '',
    payee_address_line2: '',
    amount: '',
    memo: '',
    template_id: defaultTemplateId,
  });
  const [amountInWords, setAmountInWords] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if(initialData.amount) {
        const [dollars, cents] = parseFloat(initialData.amount).toFixed(2).split('.');
        const words = numberToWords(dollars);
        setAmountInWords(`${words.charAt(0).toUpperCase() + words.slice(1)} and ${cents}/100`);
      }
    } else {
      setFormData(prev => ({ ...prev, check_number: nextCheckNumber, template_id: defaultTemplateId }));
    }
  }, [initialData, nextCheckNumber, defaultTemplateId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    if (id === 'amount') {
      if (value && !isNaN(value)) {
        const [dollars, cents] = parseFloat(value).toFixed(2).split('.');
        const words = numberToWords(dollars);
        setAmountInWords(`${words.charAt(0).toUpperCase() + words.slice(1)} and ${cents}/100`);
      } else {
        setAmountInWords('');
      }
    }
  };
  
  const handleTemplateChange = (value) => {
    setFormData(prev => ({ ...prev, template_id: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, amount_in_words: amountInWords });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="check_number">Check Number *</Label><Input id="check_number" type="number" value={formData.check_number} onChange={handleChange} required /></div>
        <div className="space-y-2"><Label htmlFor="check_date">Date *</Label><Input id="check_date" type="date" value={formData.check_date} onChange={handleChange} required /></div>
        <div className="space-y-2">
            <Label htmlFor="template_id">Template</Label>
            <Select onValueChange={handleTemplateChange} value={formData.template_id || ''}>
                <SelectTrigger id="template_id"><SelectValue placeholder="Select a template" /></SelectTrigger>
                <SelectContent>
                    {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.template_name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="payee_name">Pay to the Order of *</Label><Input id="payee_name" value={formData.payee_name} onChange={handleChange} required /></div>
      <div className="space-y-2"><Label htmlFor="payee_address_line1">Address Line 1</Label><Input id="payee_address_line1" value={formData.payee_address_line1 || ''} onChange={handleChange} /></div>
      <div className="space-y-2"><Label htmlFor="payee_address_line2">Address Line 2</Label><Input id="payee_address_line2" value={formData.payee_address_line2 || ''} onChange={handleChange} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="amount">Amount *</Label><Input id="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required /></div>
        <div className="space-y-2"><Label>Amount in Words</Label><Input value={amountInWords} readOnly className="bg-gray-100" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="memo">Memo</Label><Textarea id="memo" value={formData.memo} onChange={handleChange} /></div>
      <div className="flex justify-end space-x-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">Save Check</Button>
      </div>
    </form>
  );
};

const CheckPreview = ({ checkData, settings, onPrint, onClose }) => {
  if (!checkData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white">
        <CardHeader>
          <CardTitle>Print Preview</CardTitle>
          <CardDescription>Review the check before printing. This will mark the check as 'Printed'.</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="printable-check" className="p-4 border rounded-lg font-serif text-sm bg-white text-black">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{settings?.business_name || 'Your Business Name'}</p>
                <p>{settings?.address_line1 || '123 Business Rd.'}</p>
                <p>{settings?.address_line2 || 'Business City, ST 12345'}</p>
                <p className="text-xs">{settings?.bank_name || 'Your Bank'}</p>
              </div>
              <div className="text-right">
                <p>Check No: <span className="font-mono">{checkData.check_number}</span></p>
                <p>Date: <span className="font-mono">{format(new Date(checkData.check_date.replace(/-/g, '/')), 'MM/dd/yyyy')}</span></p>
              </div>
            </div>
            <div className="flex mt-8">
              <div className="w-2/3 pr-4">
                <div className="flex items-baseline">
                  <span className="text-gray-500 mr-2">Pay to the order of:</span>
                  <p className="border-b border-black flex-grow pb-1">{checkData.payee_name}</p>
                </div>
                <div className="mt-4">
                  <p className="border-b border-black pb-1">{checkData.amount_in_words} Dollars</p>
                </div>
              </div>
              <div className="w-1/3 flex items-center">
                <span className="mr-2">$</span>
                <div className="border border-black p-2 w-full text-center font-mono">
                  {parseFloat(checkData.amount).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8 items-end">
              <div>
                <p className="text-gray-500">Memo:</p>
                <p className="border-b border-black min-w-[200px] pb-1">{checkData.memo}</p>
              </div>
              <div className="w-1/2 text-center">
                <p className="border-b border-black pb-1">Signature</p>
              </div>
            </div>
            <div className="mt-4 text-center font-mono text-xs">
              <span>C{settings?.account_number}C</span>
              <span className="mx-2">A{settings?.routing_number}A</span>
              <span>{checkData.check_number}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onPrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const SettingsDialog = ({ open, onOpenChange, settings, onSave, templates, onSaveTemplate, onDeleteTemplate }) => {
    const [formData, setFormData] = useState(settings);
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleAddTemplate = () => {
        if (newTemplateName.trim()) {
            onSaveTemplate({ template_name: newTemplateName.trim() });
            setNewTemplateName('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Check Settings & Templates</DialogTitle>
                    <DialogDescription>Configure your business, bank details, and check templates.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <h4 className="font-semibold text-lg border-b pb-2">Business & Bank Info</h4>
                        <div className="space-y-2"><Label htmlFor="business_name">Business Name</Label><Input id="business_name" value={formData?.business_name || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="address_line1">Address Line 1</Label><Input id="address_line1" value={formData?.address_line1 || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="address_line2">Address Line 2</Label><Input id="address_line2" value={formData?.address_line2 || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="bank_name">Bank Name</Label><Input id="bank_name" value={formData?.bank_name || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="account_number">Account Number</Label><Input id="account_number" value={formData?.account_number || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="routing_number">Routing Number</Label><Input id="routing_number" value={formData?.routing_number || ''} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="starting_check_number">Next Check Number</Label><Input id="starting_check_number" type="number" value={formData?.starting_check_number || ''} onChange={handleChange} /></div>
                        <Button type="submit">Save Settings</Button>
                    </form>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg border-b pb-2">Check Templates</h4>
                        <div className="space-y-2">
                            {templates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-2 border rounded-md">
                                    <span>{template.template_name} {template.is_default && <Badge variant="secondary">Default</Badge>}</span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button size="sm" variant="ghost" disabled={template.is_default}><Trash2 className="w-4 h-4 text-destructive"/></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                                                <AlertDialogDescription>This cannot be undone. You cannot delete the default template.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteTemplate(template.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="New template name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
                            <Button onClick={handleAddTemplate}><Plus className="w-4 h-4"/></Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export function PrintCheckTab() {
  const [checks, setChecks] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'form'
  const [editingCheck, setEditingCheck] = useState(null);
  const [previewCheck, setPreviewCheck] = useState(null);
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nextCheckNumber, setNextCheckNumber] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('check_settings').select('*').eq('user_id', user.id).single();
    if (error && error.code !== 'PGRST116') { // Ignore 'single row not found'
        toast({ title: 'Error fetching settings', description: error.message, variant: 'destructive' });
    } else {
        setSettings(data);
    }
  }, [user, toast]);

  const fetchChecks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('checks').select('*').eq('user_id', user.id).order('check_number', { ascending: false });
    if (error) toast({ title: 'Error fetching checks', description: error.message, variant: 'destructive' });
    else setChecks(data);
  }, [user, toast]);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('check_templates').select('*').eq('user_id', user.id).order('created_at');
    if (error) toast({ title: 'Error fetching templates', description: error.message, variant: 'destructive' });
    else setTemplates(data);
  }, [user, toast]);

  useEffect(() => {
    fetchSettings();
    fetchChecks();
    fetchTemplates();
  }, [fetchSettings, fetchChecks, fetchTemplates]);

  useEffect(() => {
    if (view === 'form' && !editingCheck) {
        if (settings?.starting_check_number) {
            const maxCheckNum = checks.reduce((max, check) => Math.max(max, check.check_number), 0);
            setNextCheckNumber(Math.max(settings.starting_check_number, maxCheckNum + 1));
        } else if (checks.length > 0) {
            setNextCheckNumber(Math.max(...checks.map(c => c.check_number)) + 1);
        } else {
            setNextCheckNumber(1001);
        }
    }
  }, [view, editingCheck, settings, checks]);

  const handleSaveCheck = async (checkData) => {
    const dataToSave = { ...checkData, user_id: user.id, status: checkData.status || 'draft' };
    const { error, data: savedData } = editingCheck
      ? await supabase.from('checks').update(dataToSave).eq('id', editingCheck.id).select().single()
      : await supabase.from('checks').insert(dataToSave).select().single();

    if (error) {
      toast({ title: `Error ${editingCheck ? 'updating' : 'saving'} check`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Check ${editingCheck ? 'updated' : 'saved'} successfully.` });
      fetchChecks();
      setEditingCheck(null);
      setView('list');
      setPreviewCheck(savedData);
    }
  };

  const handleSaveSettings = async (settingsData) => {
    const dataToSave = { ...settingsData, user_id: user.id, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('check_settings').upsert(dataToSave, { onConflict: 'user_id' });
    if (error) {
        toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Success', description: 'Settings saved successfully.' });
        fetchSettings();
    }
  };

  const handleSaveTemplate = async (templateData) => {
    const dataToSave = { ...templateData, user_id: user.id };
    const { error } = await supabase.from('check_templates').insert(dataToSave);
    if(error) toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    else {
        toast({ title: 'Success', description: 'Template saved.'});
        fetchTemplates();
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    const { error } = await supabase.from('check_templates').delete().eq('id', templateId);
     if(error) toast({ title: 'Error deleting template', description: error.message, variant: 'destructive' });
    else {
        toast({ title: 'Success', description: 'Template deleted.'});
        fetchTemplates();
    }
  };

  const handlePrint = async () => {
    if (!previewCheck) return;
    const { error } = await supabase.from('checks').update({ status: 'printed' }).eq('id', previewCheck.id);
    if(error) {
        toast({ title: 'Error updating check status', description: error.message, variant: 'destructive'});
        return;
    }

    const printContents = document.getElementById('printable-check').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `<style>@media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } }</style>${printContents}`;
    window.print();
    document.body.innerHTML = originalContents;
    setPreviewCheck(null);
    fetchChecks();
  };
  
  const handleDeleteCheck = async (id) => {
    const { error } = await supabase.from('checks').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting check', description: error.message, variant: 'destructive' });
    else {
      toast({ title: "Success", description: "Check record deleted." });
      fetchChecks();
    }
  };

  const handleEdit = (check) => {
    setEditingCheck(check);
    setView('form');
  };
  
  const handleVoidCheck = async (id) => {
      const { error } = await supabase.from('checks').update({ status: 'voided' }).eq('id', id);
      if(error) toast({ title: 'Error voiding check', description: error.message, variant: 'destructive' });
      else {
          toast({ title: 'Success', description: 'Check has been voided.' });
          fetchChecks();
      }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Print Checks</CardTitle>
              <CardDescription>Create, manage, and print checks for your business.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(true)}><Settings className="w-4 h-4 mr-2" />Settings & Templates</Button>
                {view === 'list' && (
                  <Button onClick={() => { setEditingCheck(null); setView('form'); }}>
                    <Plus className="w-4 h-4 mr-2" /> Create New Check
                  </Button>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'form' ? (
            <CheckForm 
              onSave={handleSaveCheck} 
              initialData={editingCheck}
              onCancel={() => { setEditingCheck(null); setView('list'); }}
              nextCheckNumber={nextCheckNumber}
              templates={templates}
              defaultTemplateId={templates.find(t => t.is_default)?.id}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map(check => (
                  <TableRow key={check.id}>
                    <TableCell>{check.check_number}</TableCell>
                    <TableCell>{format(new Date(check.check_date.replace(/-/g, '/')), 'MM/dd/yyyy')}</TableCell>
                    <TableCell>{check.payee_name}</TableCell>
                    <TableCell>${parseFloat(check.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={check.status === 'printed' ? 'default' : (check.status === 'voided' ? 'destructive' : 'secondary')}>{check.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewCheck(check)} disabled={check.status === 'voided'}><Printer className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(check)} disabled={check.status === 'voided'}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" disabled={check.status !== 'printed'}><FileText className="w-4 h-4 text-orange-600" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Void this check?</AlertDialogTitle><AlertDialogDescription>This will mark the check as voided. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleVoidCheck(check.id)}>Void Check</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete this record?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this check record from the database.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCheck(check.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {previewCheck && <CheckPreview checkData={previewCheck} settings={settings} onPrint={handlePrint} onClose={() => setPreviewCheck(null)} />}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} settings={settings} onSave={handleSaveSettings} templates={templates} onSaveTemplate={handleSaveTemplate} onDeleteTemplate={handleDeleteTemplate} />
    </div>
  );
}