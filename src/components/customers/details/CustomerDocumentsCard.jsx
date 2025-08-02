
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const getPublicUrl = (filePath) => {
    if (!filePath) return '';
    const { data } = supabase.storage.from('dog_images').getPublicUrl(filePath);
    return data.publicUrl;
};

export function CustomerDocumentsCard({ documents }) {
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={20}/> Documents</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {documents.map((doc, i) => (
                        <div key={doc.file_path || i} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div>
                                <a href={getPublicUrl(doc.file_path)} target="_blank" rel="noopener noreferrer" className="flex-grow truncate hover:underline">{doc.file_name}</a>
                                <p className="text-xs text-gray-500">{doc.document_type}</p>
                            </div>
                            <div className="flex items-center">
                                <a href={getPublicUrl(doc.file_path)} download>
                                    <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
                {documents.length === 0 && <p className="text-center text-gray-500 py-4">No documents uploaded.</p>}
            </CardContent>
        </Card>
    );
}
