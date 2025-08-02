
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Route, DollarSign, Dog, GitBranch } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description }) => (
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 text-primary`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export const BreedingStats = ({ stats }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={cardVariants}>
        <StatCard title="Total Miles Driven" value={`${formatNumber(stats.totalMiles, 0)} mi`} icon={Route} description="Round trip for deliveries" />
      </motion.div>
      <motion.div variants={cardVariants}>
        <StatCard title="Total Puppy Sales" value={`$${formatNumber(stats.totalSales)}`} icon={DollarSign} description="Year-to-date" />
      </motion.div>
      <motion.div variants={cardVariants}>
        <StatCard title="Total Puppies" value={stats.totalPuppies} icon={Dog} description="Across all litters" />
      </motion.div>
      <motion.div variants={cardVariants}>
        <StatCard title="Total Litters" value={stats.totalLitters} icon={GitBranch} description="All recorded litters" />
      </motion.div>
    </motion.div>
  );
};
