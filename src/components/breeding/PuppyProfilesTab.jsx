
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PuppyProfile } from './PuppyProfile';
import { BreedingStats } from './BreedingStats';
import { PuppyFilterBar } from './PuppyFilterBar';
import { PuppyList } from './PuppyList';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PuppyProfilesTab() {
    const [allData, setAllData] = useState({ puppies: [], litters: [], dams: [] });
    const [selectedPuppy, setSelectedPuppy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        damId: 'all',
        dateRange: { from: null, to: null },
        showOnlyActive: false,
        sortBy: 'birth_date_desc',
    });
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const [puppiesRes, littersRes, damsRes] = await Promise.all([
            supabase.from('puppies').select('*, buyers(name)'),
            supabase.from('litters').select('*, breeding_dogs(name)'),
            supabase.from('breeding_dogs').select('id, name').eq('gender', 'Female'),
        ]);

        if (puppiesRes.error) toast({ title: "Error fetching puppies", variant: "destructive" });
        if (littersRes.error) toast({ title: "Error fetching litters", variant: "destructive" });
        if (damsRes.error) toast({ title: "Error fetching dams", variant: "destructive" });

        setAllData({
            puppies: puppiesRes.data || [],
            litters: littersRes.data || [],
            dams: damsRes.data || [],
        });
        setLoading(false);
    }, [user, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdate = () => {
        fetchData();
    };

    const stats = useMemo(() => {
        const { puppies, litters } = allData;
        const totalMiles = puppies.reduce((sum, p) => sum + (p.transportation_details?.total_mileage || 0), 0);
        const totalSales = puppies.reduce((sum, p) => sum + (p.status === 'Sold' ? p.price_sold || 0 : 0), 0);
        return {
            totalMiles,
            totalSales,
            totalPuppies: puppies.length,
            totalLitters: litters.length,
        };
    }, [allData]);

    const filteredPuppies = useMemo(() => {
        let puppies = allData.puppies;
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            puppies = puppies.filter(p => 
                (p.name && p.name.toLowerCase().includes(lowercasedTerm)) ||
                (p.buyers && p.buyers.name.toLowerCase().includes(lowercasedTerm))
            );
        }
        return puppies;
    }, [allData.puppies, searchTerm]);

    const filteredLitters = useMemo(() => {
        const { litters } = allData;
        const { damId, dateRange } = filters;

        return litters.filter(litter => {
            const damMatch = damId === 'all' || litter.dam_id === damId;
            const date = new Date(litter.litter_date);
            const dateMatch = (!dateRange.from || date >= dateRange.from) && (!dateRange.to || date <= dateRange.to);
            return damMatch && dateMatch;
        });
    }, [allData.litters, filters]);

    const groupedData = useMemo(() => {
        const { dams } = allData;
        const { showOnlyActive, sortBy } = filters;
        const damOrder = ["Love", "Lilly", "Ember", "Tinkerbell"];

        const littersWithPuppies = filteredLitters.map(litter => {
            let litterPuppies = filteredPuppies.filter(p => {
                const statusMatch = !showOnlyActive || ['Available', 'Hold', 'Deposit Received'].includes(p.status);
                return p.litter_id === litter.id && statusMatch;
            });

            // Sorting logic
            litterPuppies.sort((a, b) => {
                switch (sortBy) {
                    case 'price_asc': return (a.price_sold || 0) - (b.price_sold || 0);
                    case 'price_desc': return (b.price_sold || 0) - (a.price_sold || 0);
                    case 'birth_date_asc': return new Date(a.birth_date) - new Date(b.birth_date);
                    case 'status': return a.status.localeCompare(b.status);
                    default: return new Date(b.birth_date) - new Date(a.birth_date); // birth_date_desc
                }
            });

            return { ...litter, puppies: litterPuppies };
        }).filter(litter => litter.puppies.length > 0);

        const grouped = littersWithPuppies.reduce((acc, litter) => {
            const damName = litter.breeding_dogs?.name || 'Unknown Dam';
            if (!acc[damName]) acc[damName] = [];
            acc[damName].push(litter);
            return acc;
        }, {});

        const orderedGroup = {};
        damOrder.forEach(damName => {
            if (grouped[damName]) {
                orderedGroup[damName] = grouped[damName].sort((a, b) => new Date(b.litter_date) - new Date(a.litter_date));
            }
        });

        Object.keys(grouped).forEach(damName => {
            if (!damOrder.includes(damName)) {
                orderedGroup[damName] = grouped[damName].sort((a, b) => new Date(b.litter_date) - new Date(a.litter_date));
            }
        });

        return orderedGroup;
    }, [filteredPuppies, allData.dams, filteredLitters, filters]);

    const handleSelectPuppy = (puppy) => {
        setSelectedPuppy(puppy);
    };

    if (selectedPuppy) {
        return <PuppyProfile puppy={selectedPuppy} onBack={() => setSelectedPuppy(null)} onUpdate={handleUpdate} />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Puppies Overview</h1>
            <BreedingStats stats={stats} />
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search by Puppy Name or Buyer Name..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="pl-10" 
                    />
                </div>
                <PuppyFilterBar dams={allData.dams} onFilterChange={setFilters} filters={filters} />
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="birth_date_desc">Newest First</SelectItem>
                        <SelectItem value="birth_date_asc">Oldest First</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <PuppyList groupedData={groupedData} onSelectPuppy={handleSelectPuppy} />
        </div>
    );
}
