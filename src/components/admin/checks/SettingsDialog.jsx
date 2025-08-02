
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';

export const SettingsDialog = ({ open, onOpenChange, settings, onSave, templates, onSaveTemplate, onDeleteTemplate }) => {
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
