
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatNumber, toDisplayDate } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PaymentPlanDetails = ({ sale, onUpdate }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [contractFile, setContractFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFieldChange = (field, value) => {
        onUpdate({ ...sale, [field]: value });
    };

    const handleContractUpload = async () => {
        if (!contractFile) return;
        setIsUploading(true);
        const filePath = `${user.id}/payment_plan_contracts/${sale.id}/${contractFile.name}`;
        const { error: uploadError } = await supabase.storage.from('dog_images').upload(filePath, contractFile, { upsert: true });

        if (uploadError) {
            toast({ title: 'Error uploading contract', variant: 'destructive' });
        } else {
            const { data: urlData } = supabase.storage.from('dog_images').getPublicUrl(filePath);
            handleFieldChange('payment_plan_contract_path', urlData.publicUrl);
            toast({ title: 'Contract uploaded' });
        }
        setIsUploading(false);
    };

    return (
        <div className="bg-muted/50 p-4 grid grid-cols-4 gap-4">
            <div><Label>Buyer:</Label><Input value={sale.customer_name} disabled /></div>
            <div><Label>Plan Total:</Label><Input type="number" value={sale.payment_plan_total || ''} onChange={(e) => handleFieldChange('payment_plan_total', e.target.value)} /></div>
            <div><Label>Duration:</Label><Input value={sale.payment_plan_duration || ''} onChange={(e) => handleFieldChange('payment_plan_duration', e.target.value)} /></div>
            <div><Label>Monthly Payment:</Label><Input type="number" value={sale.payment_plan_monthly_payment || ''} onChange={(e) => handleFieldChange('payment_plan_monthly_payment', e.target.value)} /></div>
            <div><Label>Paid to Date:</Label><Input type="number" value={sale.payment_plan_paid_to_date || ''} onChange={(e) => handleFieldChange('payment_plan_paid_to_date', e.target.value)} /></div>
            <div><Label>Remaining:</Label><Input type="number" value={sale.payment_plan_remaining || ''} disabled /></div>
            <div className="col-span-2 flex items-end gap-2">
                <div className="flex-grow"><Label>Contract:</Label><Input type="file" onChange={(e) => setContractFile(e.target.files[0])} /></div>
                <Button onClick={handleContractUpload} disabled={isUploading || !contractFile}><Upload size={16} /></Button>
                {sale.payment_plan_contract_path && <Button asChild variant="link"><a href={sale.payment_plan_contract_path} target="_blank" rel="noopener noreferrer">View</a></Button>}
            </div>
        </div>
    );
};

export function PuppySalesTab() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchSales = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .eq('sale_type', 'SWVA Chihuahua')
            .order('date', { ascending: false });

        if (error) toast({ title: 'Error fetching puppy sales', variant: 'destructive', description: error.message });
        else setSales(data || []);
        setLoading(false);
    }, [user, toast]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    const handleUpdateSale = async (updatedSale) => {
        const { error } = await supabase.from('sales').update(updatedSale).eq('id', updatedSale.id);
        if (error) toast({ title: 'Error updating sale', variant: 'destructive', description: error.message });
        else {
            toast({ title: 'Sale updated' });
            fetchSales();
        }
    };
    
    const handleSourceChange = (saleId, source) => {
        const saleToUpdate = sales.find(s => s.id === saleId);
        if (saleToUpdate) {
            handleUpdateSale({ ...saleToUpdate, source });
        }
    };

    const salesByYear = useMemo(() => {
        return sales.reduce((acc, sale) => {
            const year = sale.date ? new Date(sale.date).getFullYear() : 'Unknown Year';
            if (!acc[year]) acc[year] = [];
            acc[year].push(sale);
            return acc;
        }, {});
    }, [sales]);

    if (loading) return <div>Loading sales...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Puppy Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.keys(salesByYear).sort((a, b) => b - a).map(year => (
                        <Collapsible key={year} defaultOpen={year === new Date().getFullYear().toString()} className="mb-4">
                            <CollapsibleTrigger className="w-full">
                                <div className="flex justify-between items-center p-4 bg-muted rounded-t-lg">
                                    <h3 className="text-lg font-semibold">Past Year Payments - {year}</h3>
                                    <ChevronDown className="h-5 w-5 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="border border-t-0 rounded-b-lg">
                                <Table>
                                    <TableHeader><TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Buyer</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Sales Price</TableHead>
                                        <TableHead>Discounts</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Payment Plan</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {salesByYear[year].map(sale => (
                                            <React.Fragment key={sale.id}>
                                                <TableRow>
                                                    <TableCell>{toDisplayDate(sale.date)}</TableCell>
                                                    <TableCell>{sale.customer_name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Select value={sale.source || ''} onValueChange={(value) => handleSourceChange(sale.id, value)}>
                                                            <SelectTrigger className="w-[150px] h-8"><SelectValue placeholder="Select Source" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Good Dog">Good Dog</SelectItem>
                                                                <SelectItem value="Facebook">Facebook</SelectItem>
                                                                <SelectItem value="Website">Website</SelectItem>
                                                                <SelectItem value="Referral">Referral</SelectItem>
                                                                <SelectItem value="Gift">Gift</SelectItem>
                                                                <SelectItem value="Other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>${formatNumber(sale.sale_price)}</TableCell>
                                                    <TableCell>${formatNumber(sale.discounts)}</TableCell>
                                                    <TableCell>${formatNumber(sale.balance)}</TableCell>
                                                    <TableCell>
                                                        <Checkbox checked={sale.on_payment_plan} onCheckedChange={checked => handleUpdateSale({ ...sale, on_payment_plan: checked })} />
                                                    </TableCell>
                                                </TableRow>
                                                {sale.on_payment_plan && (
                                                    <TableRow>
                                                        <TableCell colSpan={7}>
                                                            <PaymentPlanDetails sale={sale} onUpdate={handleUpdateSale} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    );
}
