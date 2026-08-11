import React from 'react';
import { CartItem, StoreSettings } from '../types';
import { MedicineBoxSvg } from './MedicineBoxSvg';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, Truck } from 'lucide-react';

interface CartDrawerProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onClose: () => void;
  settings?: StoreSettings;
  zoomMode?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onClose,
  zoomMode = false,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const remainingForFreeShipping = 30 - subtotal;
  const isFreeShipping = subtotal >= 30;

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full max-w-full overflow-hidden text-slate-900">
      {/* Top Header with Return Button */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-rose-600 bg-gray-100 hover:bg-rose-50 px-3 py-1.5 rounded-full transition active:scale-95"
          title="Voltar às compras"
        >
          <ArrowLeft className="w-4 h-4 text-rose-600" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-rose-600" />
          <h2 className={`font-extrabold text-gray-900 ${zoomMode ? 'text-lg' : 'text-base'}`}>
            Meu Carrinho
          </h2>
          <span className="bg-rose-100 text-rose-700 text-xs font-black px-2 py-0.5 rounded-full">
            {items.reduce((acc, i) => acc + i.quantity, 0)}
          </span>
        </div>

        {items.length > 0 ? (
          <button
            onClick={onClearCart}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:underline px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Free Shipping Progress Callout Banner */}
      {items.length > 0 && (
        <div className={`px-4 py-2.5 border-b text-xs font-semibold shrink-0 flex items-center gap-2 ${
          isFreeShipping ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-950 border-amber-200'
        }`}>
          {isFreeShipping ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Parabéns! Você ganhou <strong>FRETE GRÁTIS</strong> neste pedido!</span>
            </>
          ) : (
            <>
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Falta apenas <strong>R$ {remainingForFreeShipping.toFixed(2).replace('.', ',')}</strong> para ganhar <strong>Frete GRÁTIS</strong> (Grátis acima de R$ 30,00).
              </span>
            </>
          )}
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Seu carrinho está vazio</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Navegue pelas ofertas, perfumaria ou busque seus medicamentos para adicionar ao carrinho.
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-rose-600 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md hover:bg-rose-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorar Produtos</span>
            </button>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.product.id}-${index}`}
              className={`bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3 ${
                zoomMode ? 'p-4' : 'p-3'
              }`}
            >
              {/* Product Visual & Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 bg-slate-50 rounded-xl p-1 shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <MedicineBoxSvg
                      prescriptionType={item.product.prescriptionType}
                      isGeneric={item.product.isGeneric}
                      name={item.product.name}
                      dosage={item.product.dosage}
                      category={item.product.category}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className={`font-bold text-gray-900 truncate ${zoomMode ? 'text-sm' : 'text-xs sm:text-sm'}`}>
                    {item.product.name}
                  </h4>
                  {item.product.dosage && (
                    <p className="text-[10px] text-gray-500 truncate">
                      {item.product.dosage}
                    </p>
                  )}
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-black text-rose-600 text-sm font-mono">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        (R$ {item.product.price.toFixed(2).replace('.', ',')} un)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Adjuster */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-lg font-bold active:scale-90"
                    title="Diminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-black text-xs font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-lg font-bold active:scale-90"
                    title="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  title="Remover produto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Trigger */}
      {items.length > 0 && (
        <div className="bg-white p-4 sm:p-5 border-t border-gray-200 space-y-3 shrink-0 shadow-lg">
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between font-bold text-gray-900 text-sm">
              <span>Subtotal dos Itens</span>
              <span className="font-mono text-rose-600 text-base font-black">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              * A opção de <strong>Entrega</strong> ou <strong>Retirada na Loja</strong> será selecionada na próxima etapa.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900 text-[11px] font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Atenção: É necessário estar logado ou cadastrado para finalizar o pedido com segurança.</span>
          </div>

          <button
            onClick={onProceedToCheckout}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition"
          >
            <span>Avançar para o Checkout</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Compra Segura • Escolha entrega ou retirada no Checkout</span>
          </div>
        </div>
      )}
    </div>
  );
};

