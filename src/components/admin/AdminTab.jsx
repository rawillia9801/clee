
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { DomainsTab } from '@/components/DomainsTab';
import { LoginsTab } from '@/components/logins/LoginsTab';

const PasswordGate = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleUnlock = () => {
        if (password === 'Today2020') {
            onUnlock();
        } else {
            toast({ title: 'Incorrect Password', variant: 'destructive' });
            setPassword('');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-full"
        >
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield /> Admin Access Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>This section is password protected. Please enter the password to continue.</p>
                    <Input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                    <Button onClick={handleUnlock} className="w-full">Unlock</Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export function AdminTab({ subTab }) {
    const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem('adminUnlocked') === 'true');
    const [activeAdminTab, setActiveAdminTab] = useState('admin_domains');

    useEffect(() => {
        if (subTab) {
            setActiveAdminTab(subTab);
        }
    }, [subTab]);
    
    const handleUnlock = () => {
        setIsUnlocked(true);
        sessionStorage.setItem('adminUnlocked', 'true');
    };

    const handleTabChange = (newTab) => {
        const event = new CustomEvent('setactivetab', { detail: `admin_${newTab}` });
        window.dispatchEvent(event);
    };

    if (!isUnlocked) {
        return <PasswordGate onUnlock={handleUnlock} />;
    }

    const getTabValue = () => {
        if (activeAdminTab.startsWith('admin_domains')) return 'domains';
        if (activeAdminTab.startsWith('admin_logins')) return 'logins';
        return 'domains';
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <Tabs value={getTabValue()} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="domains"><Globe className="w-4 h-4 mr-2" />Domains</TabsTrigger>
                    <TabsTrigger value="logins"><KeyRound className="w-4 h-4 mr-2" />Logins</TabsTrigger>
                </TabsList>
                <TabsContent value="domains">
                    <DomainsTab />
                </TabsContent>
                <TabsContent value="logins">
                    <LoginsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
