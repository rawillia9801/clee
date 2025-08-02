
import React from 'react';
import { motion } from 'framer-motion';
import { PuppiesMainTab } from './PuppiesMainTab';
import { PuppyProfilesTab } from './PuppyProfilesTab';
import { BuyersTab } from './buyers/BuyersTab';

const BreedingProgramTab = ({ subTab }) => {
    
    const renderContent = () => {
        switch (subTab) {
            case 'my-dogs':
                return <PuppiesMainTab />;
            case 'my-litters':
                return <PuppyProfilesTab />;
            case 'buyers':
                return <BuyersTab />;
            default:
                return <PuppiesMainTab />;
        }
    };

    return (
        <motion.div
            key={subTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {renderContent()}
        </motion.div>
    );
};

export { BreedingProgramTab };
