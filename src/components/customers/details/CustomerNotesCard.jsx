
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export function CustomerNotesCard({ customerId, onUpdate }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchNotes = useCallback(async () => {
        const { data, error } = await supabase.from('customer_notes').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
        if (error) toast({ title: 'Error fetching notes', variant: 'destructive' });
        else setNotes(data || []);
    }, [customerId, toast]);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        const data = { note: newNote, customer_id: customerId, user_id: user.id };
        const { error } = editingNote ? await supabase.from('customer_notes').update({ note: newNote }).eq('id', editingNote.id) : await supabase.from('customer_notes').insert(data);
        
        if (error) toast({ title: 'Error saving note', variant: 'destructive' });
        else {
            toast({ title: 'Note saved!' });
            setNewNote('');
            setEditingNote(null);
            fetchNotes();
            if (onUpdate) onUpdate();
        }
    };

    const handleDeleteNote = async (id) => {
        const { error } = await supabase.from('customer_notes').delete().eq('id', id);
        if (error) toast({ title: 'Error deleting note', variant: 'destructive' });
        else {
            toast({ title: 'Note deleted' });
            fetchNotes();
            if (onUpdate) onUpdate();
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare size={20}/>Notes</CardTitle></CardHeader>
            <CardContent className="flex flex-col h-full">
                <div className="space-y-2 flex-grow overflow-y-auto max-h-64">
                    {notes.map(note => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-md group">
                            <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                            <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                                <span>{format(new Date(note.created_at), 'MM/dd/yyyy, p')}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingNote(note); setNewNote(note.note); }}><Edit size={12}/></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-red-500"><Trash2 size={12}/></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Note?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteNote(note.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="mt-4 space-y-2">
                    <Textarea placeholder="Add a new note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
                    <div className="flex gap-2">
                        <Button onClick={handleSaveNote}>{editingNote ? 'Update Note' : 'Add Note'}</Button>
                        {editingNote && <Button variant="outline" onClick={() => { setEditingNote(null); setNewNote(''); }}>Cancel</Button>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
