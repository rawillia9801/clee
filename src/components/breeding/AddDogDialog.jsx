
import React, { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { toInputDate } from '@/lib/utils';

export const AddDogDialog = ({ isOpen, setIsOpen, editingDog, onDogAdded, onDogDeleted }) => {
    const [formData, setFormData] = useState({
        name: '', date_of_birth: '', gender: '', color: '',
        registry1: '', registration_number1: '', registry2: '', registration_number2: '',
        price_paid: '', kept_from_litter: false, value_of_dog: '', purchase_location: '',
        rabies_vaccination_date: '', rabies_vaccination_due_date: '', rabies_tag_number: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [vaccineRecordFile, setVaccineRecordFile] = useState(null);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (editingDog) {
            setFormData({
                name: editingDog.name || '',
                date_of_birth: toInputDate(editingDog.date_of_birth),
                gender: editingDog.gender || '',
                color: editingDog.color || '',
                registry1: editingDog.registry1 || '',
                registration_number1: editingDog.registration_number1 || '',
                registry2: editingDog.registry2 || '',
                registration_number2: editingDog.registration_number2 || '',
                price_paid: editingDog.price_paid || '',
                kept_from_litter: editingDog.kept_from_litter || false,
                value_of_dog: editingDog.value_of_dog || '',
                purchase_location: editingDog.purchase_location || '',
                rabies_vaccination_date: toInputDate(editingDog.rabies_vaccination_date),
                rabies_vaccination_due_date: toInputDate(editingDog.rabies_vaccination_due_date),
                rabies_tag_number: editingDog.rabies_tag_number || ''
            });
        } else {
            setFormData({
                name: '', date_of_birth: '', gender: '', color: '',
                registry1: '', registration_number1: '', registry2: '', registration_number2: '',
                price_paid: '', kept_from_litter: false, value_of_dog: '', purchase_location: '',
                rabies_vaccination_date: '', rabies_vaccination_due_date: '', rabies_tag_number: ''
            });
        }
    }, [editingDog, isOpen]);

    const handleSave = async (e) => {
        e.preventDefault();
        let imageUrl = editingDog?.image_url || null;
        if (imageFile) {
            const filePath = `${user.id}/dog_images/${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, imageFile);
            if (uploadError) {
                toast({ title: 'Error uploading image', description: uploadError.message, variant: 'destructive' });
                return;
            }
            const { data: urlData } = supabase.storage.from('dog_images').getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
        }

        let vaccineRecordPath = editingDog?.vaccination_records_path || null;
        if (vaccineRecordFile) {
            const filePath = `${user.id}/vaccine_records/${editingDog?.id || Date.now()}/${vaccineRecordFile.name}`;
            const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, vaccineRecordFile, { upsert: true });
            if (uploadError) {
                toast({ title: 'Error uploading vaccine record', description: uploadError.message, variant: 'destructive' });
                return;
            }
            vaccineRecordPath = filePath;
        }

        const dataToSave = {
            ...formData,
            user_id: user.id,
            price_paid: formData.price_paid ? parseFloat(formData.price_paid) : null,
            value_of_dog: formData.value_of_dog ? parseFloat(formData.value_of_dog) : null,
            image_url: imageUrl,
            vaccination_records_path: vaccineRecordPath,
            date_of_birth: formData.date_of_birth || null,
            rabies_vaccination_date: formData.rabies_vaccination_date || null,
            rabies_vaccination_due_date: formData.rabies_vaccination_due_date || null,
        };

        const { error } = editingDog
            ? await supabase.from('breeding_dogs').update(dataToSave).eq('id', editingDog.id)
            : await supabase.from('breeding_dogs').insert(dataToSave);

        if (error) {
            toast({ title: `Error saving dog`, description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: `Dog ${editingDog ? 'updated' : 'added'}.` });
            onDogAdded();
            setIsOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!editingDog) return;
        const { error } = await supabase.from('breeding_dogs').delete().eq('id', editingDog.id);
        if (error) {
            toast({ title: 'Error deleting dog', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Dog deleted.' });
            onDogDeleted();
            setIsOpen(false);
        }
    };

    return (
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingDog ? 'Edit Dog' : 'Add New Dog'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label htmlFor="dob">Date of Birth</Label><Input id="dob" type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} required /></div>
                    <div className="space-y-2"><Label htmlFor="gender">Gender</Label>
                        <Select onValueChange={value => setFormData({ ...formData, gender: value })} value={formData.gender} required>
                            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                            <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="color">Color</Label><Input id="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Image</Label><Input type="file" onChange={(e) => setImageFile(e.target.files[0])} /></div>
                <div className="space-y-2"><Label>Vaccination Records</Label><Input type="file" onChange={(e) => setVaccineRecordFile(e.target.files[0])} /></div>
                <div className="space-y-2"><Label htmlFor="purchase_location">Purchased From</Label><Input id="purchase_location" value={formData.purchase_location} onChange={e => setFormData({ ...formData, purchase_location: e.target.value })} /></div>
                <div className="flex items-center space-x-2"><Checkbox id="kept" checked={formData.kept_from_litter} onCheckedChange={checked => setFormData({ ...formData, kept_from_litter: !!checked })} /><Label htmlFor="kept">Kept from a litter</Label></div>
                {formData.kept_from_litter ?
                    <div className="space-y-2"><Label htmlFor="value_of_dog">Value of Dog</Label><Input id="value_of_dog" type="number" step="0.01" value={formData.value_of_dog} onChange={e => setFormData({ ...formData, value_of_dog: e.target.value })} /></div>
                    : <div className="space-y-2"><Label htmlFor="price_paid">Price Paid</Label><Input id="price_paid" type="number" step="0.01" value={formData.price_paid} onChange={e => setFormData({ ...formData, price_paid: e.target.value })} /></div>
                }
                <h3 className="font-semibold pt-2">Registration</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="reg1">Registry 1</Label><Input id="reg1" value={formData.registry1} onChange={e => setFormData({ ...formData, registry1: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="reg_num1">Reg. Number 1</Label><Input id="reg_num1" value={formData.registration_number1} onChange={e => setFormData({ ...formData, registration_number1: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="reg2">Registry 2</Label><Input id="reg2" value={formData.registry2} onChange={e => setFormData({ ...formData, registry2: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="reg_num2">Reg. Number 2</Label><Input id="reg_num2" value={formData.registration_number2} onChange={e => setFormData({ ...formData, registration_number2: e.target.value })} /></div>
                </div>
                <h3 className="font-semibold pt-2">Health Info</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="rabies_date">Rabies Vaccinated</Label><Input id="rabies_date" type="date" value={formData.rabies_vaccination_date} onChange={e => setFormData({ ...formData, rabies_vaccination_date: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="rabies_due">Vaccination Due</Label><Input id="rabies_due" type="date" value={formData.rabies_vaccination_due_date} onChange={e => setFormData({ ...formData, rabies_vaccination_due_date: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="rabies_tag">Rabies Tag #</Label><Input id="rabies_tag" value={formData.rabies_tag_number} onChange={e => setFormData({ ...formData, rabies_tag_number: e.target.value })} /></div>
                <DialogFooter className="flex justify-between w-full pt-4">
                    <div>
                        {editingDog && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button type="button" variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will permanently delete this dog.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};
