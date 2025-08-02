import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const DocumentUploader = ({ onUpload }) => {
    const [file, setFile] = useState(null);
    const [documentType, setDocumentType] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = () => {
        if (!file || !documentType) return;
        setIsUploading(true);
        onUpload(file, documentType).finally(() => {
            setIsUploading(false);
            setFile(null);
            setDocumentType('');
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Application">Application</SelectItem>
                            <SelectItem value="Deposit Agreement">Deposit Agreement</SelectItem>
                            <SelectItem value="Bill of Sale">Bill of Sale</SelectItem>
                            <SelectItem value="Health Guarantee">Health Guarantee</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>File</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files[0])} className="flex-grow" />
                </div>
            </div>
            <Button onClick={handleUpload} disabled={!file || !documentType || isUploading} className="w-full">
                {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
        </div>
    );
};