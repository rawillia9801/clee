import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, RefreshCw, Dog, ChevronRight, Users, LogOut, Briefcase, Home, KeyRound, BellRing, FileBarChart, Truck, Calendar, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const menuItems = [
  { 
    label: 'Main',
    isHeader: true,
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
  },
  { 
    id: 'calendar', 
    label: 'Calendar', 
    icon: Calendar,
  },
  { 
    id: 'insights', 
    label: 'Insights', 
    icon: Activity,
  },
  { 
    label: 'Orders',
    isHeader: true,
  },
  { id: 'all-orders', label: 'All Orders', icon: ShoppingCart },
  { 
    label: 'Inventory',
    isHeader: true,
  },
  { 
    id: 'inventory', 
    label: 'Inventory', 
    icon: Package,
    subItems: [
        { id: 'inventory_view', label: 'View Inventory' },
        { id: 'inventory_add', label: 'Add Inventory' },
    ]
  },
  { id: 'serial-numbers', label: 'Serial Numbers', icon: KeyRound },
  { 
    label: 'Expenses & Bills',
    isHeader: true,
  },
  { 
    id: 'bills', 
    label: 'Bills', 
    icon: DollarSign,
    subItems: [
        { id: 'bills_view', label: 'View All Bills' },
        { id: 'bills_add_personal', label: 'Add Personal Bill' },
        { id: 'bills_add_business', label: 'Add Business Bill' },
    ]
  },
  { id: 'monthly-reminders', label: 'Monthly Reminders', icon: BellRing },
  { 
    label: 'Admin',
    isHeader: true,
  },
  { id: 'payouts', 
    label: 'Payouts', 
    icon: DollarSign,
    subItems: [
        { id: 'payouts_ecommerce', label: 'eCommerce' },
        { id: 'payouts_puppies', label: 'Puppies' },
    ]
  },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw },
  { id: 'transportation', label: 'Transportation', icon: Truck },
  { 
    id: 'breeding-program', 
    label: 'Breeding Program', 
    icon: Dog,
    subItems: [
        { id: 'breeding-program_my-dogs', label: 'My Dogs' },
        { id: 'breeding-program_my-litters', label: 'My Litters' },
        { id: 'breeding-program_buyers', label: 'Buyers' },
    ]
  },
  { id: 'checks', label: 'Print Checks', icon: DollarSign },
  { id: 'logins', label: 'Login Information', icon: KeyRound },
  { 
    label: 'Reports',
    isHeader: true,
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: FileBarChart,
    subItems: [
        { id: 'reports_sales', label: 'Sales Reports' },
        { id: 'reports_pnl', label: 'Profit & Loss' },
        { id: 'reports_platform-insights', label: 'Platform Insights' },
        { id: 'reports_top-products', label: 'Top Products' },
    ]
  },
];

const SidebarItem = ({ item, activeTab, onTabChange }) => {
  const [mainTabId] = activeTab.split('_');
  const isParentActive = item.id === mainTabId;

  const [isOpen, setIsOpen] = useState(isParentActive);

  useEffect(() => {
    if (isParentActive) {
      setIsOpen(true);
    }
  }, [isParentActive]);
  
  const handleItemClick = () => {
    if (item.subItems) {
      setIsOpen(!isOpen);
      if (!isParentActive) {
        onTabChange(item.subItems[0].id);
      }
    } else {
      onTabChange(item.id);
    }
  };

  const handleSubItemClick = (e, subId) => {
    e.stopPropagation();
    onTabChange(subId);
  };

  if (item.isHeader) {
    return <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>;
  }

  const Icon = item.icon;

  return (
    <>
      <Button
        variant={isParentActive && !item.subItems ? "secondary" : "ghost"}
        className={`w-full justify-start space-x-3 h-10 text-sm font-medium rounded-lg ${
          isParentActive && !item.subItems
            ? 'bg-primary/10 text-primary' 
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
        onClick={handleItemClick}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
        {item.subItems && (
          <motion.span className="ml-auto" animate={{ rotate: isOpen ? 90 : 0 }}>
            <ChevronRight size={16} />
          </motion.span>
        )}
      </Button>
      <AnimatePresence>
        {isOpen && item.subItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-6"
          >
            <div className="border-l border-border ml-2.5 my-1">
              {item.subItems.map(subItem => {
                const isSubActive = activeTab === subItem.id;
                return (
                  <Button
                    key={subItem.id}
                    variant="ghost"
                    className={`w-full justify-start space-x-3 h-9 mt-1 text-sm font-normal rounded-lg ${
                      isSubActive 
                        ? 'text-primary font-semibold' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={(e) => handleSubItemClick(e, subItem.id)}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-primary' : 'bg-muted-foreground/50'}`}></div>
                    </div>
                    <span>{subItem.label}</span>
                  </Button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


export function Sidebar({ activeTab, onTabChange }) {
  const { user, signOut } = useAuth();

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="w-72 h-screen bg-card border-r border-border flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-500 rounded-full flex items-center justify-center">
             <span className="font-bold text-white text-lg">{user?.email?.[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">{user?.email}</p>
            <p className="text-muted-foreground text-xs">Business Owner</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.id || item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.03 }}
          >
            <SidebarItem item={item} activeTab={activeTab} onTabChange={onTabChange} />
          </motion.div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 h-11 text-sm font-medium rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </motion.div>
  );
}