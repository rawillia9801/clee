
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { toInputDate } from '@/lib/utils';

export function InventoryForm({ editingItem, handleSubmit, formData, setFormData, onDelete }) {
    
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 p-1 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                    <Label htmlFor="item_name">Product Name *</Label>
                    <Input id="item_name" value={formData.item_name || ''} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="upc">UPC Code *</Label>
                        <Input id="upc" value={formData.upc || ''} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input id="supplier" value={formData.supplier || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input id="quantity" type="number" value={formData.quantity || ''} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cost">Cost *</Label>
                        <Input id="cost" type="number" step="0.01" value={formData.cost || ''} onChange={handleChange} placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Sale Price</Label>
                        <Input id="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} placeholder="0.00" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchase_date">Date Purchased</Label>
                        <Input id="purchase_date" type="date" value={toInputDate(formData.purchase_date)} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" value={formData.location || ''} onChange={handleChange} placeholder="e.g. Shelf A-3, Bin 4" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={formData.platform || ''} onValueChange={(value) => handleSelectChange('platform', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Walmart">Walmart</SelectItem>
                            <SelectItem value="Walmart WFS">Walmart WFS</SelectItem>
                            <SelectItem value="eBay">eBay</SelectItem>
                            <SelectItem value="Puppies">Puppies</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter className="pt-6">
                {editingItem && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" className="mr-auto"><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the item. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(editingItem.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Button type="submit">{editingItem ? 'Update Item' : 'Add Item'}</Button>
            </DialogFooter>
        </form>
    );
}
