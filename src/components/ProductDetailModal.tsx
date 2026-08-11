import React, { useState } from 'react';
import { Product } from '../types';
import { MedicineBoxSvg } from './MedicineBoxSvg';
import { X, Plus, Minus, ShoppingBag, AlertTriangle, FileText, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, e?: React.MouseEvent) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical'>('overview');

  if (!product) return null;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    onAddToCart(product, quantity, e);
    onClose();
  };

  const referencePrice = product.originalPrice || product.pmcPrice;
  const hasDiscount = !!(referencePrice && referencePrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / referencePrice!) * 100)
    : 0;
  const savingsAmount = hasDiscount ? (referencePrice! - product.price) * quantity : 0;
  const totalPrice = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      {/* Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">
              {product.brand || 'Detalhes do Medicamento'}
            </span>
            {product.isGeneric && (
              <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 border border-amber-300">
                <span className="bg-blue-900 text-amber-400 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] font-black shrink-0">
                  G
                </span>
                <span>Medicamento Genérico</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Hero Section */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white shrink-0 border-b border-slate-100 space-y-3">
          <div className="flex gap-4 items-start">
            {/* Image Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl border border-slate-200 p-2 shrink-0 flex items-center justify-center shadow-xs relative">
              {hasDiscount && (
                <span className="absolute -top-2 -left-2 bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md z-10">
                  -{discountPercent}% OFF
                </span>
              )}
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <MedicineBoxSvg
                  prescriptionType={product.prescriptionType}
                  isGeneric={product.isGeneric}
                  name={product.name}
                  dosage={product.dosage}
                  category={product.category}
                />
              )}
            </div>

            {/* Title & Key Pricing */}
            <div className="flex-1 space-y-1 min-w-0">
              {product.prescriptionType === 'black' && (
                <div className="inline-flex items-center gap-1 bg-slate-950 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                  <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                  <span>Tarja Preta (Retenção B1)</span>
                </div>
              )}
              {product.prescriptionType === 'red_retention' && (
                <div className="inline-flex items-center gap-1 bg-red-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>Tarja Vermelha (Retenção de Receita)</span>
                </div>
              )}
              {product.prescriptionType === 'red' && (
                <div className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Tarja Vermelha (Sob Prescrição)</span>
                </div>
              )}

              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                {product.name}
              </h2>

              {product.dosage && (
                <p className="text-xs text-slate-500 font-medium">
                  {product.dosage} {product.quantity ? `• ${product.quantity}` : ''}
                </p>
              )}

              <div className="pt-1">
                {product.stock > 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-rose-600 text-xl sm:text-2xl font-mono">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through font-medium">
                        PMC R$ {referencePrice?.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="inline-block bg-slate-100 text-slate-600 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-200">
                    Sem Estoque / Indisponível para Compra
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
            {product.brand && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium text-[10px] block">Marca</span>
                <span className="font-bold text-slate-800 truncate block">{product.brand}</span>
              </div>
            )}
            {product.activeIngredient && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium text-[10px] block">Princípio Ativo</span>
                <span className="font-bold text-rose-600 truncate block">{product.activeIngredient}</span>
              </div>
            )}
            {product.ean && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium text-[10px] block">EAN</span>
                <span className="font-mono font-bold text-slate-800 truncate block">{product.ean}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Info Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 text-xs font-bold border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Indicação & Apresentação
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`pb-2 text-xs font-bold border-b-2 transition ${
                activeTab === 'technical'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Ficha Técnica / MS
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{product.description}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              {product.ean && (
                <div>
                  <span className="text-slate-400 font-medium block">Cód. EAN</span>
                  <span className="font-mono font-bold text-slate-800">{product.ean}</span>
                </div>
              )}
              {product.ms && (
                <div>
                  <span className="text-slate-400 font-medium block">Registro MS</span>
                  <span className="font-bold text-slate-800">{product.ms}</span>
                </div>
              )}
              {product.manufacturer && (
                <div>
                  <span className="text-slate-400 font-medium block">Fabricante</span>
                  <span className="font-bold text-slate-800">{product.manufacturer}</span>
                </div>
              )}
              {product.laboratory && (
                <div>
                  <span className="text-slate-400 font-medium block">Laboratório</span>
                  <span className="font-bold text-slate-800">{product.laboratory}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 shadow-lg space-y-2">
          {product.stock > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-2xl border border-slate-200 p-1">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold text-slate-800 shadow-xs transition active:scale-95"
                  aria-label="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-slate-900 text-sm font-mono">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= product.stock}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold text-slate-800 shadow-xs transition active:scale-95"
                  aria-label="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition text-sm sm:text-base"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Adicionar • R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-100 text-slate-500 p-3 rounded-xl text-center font-bold text-xs">
              Produto temporariamente indisponível no estoque
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
