
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const PuppyDetailsDialog = ({ puppy, isOpen, onOpenChange, onUpdate }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);

    const fetchNotes = useCallback(async () => {
        if (!puppy) return;
        const { data, error } = await supabase.from('puppy_notes').select('*').eq('puppy_id', puppy.id).order('created_at', { ascending: false });
        if (error) {
            toast({ title: 'Error fetching notes', description: error.message, variant: 'destructive' });
        } else {
            setNotes(data);
        }
    }, [puppy, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
            setNewNote('');
            setEditingNote(null);
        }
    }, [isOpen, fetchNotes]);

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;

        let error;
        if (editingNote) {
            ({ error } = await supabase.from('puppy_notes').update({ note: newNote }).eq('id', editingNote.id));
        } else {
            ({ error } = await supabase.from('puppy_notes').insert({ puppy_id: puppy.id, user_id: user.id, note: newNote }));
        }

        if (error) {
            toast({ title: `Error ${editingNote ? 'updating' : 'adding'} note`, description: error.message, variant: 'destructive' });
        } else {
            setNewNote('');
            setEditingNote(null);
            fetchNotes();
            onUpdate(puppy.litter_id);
            toast({ title: 'Success', description: `Note ${editingNote ? 'updated' : 'added'}.`});
        }
    };
    
    const handleDeleteNote = async (noteId) => {
        const { error } = await supabase.from('puppy_notes').delete().eq('id', noteId);
        if (error) {
            toast({ title: 'Error deleting note', description: error.message, variant: 'destructive'});
        } else {
            fetchNotes();
            onUpdate(puppy.litter_id);
            toast({ title: 'Success', description: 'Note deleted.' });
        }
    };

    const startEditing = (note) => {
        setEditingNote(note);
        setNewNote(note.note);
    };

    const cancelEditing = () => {
        setEditingNote(null);
        setNewNote('');
    };


    if (!puppy) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Details for {puppy.name || 'Unnamed Puppy'}</DialogTitle>
                    <DialogDescription>Gender: {puppy.gender} | Color: {puppy.color} | Status: {puppy.status}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <div className="space-y-2">
                            {notes.map(note => (
                                <div key={note.id} className="bg-muted p-2 rounded-md group">
                                    <p className="text-sm text-foreground">{note.note}</p>
                                    <div className="flex justify-between items-center mt-1">
                                      <p className="text-xs text-muted-foreground">{format(new Date(note.created_at), 'PPP p')}</p>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditing(note)}><Edit size={12}/></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteNote(note.id)}><Trash2 size={12}/></Button>
                                      </div>
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-note">{editingNote ? 'Edit Note' : 'Add New Note'}</Label>
                        <Textarea id="new-note" value={newNote} onChange={e => setNewNote(e.target.value)} />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveNote} size="sm">{editingNote ? 'Update Note' : 'Add Note'}</Button>
                            {editingNote && <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
