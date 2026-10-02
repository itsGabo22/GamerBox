'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Play } from 'lucide-react';

export const Hero = () => {
  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] rounded-3xl overflow-hidden mt-6 md:mt-8 mx-4 md:mx-8 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)]">
      {/* Background Image & Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-dark/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-black via-obsidian-dark/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl space-y-4"
        >
          <Badge variant="live" className="mb-4">Live Tournament</Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tighter leading-tight text-balance">
            CYBER ARENA <br /> <span className="text-neon-red-bright">CHAMPIONSHIP 2026</span>
          </h1>
          <p className="text-text-dim text-lg md:text-xl font-body max-w-xl pb-4">
            Join the ultimate competitive experience. Qualifiers are open now. Prove your skills and climb the ranks.
          </p>
          
          <div className="flex items-center gap-4">
            <Button variant="neon" size="lg" className="gap-2">
              <Play fill="currentColor" size={20} />
              JOIN MATCH
            </Button>
            <Button variant="secondary" size="lg">
              Details
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
