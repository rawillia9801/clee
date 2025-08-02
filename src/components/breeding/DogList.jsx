
import React from 'react';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';

export const DogList = ({ dogs, onSelectDog, onEditDog, onDeleteDog }) => {
    const { toast } = useToast();

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const { error } = await supabase.from('breeding_dogs').delete().eq('id', id);
        if (error) {
            toast({ title: 'Error deleting dog', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "Success", description: "Dog record deleted successfully" });
            onDeleteDog();
        }
    };
    
    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Purchased From</TableHead>
                        <TableHead>Price Paid</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Registries</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dogs.map((dog) => (
                        <TableRow key={dog.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onSelectDog(dog)}>
                            <TableCell>
                                {dog.image_url ? (
                                    <img src={dog.image_url} alt={dog.name} className="w-12 h-12 object-cover rounded-md" />
                                ) : (
                                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                        <span className="font-bold text-lg text-primary">{dog.name ? dog.name[0] : '?'}</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="font-medium">{dog.name}</TableCell>
                            <TableCell>{dog.purchase_location || 'N/A'}</TableCell>
                            <TableCell>{dog.price_paid ? `$${formatNumber(dog.price_paid)}` : 'N/A'}</TableCell>
                            <TableCell>{dog.date_of_birth ? `${formatDistanceToNow(new Date(dog.date_of_birth))} old` : 'N/A'}</TableCell>
                            <TableCell>
                                {[dog.registry1, dog.registry2].filter(Boolean).join(', ') || 'N/A'}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => onEditDog(dog)}><Edit className="w-4 h-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the dog and all associated data.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={(e) => handleDelete(e, dog.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {dogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No breeding dogs recorded yet</div>
            )}
        </div>
    );
};
