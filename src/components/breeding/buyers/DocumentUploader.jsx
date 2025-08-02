
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function DocumentUploader({ onUpload }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = () => {
        if (!file) return;
        setIsUploading(true);
        onUpload(file).finally(() => {
            setIsUploading(false);
            setFile(null);
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Input type="file" onChange={(e) => setFile(e.target.files[0])} className="flex-grow" />
            <Button onClick={handleUpload} disabled={!file || isUploading}>{isUploading ? 'Uploading...' : 'Upload'}</Button>
        </div>
    );
}
