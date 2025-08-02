import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, User, Dog, Tag, BadgeCheck, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { EditableField } from './EditableField';
import { EditableSelectField } from './EditableSelectField';
import { StatusBadge } from '../StatusBadge';

export const PuppyProfileHeader = ({ puppy, buyers, onFieldSave, onUpdate }) => {
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleImageUpload = async () => {
        if (!imageFile) return;
        setIsUploading(true);
        const filePath = `${user.id}/puppy_images/${puppy.id}/${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, imageFile, { upsert: true });
        if (uploadError) {
            toast({ title: 'Error uploading image', variant: 'destructive', description: uploadError.message });
            setIsUploading(false);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('dog_images').getPublicUrl(filePath);
        await onFieldSave('image_url', publicUrl);
        setImageFile(null);
        onUpdate();
        setIsUploading(false);
    };

    const statusOptions = [
        {value: 'Available', label: 'Available'}, 
        {value: 'Sold', label: 'Sold'}, 
        {value: 'Kept', label: 'Kept'},
        {value: 'Hold', label: 'Hold'},
        {value: 'Deposit Received', label: 'Deposit Received'},
    ];
    
    const buyerOptions = buyers.map(b => ({value: b.id, label: b.name}));
    
    return (
        <Card className="overflow-hidden shadow-lg">
            <CardHeader className="p-0">
                <div className="relative group">
                    <img-replace src={puppy.image_url || `https://place-hold.it/400x300/666/fff&text=${puppy.name || 'Puppy'}`} alt={puppy.name} className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2">
                            <Input type="file" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs h-9 bg-card/80 backdrop-blur-sm max-w-[150px]" />
                            <Button onClick={handleImageUpload} disabled={!imageFile || isUploading} size="sm"><Upload size={16}/></Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="text-center mb-4">
                    <EditableField label="" value={puppy.name} onSave={(val) => onFieldSave('name', val)} inputClassName="text-3xl font-bold text-center" wrapperClassName="justify-center text-3xl" />
                    <p className="text-muted-foreground">{puppy.gender} - {puppy.color}</p>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-primary shrink-0" />
                        <EditableSelectField label="Status" value={puppy.status} onSave={(val) => onFieldSave('status', val)} options={statusOptions} placeholder="Select Status" />
                    </div>
                    
                    {puppy.status === 'Sold' && (
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-primary shrink-0" />
                            <EditableSelectField label="Buyer" value={puppy.buyer_id} onSave={(val) => onFieldSave('buyer_id', val)} options={buyerOptions} placeholder="Select Buyer" />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Dog className="w-5 h-5 text-primary shrink-0" />
                         <EditableField label="Birth Date" value={puppy.birth_date} onSave={(val) => onFieldSave('birth_date', val)} type="date" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-primary shrink-0" />
                         <EditableField label="Sale Price" value={puppy.price_sold} onSave={(val) => onFieldSave('price_sold', val)} type="number" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};