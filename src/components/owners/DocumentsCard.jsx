import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { DocumentUploader } from './DocumentUploader';

export const DocumentsCard = ({ owner, initialDocuments, onUpdate }) => {
    const [documents, setDocuments] = useState(initialDocuments);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleUploadDocument = async (file, documentType) => {
        const filePath = `${user.id}/buyer_documents/${owner.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, file, { upsert: true });
        if (uploadError) {
            toast({ title: 'Error uploading file', description: uploadError.message, variant: 'destructive' });
            return;
        }
        const { error: dbError } = await supabase.from('buyer_documents').insert({ user_id: user.id, buyer_id: owner.id, file_name: file.name, file_path: filePath, document_type: documentType });
        if (dbError) toast({ title: 'Error saving document record', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Document uploaded.' });
            onUpdate();
        }
    };

    const handleDeleteDocument = async (doc) => {
        const { error: storageError } = await supabase.storage.from('dog_images').remove([doc.file_path]);
        if (storageError) {
            // Log error but continue to delete DB record
            console.error('Error deleting file from storage:', storageError.message);
        }
        const { error: dbError } = await supabase.from('buyer_documents').delete().eq('id', doc.id);
        if (dbError) toast({ title: 'Error deleting document record', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Document deleted.' });
            onUpdate();
        }
    };
    
    const getPublicUrl = (filePath) => {
        if (!filePath) return '';
        const { data } = supabase.storage.from('dog_images').getPublicUrl(filePath);
        return data.publicUrl;
    };

    React.useEffect(() => {
        setDocuments(initialDocuments);
    }, [initialDocuments]);

    return (
        <Card className="bg-white text-black">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={20} /> Documents</CardTitle></CardHeader>
            <CardContent>
                <DocumentUploader onUpload={handleUploadDocument} />
                <div className="mt-4 space-y-2">
                    {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div>
                                <a href={getPublicUrl(doc.file_path)} target="_blank" rel="noopener noreferrer" className="flex-grow truncate hover:underline">{doc.file_name}</a>
                                <p className="text-xs text-gray-500">{doc.document_type}</p>
                            </div>
                            <div className="flex items-center">
                                <a href={getPublicUrl(doc.file_path)} download><Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button></a>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Document?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the document.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteDocument(doc)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
                {documents.length === 0 && <p className="text-gray-500 text-center pt-4">No documents uploaded.</p>}
            </CardContent>
        </Card>
    );
};