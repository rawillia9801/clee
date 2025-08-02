import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Settings } from 'lucide-react';
import { CheckForm } from './CheckForm';
import { CheckList } from './CheckList';
import { CheckPreview } from './CheckPreview';
import { SettingsDialog } from './SettingsDialog';

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
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Print Check</title><style>@media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } }</style></head><body>${printContents}</body></html>`);
    printWindow.document.close();
    printWindow.print();
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
            <CheckList 
              checks={checks}
              onPreview={setPreviewCheck}
              onEdit={handleEdit}
              onVoid={handleVoidCheck}
              onDelete={handleDeleteCheck}
            />
          )}
        </CardContent>
      </Card>
      {previewCheck && <CheckPreview checkData={previewCheck} settings={settings} onPrint={handlePrint} onClose={() => setPreviewCheck(null)} />}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} settings={settings} onSave={handleSaveSettings} templates={templates} onSaveTemplate={handleSaveTemplate} onDeleteTemplate={handleDeleteTemplate} />
    </div>
  );
}