
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddPuppyDialog } from '@/components/breeding/AddPuppyDialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatNumber, toDisplayDate } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const handleBuyerClick = (buyerId) => {
    const event = new CustomEvent('setactivetab', { detail: `customers_${buyerId}` });
    window.dispatchEvent(event);
};

export const LitterManagementCard = ({ dog, litters, puppies, onUpdate, onPuppySelect, onAddLitter }) => {
    const [isPuppyDialogOpen, setIsPuppyDialogOpen] = useState(false);
    const [currentLitterId, setCurrentLitterId] = useState(null);
    const [editingPuppy, setEditingPuppy] = useState(null);
    const [buyers, setBuyers] = useState([]);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchBuyers = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('buyers').select('*').eq('user_id', user.id);
        if (error) toast({ title: 'Error fetching buyers', variant: 'destructive' });
        else setBuyers(data);
    }, [user, toast]);

    useEffect(() => { fetchBuyers(); }, [fetchBuyers]);

    const handleAddPuppyClick = (litterId) => {
        setCurrentLitterId(litterId);
        setEditingPuppy(null);
        setIsPuppyDialogOpen(true);
    };
    
    const handleEditPuppyClick = (e, puppy) => {
        e.stopPropagation();
        setCurrentLitterId(puppy.litter_id);
        setEditingPuppy(puppy);
        setIsPuppyDialogOpen(true);
    }

    const handleDeletePuppy = async (e, puppyId) => {
        e.stopPropagation();
        const { error } = await supabase.from('puppies').delete().eq('id', puppyId);
        if (error) toast({ title: 'Error deleting puppy', description: error.message, variant: 'destructive'});
        else {
            toast({title: 'Success', description: 'Puppy deleted.'});
            onUpdate();
        }
    }

    const handleDeleteLitter = async (litterId) => {
        const { error } = await supabase.from('litters').delete().eq('id', litterId);
        if (error) toast({ title: 'Error deleting litter', description: error.message, variant: 'destructive'});
        else {
            toast({title: 'Success', description: 'Litter deleted.'});
            onUpdate();
        }
    }
    
    const totalLitterSales = (litterId) => {
        const litterPuppies = puppies[litterId] || [];
        return litterPuppies.reduce((sum, p) => sum + (p.price_sold || 0), 0);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Dam's Litters</CardTitle>
                    <Button size="sm" onClick={onAddLitter}><Plus className="w-4 h-4 mr-2" />Add Litter</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <Dialog open={isPuppyDialogOpen} onOpenChange={setIsPuppyDialogOpen}>
                    <AddPuppyDialog litterId={currentLitterId} buyers={buyers} editingPuppy={editingPuppy} isOpen={isPuppyDialogOpen} setIsOpen={setIsPuppyDialogOpen} onPuppyAdded={onUpdate} />
                </Dialog>

                {litters.map(litter => (
                    <Collapsible key={litter.id} className="mb-4 p-4 border rounded-lg" defaultOpen>
                        <div className="flex justify-between items-center mb-2">
                            <CollapsibleTrigger className="flex-grow text-left">
                                <div className="flex items-center gap-2">
                                    <ChevronDown className="h-5 w-5 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                    <div>
                                        <h4 className="text-lg font-semibold">Litter Date: {toDisplayDate(litter.litter_date)}</h4>
                                        <p className="text-sm text-muted-foreground">Sire: {litter.sire_name || 'N/A'} | Puppies: {litter.number_of_puppies || 'N/A'}</p>
                                        <p className="text-sm text-muted-foreground font-bold">Litter Sales: ${formatNumber(totalLitterSales(litter.id))}</p>
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleAddPuppyClick(litter.id)}>Add Puppy</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Delete Litter?</AlertDialogTitle><AlertDialogDescription>This will delete the litter and all puppies associated with it. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteLitter(litter.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <CollapsibleContent>
                            {litter.notes && <p className="text-muted-foreground mb-2 whitespace-pre-wrap"><strong>Notes:</strong> {litter.notes}</p>}
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Price</TableHead><TableHead>Buyer</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {puppies[litter.id]?.map(puppy => (
                                        <TableRow key={puppy.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onPuppySelect(puppy)}>
                                            <TableCell className="font-medium">{puppy.name || 'Unnamed'}</TableCell>
                                            <TableCell>{puppy.status}</TableCell>
                                            <TableCell>{puppy.price_sold ? `$${formatNumber(puppy.price_sold)}` : 'N/A'}</TableCell>
                                            <TableCell>
                                                {puppy.buyer_id ? (
                                                    <Button variant="link" className="p-0 h-auto text-green-600" onClick={(e) => {e.stopPropagation(); handleBuyerClick(puppy.buyer_id);}}>
                                                        {puppy.buyers?.name || 'N/A'}
                                                    </Button>
                                                ) : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEditPuppyClick(e, puppy)}><Edit className="h-4 w-4" /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Puppy?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={(e) => handleDeletePuppy(e, puppy.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!puppies[litter.id] || puppies[litter.id].length === 0) && (
                                        <TableRow><TableCell colSpan="5" className="text-center text-muted-foreground">No puppies recorded for this litter.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
                {litters.length === 0 && <p className="text-center text-muted-foreground">No litters recorded yet for this Dam.</p>}
            </CardContent>
        </Card>
    );
};
