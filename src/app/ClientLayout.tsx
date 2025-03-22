'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDarkMode] = useState(true);  // Always dark mode

  const bgClass = 'bg-gradient-to-br from-gray-900 to-gray-800 text-white';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-opacity-90 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Emotion Avatar
              </span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Emotion Avatar. All rights reserved.
              </p>
              <p className="text-xs mt-2 text-gray-500">
                Powered by AI and Music
              </p>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
} 