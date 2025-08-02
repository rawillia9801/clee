import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dog, Plus } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { DogList } from '@/components/breeding/DogList';
import { DogDetailsView } from '@/components/breeding/DogDetailsView';
import { AddDogDialog } from '@/components/breeding/AddDogDialog';
import { formatNumber } from '@/lib/utils';

export function SWVAChihuahuaTab() {
  const [dogs, setDogs] = useState([]);
  const [isAddDogOpen, setIsAddDogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [selectedDog, setSelectedDog] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('breeding_dogs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (error) toast({ title: 'Error fetching dogs', description: error.message, variant: 'destructive' });
    else setDogs(data);
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

  const handleEditDog = (dog) => {
    setEditingDog(dog);
    setIsAddDogOpen(true);
  };

  const totalInvestment = useMemo(() => {
    return dogs.reduce((sum, d) => sum + (d.price_paid || 0), 0);
  }, [dogs]);
  
  if (selectedDog) {
    return <DogDetailsView dog={selectedDog} onBack={() => setSelectedDog(null)} onUpdate={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white text-black">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-black flex items-center gap-2"><Dog />Breeding Dogs</CardTitle>
                <CardDescription className="text-gray-500">Total Investment: <span className="font-bold text-black">${formatNumber(totalInvestment)}</span></CardDescription>
              </div>
              <Dialog open={isAddDogOpen} onOpenChange={setIsAddDogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-pink-500 text-white hover:bg-pink-600"
                    onClick={() => setEditingDog(null)}
                  >
                    <Plus className="w-4 h-4 mr-2" />Add Dog
                  </Button>
                </DialogTrigger>
                <AddDogDialog 
                    isOpen={isAddDogOpen}
                    setIsOpen={setIsAddDogOpen}
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
              onEditDog={handleEditDog} 
              onDeleteDog={handleDogDeleted} 
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}