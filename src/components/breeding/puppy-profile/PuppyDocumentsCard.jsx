
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileCheck, Upload, ExternalLink, BadgeCheck as CircleCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const DocumentUploadField = ({ puppy, fieldName, label, onUpdate, readOnly }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        const filePath = `${user.id}/puppy_documents/${puppy.id}/${fieldName}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, file, { upsert: true });

        if (uploadError) {
            toast({ title: `Error uploading ${label}`, variant: 'destructive', description: uploadError.message });
            setIsUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('dog_images').getPublicUrl(filePath);

        const { error: dbError } = await supabase.from('puppies').update({ [fieldName]: publicUrl }).eq('id', puppy.id);
        if (dbError) {
            toast({ title: `Error updating puppy record`, variant: 'destructive', description: dbError.message });
        } else {
            toast({ title: 'Success', description: `${label} uploaded.` });
            setFile(null);
            onUpdate();
        }
        setIsUploading(false);
    };

    const hasFile = puppy[fieldName];

    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex items-center gap-3">
                {hasFile ? <CircleCheck className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5 border-2 border-muted rounded-full" />}
                <Label className="text-foreground">{label}</Label>
            </div>
            {hasFile ? (
                <Button asChild variant="link" size="sm">
                    <a href={puppy[fieldName]} target="_blank" rel="noopener noreferrer">
                        View <ExternalLink className="w-3 h-3 ml-1.5" />
                    </a>
                </Button>
            ) : (
                !readOnly && (
                    <div className="flex items-center gap-2">
                        <Input type="file" onChange={(e) => setFile(e.target.files[0])} className="h-9 text-xs max-w-[150px]" />
                        <Button size="sm" onClick={handleUpload} disabled={!file || isUploading}>
                            <Upload size={14} />
                        </Button>
                    </div>
                )
            )}
        </div>
    );
};

export const PuppyDocumentsCard = ({ puppy, onUpdate, readOnly }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileCheck size={20} className="text-primary"/>Documents
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                <DocumentUploadField puppy={puppy} fieldName="application_path" label="Application" onUpdate={onUpdate} readOnly={readOnly} />
                <DocumentUploadField puppy={puppy} fieldName="deposit_agreement_path" label="Deposit Agreement" onUpdate={onUpdate} readOnly={readOnly} />
                <DocumentUploadField puppy={puppy} fieldName="bill_of_sale_path" label="Bill of Sale/Health Guarantee" onUpdate={onUpdate} readOnly={readOnly} />
            </CardContent>
        </Card>
    );
};
