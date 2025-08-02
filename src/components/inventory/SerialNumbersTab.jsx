
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, KeyRound } from 'lucide-react';

export function SerialNumbersTab() {
    const [serialNumbers, setSerialNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchSerialNumbers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('serial_numbers')
            .select('*, inventory(item_name, upc)')
            .eq('user_id', user.id);

        if (error) {
            toast({ title: 'Error fetching serial numbers', description: error.message, variant: 'destructive' });
        } else {
            setSerialNumbers(data || []);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchSerialNumbers();
    }, [fetchSerialNumbers]);

    const filteredData = useMemo(() => {
        if (!serialNumbers) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        
        if (!lowercasedTerm) {
            return serialNumbers;
        }

        return serialNumbers.filter(item => 
            item.inventory?.item_name?.toLowerCase().includes(lowercasedTerm) ||
            (item.inventory?.upc && item.inventory.upc.toLowerCase().includes(lowercasedTerm)) ||
            item.serial_number.toLowerCase().includes(lowercasedTerm)
        );
    }, [serialNumbers, searchTerm]);

    if (loading) {
        return <div className="text-center p-8">Loading serial numbers...</div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound /> Serial Number Tracking</CardTitle>
                    <CardDescription>View and search all inventory serial numbers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by product name, UPC, or serial number..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Serial Number</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>UPC</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono font-semibold">{item.serial_number}</TableCell>
                                            <TableCell>{item.inventory?.item_name || 'N/A'}</TableCell>
                                            <TableCell>{item.inventory?.upc || 'N/A'}</TableCell>
                                            <TableCell>{item.status}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            No serial numbers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
