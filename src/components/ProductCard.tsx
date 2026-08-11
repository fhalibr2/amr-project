import React from 'react';
import { Product } from '../types';
import { MedicineBoxSvg } from './MedicineBoxSvg';
import { Plus, CheckCircle, AlertTriangle, FileText, Lock, Sparkles, HelpCircle, Clock } from 'lucide-react';
import { isOfferActive, getOfferStatusDetails } from '../utils/offerUtils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  showStockToCustomer?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  showStockToCustomer = false,
}) => {
  const referencePrice = product.originalPrice || product.pmcPrice;
  const hasDiscount = !!(referencePrice && referencePrice > product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / referencePrice!) * 100)
    : 0;
  const savings = hasDiscount ? referencePrice! - product.price : 0;

  const renderPrescriptionBadge = () => {
    if (product.prescriptionType === 'black') {
      return (
        <span className="bg-slate-950 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 border border-slate-800">
          <Lock className="w-2.5 h-2.5 shrink-0 text-slate-300" />
          Tarja Preta
        </span>
      );
    }
    if (product.prescriptionType === 'red_retention') {
      return (
        <span className="bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
          <FileText className="w-2.5 h-2.5 shrink-0" />
          Retenção de Receita
        </span>
      );
    }
    if (product.prescriptionType === 'red') {
      return (
        <span className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          Tarja Vermelha
        </span>
      );
    }
    if (product.isGeneric) {
      return (
        <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs tracking-tight flex items-center gap-1 border border-amber-300">
          <span className="bg-blue-900 text-amber-400 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] font-black shrink-0">
            G
          </span>
          <span>Medicamento Genérico</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white rounded-3xl border border-slate-200 hover:border-rose-400 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between p-4 sm:p-5 shadow-xs"
    >
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-1 z-10 mb-2">
        {hasDiscount && (isOfferActive(product) || !product.isOffer) ? (
          <span className="bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            -{discountPercent}% OFF
          </span>
        ) : (
          <div />
        )}
        <div>{renderPrescriptionBadge()}</div>
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-4/3 sm:aspect-square bg-slate-50/80 rounded-2xl overflow-hidden flex items-center justify-center p-3 my-1 group-hover:scale-102 transition-transform duration-300 border border-slate-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain filter drop-shadow-xs"
            loading="lazy"
          />
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

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between space-y-3 pt-2">
        <div>
          {product.brand && (
            <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block mb-0.5">
              {product.brand}
            </span>
          )}
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
            {product.name}
          </h3>

          {product.activeIngredient && (
            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
              Princípio: {product.activeIngredient}
            </p>
          )}

          {product.dosage && (
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {product.dosage} {product.quantity ? `• ${product.quantity}` : ''}
            </p>
          )}

          {/* Active Offer Badge / Expiration Date */}
          {product.isOffer && isOfferActive(product) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {product.offerTag && (
                <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                  {product.offerTag}
                </span>
              )}
              {getOfferStatusDetails(product).text && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-rose-600" />
                  <span>{getOfferStatusDetails(product).text}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Details Action */}
        <div className="pt-2.5 border-t border-slate-100 space-y-1">
          {product.stock > 0 ? (
            <>
              {!product.price || product.price <= 0 ? (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">Valor sob consulta</span>
                    <span className="font-extrabold text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      Consulte Balcão
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(product);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white p-2.5 sm:px-3 sm:py-2 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-90 transition shrink-0 z-10"
                    title="Consultar no balcão"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Consultar</span>
                  </button>
                </div>
              ) : (
                <>
                  {hasDiscount && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 line-through font-medium">
                        De R$ {referencePrice?.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Por apenas</span>
                      <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none font-mono">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onAddToCart(product, e);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 sm:px-3 sm:py-2 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-90 transition shrink-0 z-10 cursor-pointer"
                      title="Adicionar ao carrinho"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Adicionar</span>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="py-1">
              <span className="inline-block w-full text-center text-xs font-extrabold text-slate-500 bg-slate-100 py-1.5 px-3 rounded-xl border border-slate-200">
                Sem Estoque / Indisponível
              </span>
            </div>
          )}
        </div>

        {showStockToCustomer && product.stock > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold pt-1 border-t border-slate-100">
            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{product.stock} em estoque</span>
          </div>
        )}
      </div>
    </div>
  );
};
