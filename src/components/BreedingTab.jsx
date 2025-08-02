import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, Award, Plus, DollarSign, GitBranch, MoonStar as Mars, Orbit as Venus } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { DogList } from '@/components/breeding/DogList';
import { DogDetailsView } from '@/components/breeding/DogDetailsView';
import { AddDogDialog } from '@/components/breeding/AddDogDialog';
import { format, addDays } from 'date-fns';

const UpcomingLittersCard = ({ litters }) => (
  <Card className="glass-effect border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-yellow-400" />
        <CardTitle className="text-white">Upcoming Litters</CardTitle>
      </div>
      <CardDescription className="text-gray-300">Expected litters based on breeding dates.</CardDescription>
    </CardHeader>
    <CardContent>
      {litters.length > 0 ? (
        <ul className="space-y-3">
          {litters.map(litter => (
            <li key={litter.id} className="flex justify-between items-center p-2 rounded-md bg-white/5">
              <div>
                <p className="font-medium text-white">{litter.dam_name}</p>
                <p className="text-sm text-gray-400">Sire: {litter.sire_name}</p>
              </div>
              <p className="font-bold text-lg text-yellow-400">{format(new Date(litter.litter_date), 'MMM dd, yyyy')}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center py-4">No upcoming litters recorded.</p>
      )}
    </CardContent>
  </Card>
);

export function BreedingTab() {
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [selectedDog, setSelectedDog] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [dogsRes, littersRes] = await Promise.all([
      supabase.from('breeding_dogs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('litters').select('*, dam:dam_id(name)').eq('user_id', user.id).order('litter_date', { ascending: true })
    ]);

    if (dogsRes.error) {
      toast({ title: 'Error fetching dogs', description: dogsRes.error.message, variant: 'destructive' });
    } else {
      setDogs(dogsRes.data);
    }
    
    if (littersRes.error) {
      toast({ title: 'Error fetching litters', description: littersRes.error.message, variant: 'destructive' });
    } else {
      const formattedLitters = littersRes.data.map(l => ({...l, dam_name: l.dam.name}));
      setLitters(formattedLitters);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleDogAdded = () => {
    fetchData();
    if(selectedDog) {
        const updatedDog = dogs.find(d => d.id === selectedDog.id);
        if(updatedDog) setSelectedDog(updatedDog);
    }
  };

  const handleDogDeleted = () => {
    fetchData();
    setSelectedDog(null);
  }

  const handleEdit = (dog) => {
    setEditingDog(dog);
    setIsAddDialogOpen(true);
  };

  const { totalPricePaid, upcomingLitters } = useMemo(() => {
    const today = new Date();
    return {
      totalPricePaid: dogs.reduce((sum, dog) => sum + (dog.price_paid || 0), 0),
      upcomingLitters: litters.filter(l => new Date(l.litter_date) >= today)
    }
  }, [dogs, litters]);
  
  if (selectedDog) {
    return <DogDetailsView dog={selectedDog} onBack={() => setSelectedDog(null)} onUpdate={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Total Dogs</CardTitle><Heart className="h-4 w-4 text-pink-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{dogs.length}</div></CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Breeding Females</CardTitle><Venus className="h-4 w-4 text-purple-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{dogs.filter(d => d.gender === 'Female').length}</div></CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Breeding Males</CardTitle><Mars className="h-4 w-4 text-blue-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{dogs.filter(d => d.gender === 'Male').length}</div></CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Total Price Paid</CardTitle><DollarSign className="h-4 w-4 text-green-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">${totalPricePaid.toFixed(2)}</div></CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Breeding Dog Information</CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      onClick={() => setEditingDog(null)}
                    >
                      <Plus className="w-4 h-4 mr-2" />Add Dog
                    </Button>
                  </DialogTrigger>
                  <AddDogDialog 
                      isOpen={isAddDialogOpen}
                      setIsOpen={setIsAddDialogOpen}
                      editingDog={editingDog}
                      onDogAdded={handleDogAdded}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <DogList 
                dogs={dogs} 
                onSelectDog={setSelectedDog} 
                onEditDog={handleEdit} 
                onDeleteDog={handleDogDeleted} 
              />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <UpcomingLittersCard litters={upcomingLitters} />
        </motion.div>
      </div>
    </div>
  );
}