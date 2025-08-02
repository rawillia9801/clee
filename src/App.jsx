
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '@/components/LoginForm';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { CalendarTab } from '@/components/calendar/CalendarTab';
import { CustomersTab } from '@/components/customers/CustomersTab';
import { InventoryTab } from '@/components/inventory/InventoryTab';
import { SerialNumbersTab } from '@/components/inventory/SerialNumbersTab';
import { BillsTab } from '@/components/bills/BillsTab';
import { MonthlyRemindersTab } from '@/components/bills/MonthlyRemindersTab';
import { PayoutsTab } from '@/components/payouts/PayoutsTab';
import { RefundsTab } from '@/components/refunds/RefundsTab';
import { TransportationTab } from '@/components/transportation/TransportationTab';
import { BreedingProgramTab } from '@/components/breeding/BreedingProgramTab';
import { PrintCheckTab } from '@/components/admin/checks/PrintCheckTab';
import { LoginsTab } from '@/components/logins/LoginsTab';
import { SalesReportsTab } from '@/components/reports/SalesReportsTab';
import { PnlReportsTab } from '@/components/reports/PnlReportsTab';
import { PlatformInsightsTab } from '@/components/reports/PlatformInsightsTab';
import { TopProductsTab } from '@/components/reports/TopProductsTab';
import { InsightsTab } from '@/components/insights/InsightsTab';
import { AllSalesTab } from '@/components/sales/AllSalesTab';
import { PuppyProfile } from '@/components/breeding/PuppyProfile';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function App() {
  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    const handleSetActiveTab = (event) => {
        setActiveTab(event.detail);
    };
    window.addEventListener('setactivetab', handleSetActiveTab);
    return () => {
        window.removeEventListener('setactivetab', handleSetActiveTab);
    };
  }, []);

  const renderTabContent = () => {
    const [mainTab, subTab] = activeTab.split('_');

    if (mainTab === 'puppies') {
        return <PuppyProfile puppy={{ id: subTab }} onBack={() => setActiveTab('breeding-program_my-litters')} onUpdate={() => {}} />;
    }
    if (mainTab === 'customers') {
        return <CustomersTab customerId={subTab} onBack={() => setActiveTab('all-orders')} />;
    }

    switch (mainTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <CalendarTab />;
      case 'insights':
         return <InsightsTab type={subTab} />;
      case 'all-orders':
        return <CustomersTab />;
      case 'inventory':
        return <InventoryTab defaultAction={subTab} />;
      case 'serial-numbers':
        return <SerialNumbersTab />;
      case 'bills':
        return <BillsTab type={subTab === 'add_personal' ? 'Personal' : subTab === 'add_business' ? 'Business' : 'Business'} />;
      case 'monthly-reminders':
        return <MonthlyRemindersTab />;
      case 'payouts':
        return <PayoutsTab type={subTab} />;
      case 'refunds':
        return <RefundsTab />;
      case 'transportation':
        return <TransportationTab />;
      case 'breeding-program':
        return <BreedingProgramTab subTab={subTab} />;
      case 'checks':
        return <PrintCheckTab />;
      case 'logins':
        return <LoginsTab />;
      case 'reports':
        if (subTab === 'sales') return <SalesReportsTab />;
        if (subTab === 'pnl') return <PnlReportsTab />;
        if (subTab === 'platform-insights') return <PlatformInsightsTab />;
        if (subTab === 'top-products') return <TopProductsTab />;
        return <SalesReportsTab />; // Default reports tab
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Helmet>
          <title>Cherolee.US</title>
          <meta name="description" content="Secure login to your business management portal" />
        </Helmet>
        <LoginForm />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cherolee.US - Dashboard</title>
        <meta name="description" content="Comprehensive business management portal for inventory, sales, bills, and breeding records" />
      </Helmet>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
