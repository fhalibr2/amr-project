import React, { useState } from 'react';
import { CartItem, Order, User, PrescriptionFile } from '../types';
import {
  X,
  CheckCircle2,
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  Info,
  Upload,
  FileText,
  File,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface CheckoutModalProps {
  items: CartItem[];
  currentUser: User | null;
  onCompleteOrder: (orderData: Partial<Order>) => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  items,
  currentUser,
  onCompleteOrder,
  onClose,
}) => {
  const [step, setStep] = useState<'options' | 'review' | 'finished'>('options');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [needChange, setNeedChange] = useState<boolean>(false);
  const [changeAmount, setChangeAmount] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<PrescriptionFile | null>(null);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);

  // Check if cart contains controlled items requiring prescription
  const controlledItems = items.filter(
    (item) =>
      item.product.prescriptionType === 'black' ||
      item.product.prescriptionType === 'red_retention' ||
      item.product.prescriptionType === 'red'
  );
  const hasControlledItems = controlledItems.length > 0;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Total reference price calculation for overall savings at checkout
  const totalOriginal = items.reduce((sum, item) => {
    const ref = item.product.originalPrice || item.product.pmcPrice || item.product.price;
    return sum + ref * item.quantity;
  }, 0);

  const totalSavings = totalOriginal > subtotal ? totalOriginal - subtotal : 0;
  const deliveryFee = deliveryType === 'delivery' ? (subtotal >= 30 ? 0 : 6.0) : 0;
  const total = subtotal + deliveryFee;

  // Calculate troco numeric values
  const parsedBanknote = parseFloat(changeAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
  const hasValidBanknote = !isNaN(parsedBanknote) && parsedBanknote > total;
  const calculatedTroco = hasValidBanknote ? parsedBanknote - total : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 15 * 1024 * 1024) {
      setPrescriptionError('Arquivo muito grande. O limite máximo é 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPrescriptionFile({
        dataUrl,
        fileName: selected.name,
        fileType: selected.type || 'application/octet-stream',
      });
      setPrescriptionError(null);
    };
    reader.readAsDataURL(selected);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setPrescriptionError(null);

    // If controlled items present & deliveryType is delivery, prescription is MANDATORY!
    if (hasControlledItems && deliveryType === 'delivery' && !prescriptionFile) {
      setPrescriptionError(
        '⚠️ ATENÇÃO: Para pedidos de entrega a domicílio com medicamentos controlados, é OBRIGATÓRIO enviar a foto ou PDF da receita médica para validação.'
      );
      return;
    }

    if (paymentMethod === 'cash' && needChange) {
      if (isNaN(parsedBanknote) || parsedBanknote <= total) {
        setPrescriptionError(
          `⚠️ O valor da nota para troco deve ser maior que o total do pedido (R$ ${total.toFixed(2).replace('.', ',')}).`
        );
        return;
      }
    }

    setStep('review');
  };

  const handleFinalSubmit = () => {
    onCompleteOrder({
      deliveryType,
      paymentMethod,
      changeAmount: paymentMethod === 'cash' && needChange ? changeAmount : undefined,
      cashBanknote: paymentMethod === 'cash' && needChange && hasValidBanknote ? parsedBanknote : undefined,
      calculatedChange: paymentMethod === 'cash' && needChange && hasValidBanknote ? calculatedTroco : undefined,
      prescriptionFile: prescriptionFile || undefined,
      customerPhone: currentUser?.phone,
      address: currentUser?.address,
      subtotal,
      deliveryFee,
      total,
      items,
      status: 'confirmed',
    });
    setStep('finished');
  };

  const getPaymentLabel = () => {
    if (paymentMethod === 'pix') return 'PIX na Entrega (QR Code gerado pelo Motoboy)';
    if (paymentMethod === 'card') return 'Cartão de Crédito / Débito na Entrega (Maquininha)';
    return needChange && hasValidBanknote
      ? `Dinheiro na Entrega (Célula: R$ ${parsedBanknote.toFixed(2).replace('.', ',')} | Troco: R$ ${calculatedTroco.toFixed(2).replace('.', ',')})`
      : 'Dinheiro na Entrega (Sem troco)';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn text-slate-900">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {step === 'review' && (
              <button
                type="button"
                onClick={() => setStep('options')}
                className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                title="Voltar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                {step === 'review' ? 'Confirmação do Pedido' : step === 'finished' ? 'Pedido Concluído' : 'Finalizar Pedido'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 'review' ? 'Revise os dados antes de enviar a entrega' : 'Pagamento realizado na entrega pelo entregador'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        {step !== 'finished' && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-blue-950 font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              O pagamento em <strong>Dinheiro, Cartão ou PIX</strong> é realizado diretamente ao <strong>motoboy</strong> no momento da entrega.
            </span>
          </div>
        )}

        {/* STEP 3: FINISHED SUCCESS SCREEN */}
        {step === 'finished' ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-extrabold text-xl text-slate-900">Pedido Confirmado!</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Seu pedido foi registrado e enviado para a farmácia. O entregador levará a maquininha/QR Code no local de entrega.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition"
            >
              Concluir & Voltar para a Loja
            </button>
          </div>
        ) : step === 'review' ? (
          /* STEP 2: CONFIRMATION & REVIEW STEP */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Por favor, verifique se todos os dados estão corretos:</span>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs border-b border-slate-200 pb-1.5">
                <MapPin className="w-4 h-4" />
                <span>Dados de Entrega & Cliente</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Cliente:</span>
                <strong className="text-slate-900">{currentUser?.name || 'Cliente'} ({currentUser?.cpf || 'CPF não informado'})</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Endereço de Entrega:</span>
                <strong className="text-slate-900">
                  {deliveryType === 'delivery'
                    ? currentUser?.address
                      ? `${currentUser.address.street}, ${currentUser.address.number} - ${currentUser.address.neighborhood}, ${currentUser.address.city}`
                      : 'Entrega no endereço cadastrado'
                    : 'Retirada presencial na Farmácia'}
                </strong>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs border-b border-slate-200 pb-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Forma de Pagamento Selecionada</span>
              </div>
              <p className="text-slate-800 font-bold text-xs">{getPaymentLabel()}</p>
            </div>

            {/* Items Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                <span>Itens do Pedido ({items.length})</span>
                <span>Valor Total</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="truncate pr-2">{item.quantity}x {item.product.name}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Order Savings Callout at Checkout */}
            {totalSavings > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-emerald-900 font-bold">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Economia Total no Pedido:</span>
                </div>
                <span className="font-mono text-sm text-emerald-700">
                  R$ {totalSavings.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}

            {/* Final Total Calculation */}
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxa de Entrega</span>
                <span className="font-mono">{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total a Pagar na Entrega</span>
                <span className="text-rose-600 font-mono text-base">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalSubmit}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm shadow-xl shadow-emerald-600/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
              <span>Confirmar e Enviar Pedido</span>
            </button>
          </div>
        ) : (
          /* STEP 1: OPTIONS FORM */
          <form onSubmit={handleProceedToReview} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs sm:text-sm">
            {/* Delivery Type */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 block text-xs uppercase tracking-wider">
                Como deseja receber seu pedido?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition ${
                    deliveryType === 'delivery'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-extrabold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-5 h-5 text-rose-600" />
                  <span className="text-xs">Entrega no Endereço</span>
                  <span className="text-[10px] font-bold text-rose-700">
                    {subtotal >= 30 ? 'Frete GRÁTIS 🎉' : 'Taxa de R$ 6,00 (Grátis acima de R$ 30)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition ${
                    deliveryType === 'pickup'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-extrabold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-5 h-5 text-rose-600" />
                  <span className="text-xs">Retirar na Loja</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Frete Grátis na Loja</span>
                </button>
              </div>
            </div>

            {/* Controlled Medicines Prescription Section */}
            {hasControlledItems && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 block text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Receita Médica (Itens Controlados)</span>
                  </label>
                  {deliveryType === 'delivery' ? (
                    <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      Obrigatório para Entrega
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Apresentar no Balcão
                    </span>
                  )}
                </div>

                {deliveryType === 'delivery' ? (
                  <div className="bg-rose-50/70 border-2 border-dashed border-rose-300 rounded-2xl p-4 space-y-3">
                    <div className="text-xs text-rose-950 font-medium leading-relaxed">
                      Seu carrinho contém <strong>{controlledItems.length} medicamento(s) sujeito(s) a retenção de receita</strong>. Para entrega em domicílio, anexe a foto ou PDF da receita médica para validação farmacêutica.
                    </div>

                    {!prescriptionFile ? (
                      <div>
                        <label className="cursor-pointer bg-white hover:bg-rose-100/50 border border-rose-300 text-rose-800 font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xs active:scale-98">
                          <Upload className="w-4 h-4 text-rose-600" />
                          <span>Selecionar Foto ou PDF da Receita</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 text-center mt-1.5 font-medium">
                          Aceita imagem da galeria (JPG/PNG) ou documento em PDF (Até 15MB)
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-xl border border-rose-300 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {prescriptionFile.fileType.includes('pdf') ? (
                            <File className="w-6 h-6 text-red-600 shrink-0" />
                          ) : (
                            <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-extrabold text-slate-900 text-xs block truncate">
                              {prescriptionFile.fileName}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              ✓ Receita Anexada com Sucesso
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPrescriptionFile(null)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remover receita"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs text-slate-700 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Como você escolheu <strong>Retirar na Loja</strong>, a receita física original deve ser apresentada ao atendente no balcão da farmácia para conferência e retenção.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner */}
            {prescriptionError && (
              <div className="bg-red-50 border border-red-300 text-red-950 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{prescriptionError}</span>
              </div>
            )}

            {/* Payment Options */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 block text-xs uppercase tracking-wider">
                Forma de Pagamento (Entregador leva a maquininha/QR code)
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    paymentMethod === 'pix'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-extrabold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>PIX na Entrega (QR Code pelo Motoboy)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    paymentMethod === 'card'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-extrabold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Cartão de Crédito / Débito na Entrega</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    paymentMethod === 'cash'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-extrabold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Dinheiro na Entrega</span>
                  </div>
                </button>

                {paymentMethod === 'cash' && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs">Precisa de troco?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNeedChange(false);
                            setChangeAmount('');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            !needChange ? 'bg-amber-600 text-white' : 'bg-white text-amber-900 border border-amber-300'
                          }`}
                        >
                          Não preciso
                        </button>
                        <button
                          type="button"
                          onClick={() => setNeedChange(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            needChange ? 'bg-amber-600 text-white' : 'bg-white text-amber-900 border border-amber-300'
                          }`}
                        >
                          Sim, preciso
                        </button>
                      </div>
                    </div>

                    {needChange && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-amber-900">
                          Troco para quanto? (Informe a nota que irá entregar, ex: 100)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: R$ 50,00 ou R$ 100,00"
                          value={changeAmount}
                          onChange={(e) => setChangeAmount(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-400"
                        />
                        {hasValidBanknote && (
                          <div className="bg-amber-100 p-2.5 rounded-xl border border-amber-300 text-xs text-amber-950 font-bold space-y-0.5">
                            <div className="flex justify-between">
                              <span>Valor da Nota/Célula:</span>
                              <span className="font-mono">R$ {parsedBanknote.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between text-emerald-800 font-extrabold text-xs pt-1 border-t border-amber-200">
                              <span>Troco a ser levado pelo Motoboy:</span>
                              <span className="font-mono text-emerald-700 text-sm">R$ {calculatedTroco.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Taxa de Entrega</span>
                <span className="font-mono">{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total do Pedido</span>
                <span className="text-rose-600 font-mono text-base">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-rose-600/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
              <span>Revisar Dados do Pedido</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
