import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Pill, ShieldCheck, HeartPulse, X } from 'lucide-react';
import { StoreSettings } from '../types';

interface SplashScreenProps {
  onFinish?: () => void;
  settings?: StoreSettings;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  settings,
  isPreview = false,
  onClosePreview,
}) => {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!isPreview && onFinish) {
      const timer = setTimeout(() => {
        onFinish();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [onFinish, isPreview]);

  const appName = settings?.appName || 'Drogaria Americana';
  const appSubtitle = settings?.appSubtitle || 'Ofertas & Entregas Rápidas';
  const logoUrl = settings?.appLogo;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-rose-900 via-rose-800 to-red-900 text-white p-6 shadow-2xl"
    >
      {isPreview && (
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
            Modo de Demonstração (ADMIN)
          </span>
          <button
            onClick={onClosePreview}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
            title="Fechar pré-visualização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="relative flex items-center justify-center mb-6">
        {/* Glowing aura animation */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-32 h-32 rounded-full bg-rose-500/30 blur-2xl"
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-2xl relative overflow-hidden p-2"
        >
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={appName}
              onError={() => setLogoError(true)}
              className="w-full h-full object-contain rounded-2xl"
            />
          ) : (
            <Pill className="w-12 h-12 stroke-[2.2] text-white transform -rotate-45" />
          )}

          <motion.div
            animate={{ scale: [0.9, 1.25, 0.9] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute -top-1 -right-1 bg-emerald-400 w-6 h-6 rounded-full border-2 border-rose-950 flex items-center justify-center shadow-md"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-950" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center space-y-1 max-w-sm px-4"
      >
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-white drop-shadow-sm">
          {appName}
        </h1>
        <p className="text-sm sm:text-base text-rose-100/90 font-medium leading-tight">
          {appSubtitle}
        </p>
      </motion.div>

      {/* Modern fast loader line */}
      <div className="w-48 h-1.5 bg-white/20 rounded-full mt-8 overflow-hidden relative">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1/2 h-full bg-rose-300 rounded-full"
        />
      </div>

      <div className="absolute bottom-6 flex items-center gap-1.5 text-xs text-rose-200/80 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Farmácia Certificada & Entrega Rápida</span>
      </div>
    </motion.div>
  );
};

