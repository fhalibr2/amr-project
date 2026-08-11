import React from 'react';
import { PrescriptionType } from '../types';

interface MedicineBoxSvgProps {
  prescriptionType: PrescriptionType;
  isGeneric?: boolean;
  name: string;
  dosage?: string;
  category?: string;
  className?: string;
}

export const MedicineBoxSvg: React.FC<MedicineBoxSvgProps> = ({
  prescriptionType,
  isGeneric = false,
  name,
  dosage = '',
  category = '',
  className = 'w-full h-full object-contain',
}) => {
  const safeName = name || 'Medicamento';
  const safeCategory = category || '';
  const safeDosage = dosage || '';

  const isCosmeticOrHygienic =
    safeCategory.toLowerCase().includes('higiene') ||
    safeCategory.toLowerCase().includes('beleza') ||
    safeCategory.toLowerCase().includes('dermocos');

  if (isCosmeticOrHygienic) {
    return (
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="400" y2="400">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="bottleGrad" x1="120" y1="80" x2="280" y2="340">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="capGrad" x1="160" y1="40" x2="240" y2="90">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>

        <rect width="400" height="400" rx="24" fill="url(#bgGrad)" />
        <rect x="160" y="45" width="80" height="45" rx="8" fill="url(#capGrad)" />
        <rect
          x="120"
          y="90"
          width="160"
          height="240"
          rx="24"
          fill="url(#bottleGrad)"
          stroke="#cbd5e1"
          strokeWidth="3"
        />
        <rect x="135" y="140" width="130" height="150" rx="12" fill="#fff1f2" stroke="#fecdd3" strokeWidth="2" />
        <circle cx="200" cy="180" r="18" fill="#e11d48" />
        <path d="M194 180h12M200 174v12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />

        <text x="200" y="220" textAnchor="middle" fill="#9f1239" fontSize="15" fontWeight="bold">
          {safeName.slice(0, 16)}
        </text>
        <text x="200" y="242" textAnchor="middle" fill="#64748b" fontSize="12">
          Cuidado & Dermo
        </text>
      </svg>
    );
  }

  // Determine medicine box styling based on prescription type & generic flag
  const isBlackStripe = prescriptionType === 'black';
  const isRedStripeRetention = prescriptionType === 'red_retention';
  const isRedStripe = prescriptionType === 'red';

  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="boxShadow" x="10" y="10" width="480" height="480" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.10" />
        </filter>
        <linearGradient id="blisterBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      {/* Outer Card Background Canvas */}
      <rect width="500" height="500" rx="28" fill="#f8fafc" />

      {/* Blister pack on the right side - matching reference image */}
      <g opacity="0.95">
        <rect
          x="345"
          y="70"
          width="82"
          height="360"
          rx="20"
          fill="url(#blisterBg)"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />
        {/* Metallic pill blisters */}
        {[105, 165, 225, 285, 345, 405].slice(0, 5).map((y, idx) => (
          <g key={idx}>
            <circle cx="386" cy={y} r="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
            <ellipse cx="386" cy={y} rx="20" ry="20" fill="#f1f5f9" />
            <line x1="374" y1={y} x2="398" y2={y} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* Main Medicine Box - White Carton */}
      <g filter="url(#boxShadow)">
        <rect
          x="65"
          y="40"
          width="290"
          height="420"
          rx="12"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="2.5"
        />

        {/* Side watermark "IMAGEM MERAMENTE ILUSTRATIVA" - matching reference image */}
        <text
          x="52"
          y="250"
          fill="#94a3b8"
          fontSize="9"
          letterSpacing="1.5"
          fontWeight="bold"
          fontFamily="sans-serif"
          transform="rotate(-90 52 250)"
        >
          IMAGEM MERAMENTE ILUSTRATIVA
        </text>

        {/* Brand Icon (Red Diamond Logo) - matching reference image */}
        <g transform="translate(210, 105)">
          <path d="M0 -20 L16 -4 L0 0 L-16 -4 Z" fill="#ef4444" />
          <path d="M4 0 L20 16 L4 20 L0 4 Z" fill="#dc2626" />
          <path d="M0 4 L16 20 L0 24 L-16 20 Z" fill="#ef4444" />
          <path d="M-4 0 L0 4 L-4 20 L-20 16 Z" fill="#b91c1c" />
        </g>

        {/* Product Title on Box */}
        <text
          x="210"
          y="160"
          textAnchor="middle"
          fill="#1e293b"
          fontSize="22"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {safeName.length > 16 ? safeName.slice(0, 16) + '...' : safeName}
        </text>

        {/* Dosage / Quantity subtitle */}
        {safeDosage && (
          <text
            x="210"
            y="185"
            textAnchor="middle"
            fill="#64748b"
            fontSize="14"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            {safeDosage}
          </text>
        )}

        {/* 1. GENERIC STRIPE (Law 9.787/99 Yellow Band with Big Blue G) */}
        {isGeneric && (
          <g>
            <rect x="66" y="210" width="288" height="68" fill="#facc15" />
            <circle cx="118" cy="244" r="23" fill="#1e3a8a" />
            <text x="118" y="253" textAnchor="middle" fill="#facc15" fontSize="28" fontWeight="900" fontFamily="sans-serif">
              G
            </text>
            <text x="154" y="240" fill="#1e3a8a" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
              Medicamento
            </text>
            <text x="154" y="257" fill="#1e3a8a" fontSize="16" fontWeight="900" fontFamily="sans-serif">
              Genérico
            </text>
          </g>
        )}

        {/* 2. PRESCRIPTION STRIPES */}

        {/* TARJA PRETA (Black Stripe with White Text) */}
        {isBlackStripe && (
          <g>
            <rect x="66" y={isGeneric ? "278" : "240"} width="288" height={isGeneric ? "75" : "90"} fill="#111827" />
            <text
              x="210"
              y={isGeneric ? "308" : "278"}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.2"
            >
              VENDA SOB PRESCRIÇÃO MÉDICA
            </text>
            <text
              x="210"
              y={isGeneric ? "326" : "298"}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.2"
            >
              COM RETENÇÃO DE RECEITA
            </text>
          </g>
        )}

        {/* TARJA VERMELHA RETENÇÃO (Red Stripe with Retention Text) */}
        {isRedStripeRetention && (
          <g>
            <rect x="66" y={isGeneric ? "278" : "240"} width="288" height={isGeneric ? "75" : "90"} fill="#dc2626" />
            <text
              x="210"
              y={isGeneric ? "308" : "278"}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.2"
            >
              VENDA SOB PRESCRIÇÃO MÉDICA
            </text>
            <text
              x="210"
              y={isGeneric ? "326" : "298"}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.2"
            >
              COM RETENÇÃO DE RECEITA
            </text>
          </g>
        )}

        {/* TARJA VERMELHA NORMAL (Red Stripe without Retention) */}
        {isRedStripe && (
          <g>
            <rect x="66" y={isGeneric ? "278" : "250"} width="288" height={isGeneric ? "65" : "75"} fill="#dc2626" />
            <text
              x="210"
              y={isGeneric ? "316" : "293"}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11.5"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.3"
            >
              VENDA SOB PRESCRIÇÃO MÉDICA
            </text>
          </g>
        )}

        {/* ISENTO DE PRESCRIÇÃO (MIP / OTC - Green Stripe if non-generic non-prescription) */}
        {!isBlackStripe && !isRedStripe && !isRedStripeRetention && !isGeneric && (
          <g>
            <rect x="66" y="270" width="288" height="55" fill="#059669" />
            <text
              x="210"
              y="303"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.3"
            >
              ISENTO DE PRESCRIÇÃO MÉDICA
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

