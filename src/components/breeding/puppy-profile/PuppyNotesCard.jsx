import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, MessageSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const PuppyNotesCard = ({ puppy }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const { toast } = useToast();
    const { user } = useAuth();

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
        fetchNotes();
    }, [fetchNotes]);

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;

        const noteData = { 
            note: newNote, 
            puppy_id: puppy.id, 
            user_id: user.id 
        };

        const { error } = editingNote
            ? await supabase.from('puppy_notes').update({ note: newNote }).eq('id', editingNote.id)
            : await supabase.from('puppy_notes').insert(noteData);

        if (error) {
            toast({ title: `Error ${editingNote ? 'updating' : 'adding'} note`, description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: `Note ${editingNote ? 'updated' : 'added'}.`});
            cancelEditing();
            fetchNotes();
        }
    };
    
    const handleDeleteNote = async (noteId) => {
        const { error } = await supabase.from('puppy_notes').delete().eq('id', noteId);
        if (error) {
            toast({ title: 'Error deleting note', description: error.message, variant: 'destructive'});
        } else {
            toast({ title: 'Success', description: 'Note deleted.' });
            fetchNotes();
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <MessageSquare size={20} className="text-primary"/>Notes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Textarea 
                            placeholder="Add a new note..."
                            value={newNote} 
                            onChange={e => setNewNote(e.target.value)} 
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveNote}><Plus className="w-4 h-4 mr-2" />{editingNote ? 'Update Note' : 'Add Note'}</Button>
                            {editingNote && <Button variant="outline" onClick={cancelEditing}>Cancel</Button>}
                        </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {notes.map(note => (
                            <div key={note.id} className="bg-muted/50 p-3 rounded-lg group transition-colors">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{note.note}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-muted-foreground">{format(new Date(note.created_at), "PPP p")}</p>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(note)}><Edit size={14}/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteNote(note.id)}><Trash2 size={14}/></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};