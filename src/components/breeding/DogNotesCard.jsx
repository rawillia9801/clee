
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const DogNotesCard = ({ dogId }) => {
    const [dogNotes, setDogNotes] = useState([]);
    const [newDogNote, setNewDogNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchDogNotes = useCallback(async () => {
        const { data, error } = await supabase.from('dog_notes').select('*').eq('dog_id', dogId).order('created_at', { ascending: false });
        if (error) toast({ title: 'Error fetching dog notes', description: error.message, variant: 'destructive' });
        else setDogNotes(data);
    }, [dogId, toast]);

    useEffect(() => {
        fetchDogNotes();
    }, [fetchDogNotes]);

    const handleSaveNote = async () => {
        if (!newDogNote.trim()) return;

        let error;
        if (editingNote) {
            ({ error } = await supabase.from('dog_notes').update({ note: newDogNote }).eq('id', editingNote.id));
        } else {
            ({ error } = await supabase.from('dog_notes').insert({ dog_id: dogId, user_id: user.id, note: newDogNote }));
        }

        if (error) {
            toast({ title: `Error ${editingNote ? 'updating' : 'adding'} note`, description: error.message, variant: 'destructive' });
        } else {
            setNewDogNote('');
            setEditingNote(null);
            fetchDogNotes();
            toast({ title: 'Success', description: `Note ${editingNote ? 'updated' : 'added'}.` });
        }
    };

    const handleDeleteNote = async (noteId) => {
        const { error } = await supabase.from('dog_notes').delete().eq('id', noteId);
        if (error) {
            toast({ title: 'Error deleting note', description: error.message, variant: 'destructive' });
        } else {
            fetchDogNotes();
            toast({ title: 'Success', description: 'Note deleted.' });
        }
    };

    const startEditing = (note) => {
        setEditingNote(note);
        setNewDogNote(note.note);
    };

    const cancelEditing = () => {
        setEditingNote(null);
        setNewDogNote('');
    };

    return (
        <Card>
            <CardHeader><CardTitle className="text-xl">Notes</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {dogNotes.map(note => (
                        <div key={note.id} className="bg-muted p-2 rounded-md group">
                            <p className="text-sm text-foreground">{note.note}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-muted-foreground">{format(new Date(note.created_at), 'PPP p')}</p>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditing(note)}><Edit size={12} /></Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteNote(note.id)}><Trash2 size={12} /></Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {dogNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
                </div>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="new-dog-note">{editingNote ? 'Edit Note' : 'Add New Note'}</Label>
                    <Textarea id="new-dog-note" value={newDogNote} onChange={e => setNewDogNote(e.target.value)} />
                    <div className="flex gap-2">
                        <Button onClick={handleSaveNote} size="sm">{editingNote ? 'Update Note' : 'Add Note'}</Button>
                        {editingNote && <Button onClick={cancelEditing} size="sm" variant="outline">Cancel</Button>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
