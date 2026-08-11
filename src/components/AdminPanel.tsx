import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product, Category, Order, PrescriptionType, StoreSettings, User } from '../types';
import { MedicineBoxSvg } from './MedicineBoxSvg';
import { soundManager } from '../utils/soundEffects';
import { DIDACTIC_MEDICINES, INITIAL_LABORATORIES } from '../data/didacticDatabase';
import { isOfferActive, getOfferStatusDetails } from '../utils/offerUtils';
import { SplashScreen } from './SplashScreen';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Package,
  Layers,
  ShoppingBag,
  Monitor,
  Smartphone,
  X,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Lock,
  Settings,
  Volume2,
  VolumeX,
  Barcode,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  DollarSign,
  Tag,
  Truck,
  Phone,
  Store,
  Eye,
  EyeOff,
  KeyRound,
  Search,
  Upload,
  Download,
  FileText,
  Filter,
  CheckSquare,
  Square,
  HelpCircle,
  CreditCard,
  QrCode,
  Banknote,
  Minus,
  Building2,
  Zap,
  BookOpen,
  Clock,
  ShieldCheck,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  FileCheck,
  LayoutGrid,
  List,
  Table,
  Play,
  Archive,
  History,
  Receipt,
  Send,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], confirmedBy?: 'customer' | 'driver' | 'staff') => void;
  onVerifyOrderEan: (orderId: string, itemId: number) => void;
  onImportDatabase?: (data: { products?: Product[]; categories?: Category[]; settings?: StoreSettings }) => void;
  isDesktopView: boolean;
  onToggleDesktopView: () => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  categories,
  orders,
  settings,
  onUpdateSettings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onUpdateOrderStatus,
  onVerifyOrderEan,
  onImportDatabase,
  isDesktopView,
  onToggleDesktopView,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'import' | 'categories' | 'laboratories' | 'orders' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  // Registered Laboratories State
  const [laboratories, setLaboratories] = useState<string[]>(() => {
    const saved = localStorage.getItem('pharma_laboratories');
    return saved ? JSON.parse(saved) : INITIAL_LABORATORIES;
  });
  const [newLabInput, setNewLabInput] = useState('');

  const handleAddLaboratory = (labName: string) => {
    const trimmed = labName.trim();
    if (!trimmed || laboratories.includes(trimmed)) return;
    const updated = [...laboratories, trimmed].sort();
    setLaboratories(updated);
    localStorage.setItem('pharma_laboratories', JSON.stringify(updated));
  };

  // Additional EANs input state for product form
  const [additionalEansInput, setAdditionalEansInput] = useState('');

  // Search & Filter state for Products Tab
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<'all' | 'medicamentos' | 'perfumaria' | 'perfumaria_no_image' | 'genericos' | 'incomplete' | 'unpriced'>('all');

  // Intelligent Laboratory Assimilation & Automatic Registration
  const matchAndAssimilateLaboratory = (rawName: string): string => {
    if (!rawName || !rawName.trim()) return '';
    const trimmed = rawName.trim();

    const simplify = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(s\.?a\.?|s\/a|ltda\.?|laboratorio[s]?|farmaceutica[s]?|labs?|industria[s]?)\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();

    const normTarget = simplify(trimmed);
    if (!normTarget) return trimmed;

    // Search in existing registered laboratories list
    const existingMatch = laboratories.find((lab) => {
      const normLab = simplify(lab);
      return (
        normLab === normTarget ||
        (normLab.length >= 3 && normTarget.includes(normLab)) ||
        (normTarget.length >= 3 && normLab.includes(normTarget))
      );
    });

    if (existingMatch) {
      return existingMatch; // Assimilated to existing laboratory!
    }

    // No existing laboratory match -> Automatically register this new laboratory!
    const formattedLab = trimmed
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
      .join(' ');

    handleAddLaboratory(formattedLab);
    return formattedLab;
  };
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'controlled'>('all');

  // Product View Mode State
  const [productViewMode, setProductViewMode] = useState<'grid_large' | 'grid_compact' | 'table'>('grid_large');

  // Mass Selection & Mass Maintenance State
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isMassEditOpen, setIsMassEditOpen] = useState(false);
  const [massEditTab, setMassEditTab] = useState<'prices' | 'offers' | 'stock' | 'category' | 'lab' | 'status'>('prices');

  // Mass Edit Form States
  const [massPriceType, setMassPriceType] = useState<'fixed' | 'discount_percent' | 'increase_percent'>('fixed');
  const [massPriceValue, setMassPriceValue] = useState<string>('');

  const [massOfferAction, setMassOfferAction] = useState<'enable' | 'disable' | 'dates_only'>('enable');
  const [massOfferTag, setMassOfferTag] = useState<string>('');
  const [massOfferStartDate, setMassOfferStartDate] = useState<string>('');
  const [massOfferEndDate, setMassOfferEndDate] = useState<string>('');

  const [massStockType, setMassStockType] = useState<'fixed' | 'add' | 'subtract'>('fixed');
  const [massStockValue, setMassStockValue] = useState<string>('');

  const [massCategory, setMassCategory] = useState<string>('');
  const [massPrescription, setMassPrescription] = useState<string>('');
  const [massGeneric, setMassGeneric] = useState<string>(''); // 'keep' | 'yes' | 'no'

  const [massLab, setMassLab] = useState<string>('');

  const toggleSelectProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = (filteredList: Product[]) => {
    const visibleIds = filteredList.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      const newSet = new Set([...selectedProductIds, ...visibleIds]);
      setSelectedProductIds(Array.from(newSet));
    }
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  const handleApplyMassPrice = () => {
    const val = parseFloat(massPriceValue);
    if (isNaN(val) || val < 0) {
      alert('Por favor, informe um valor numérico válido.');
      return;
    }

    let count = 0;
    products.forEach((p) => {
      if (selectedProductIds.includes(p.id)) {
        let newPrice = p.price;
        if (massPriceType === 'fixed') {
          newPrice = val;
        } else if (massPriceType === 'discount_percent') {
          newPrice = Math.max(0, p.price * (1 - val / 100));
        } else if (massPriceType === 'increase_percent') {
          newPrice = p.price * (1 + val / 100);
        }
        onUpdateProduct({ ...p, price: Number(newPrice.toFixed(2)) });
        count++;
      }
    });

    soundManager.playBeepSuccess();
    alert(`✓ Preços reajustados para ${count} produto(s)!`);
    setIsMassEditOpen(false);
  };

  const handleApplyMassOffer = () => {
    let count = 0;
    products.forEach((p) => {
      if (selectedProductIds.includes(p.id)) {
        let updated: Product = { ...p };
        if (massOfferAction === 'enable') {
          updated.isOffer = true;
          if (massOfferTag) updated.offerTag = massOfferTag;
          if (massOfferStartDate) updated.offerStartDate = massOfferStartDate;
          if (massOfferEndDate) updated.offerEndDate = massOfferEndDate;
        } else if (massOfferAction === 'disable') {
          updated.isOffer = false;
        } else if (massOfferAction === 'dates_only') {
          if (massOfferStartDate) updated.offerStartDate = massOfferStartDate;
          if (massOfferEndDate) updated.offerEndDate = massOfferEndDate;
        }
        onUpdateProduct(updated);
        count++;
      }
    });

    soundManager.playBeepSuccess();
    alert(`✓ Configuração de oferta atualizada para ${count} produto(s)!`);
    setIsMassEditOpen(false);
  };

  const handleApplyMassStock = () => {
    const val = parseInt(massStockValue);
    if (isNaN(val)) {
      alert('Por favor, informe uma quantidade numérica válida.');
      return;
    }

    let count = 0;
    products.forEach((p) => {
      if (selectedProductIds.includes(p.id)) {
        let newStock = p.stock;
        if (massStockType === 'fixed') {
          newStock = Math.max(0, val);
        } else if (massStockType === 'add') {
          newStock = Math.max(0, p.stock + val);
        } else if (massStockType === 'subtract') {
          newStock = Math.max(0, p.stock - val);
        }
        onUpdateProduct({ ...p, stock: newStock });
        count++;
      }
    });

    soundManager.playBeepSuccess();
    alert(`✓ Estoque atualizado para ${count} produto(s)!`);
    setIsMassEditOpen(false);
  };

  const handleApplyMassCategory = () => {
    if (!massCategory && !massPrescription && !massGeneric) {
      alert('Selecione ao menos um campo para alterar.');
      return;
    }

    let count = 0;
    products.forEach((p) => {
      if (selectedProductIds.includes(p.id)) {
        let updated = { ...p };
        if (massCategory) updated.category = massCategory;
        if (massPrescription) updated.prescriptionType = massPrescription as PrescriptionType;
        if (massGeneric === 'yes') updated.isGeneric = true;
        if (massGeneric === 'no') updated.isGeneric = false;
        onUpdateProduct(updated);
        count++;
      }
    });

    soundManager.playBeepSuccess();
    alert(`✓ Categoria/Classificação atualizada para ${count} produto(s)!`);
    setIsMassEditOpen(false);
  };

  const handleApplyMassLab = () => {
    if (!massLab.trim()) {
      alert('Informe o nome do laboratório/fabricante.');
      return;
    }
    const finalLab = matchAndAssimilateLaboratory(massLab);

    let count = 0;
    products.forEach((p) => {
      if (selectedProductIds.includes(p.id)) {
        onUpdateProduct({
          ...p,
          laboratory: finalLab,
          manufacturer: finalLab,
          brand: finalLab,
        });
        count++;
      }
    });

    soundManager.playBeepSuccess();
    alert(`✓ Laboratório "${finalLab}" atribuído a ${count} produto(s)!`);
    setIsMassEditOpen(false);
  };

  const handleMassToggleStatus = (active: boolean) => {
    let count = 0;
    products.forEach((p) => {
      if (selectedProductIds.includes(p.id)) {
        onUpdateProduct({ ...p, isActive: active });
        count++;
      }
    });
    soundManager.playBeepSuccess();
    alert(`✓ ${count} produto(s) ${active ? 'ativados' : 'desativados'} com sucesso!`);
    setIsMassEditOpen(false);
  };

  const handleMassDelete = () => {
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR DEFINITIVAMENTE os ${selectedProductIds.length} produtos selecionados? Esta ação não pode ser desfeita.`)) return;
    selectedProductIds.forEach((id) => onDeleteProduct(id));
    setSelectedProductIds([]);
    setIsMassEditOpen(false);
    alert('✓ Produtos excluídos com sucesso!');
  };

  // Splash Screen Preview Simulator State
  const [showSplashPreview, setShowSplashPreview] = useState(false);

  // Orders Tab Sub-tabs ('active' | 'archived')
  const [ordersTab, setOrdersTab] = useState<'active' | 'archived'>('active');

  // Guided Operator Separation Workflow Modal State
  const [guidedSeparationOrder, setGuidedSeparationOrder] = useState<Order | null>(null);
  const [guidedEanInput, setGuidedEanInput] = useState('');
  const [guidedFeedback, setGuidedFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Thermal Receipt Printing Slip Modal State (80mm / 58mm)
  const [thermalPrintOrder, setThermalPrintOrder] = useState<Order | null>(null);

  // Customer Registrations TXT Export Handler
  const handleExportUsersTxt = () => {
    const saved = localStorage.getItem('pharma_registered_users');
    const users: User[] = saved ? JSON.parse(saved) : [];
    if (users.length === 0) {
      alert('Nenhum cadastro de cliente registrado no banco de dados local.');
      return;
    }
    let fileText = `=====================================================\n`;
    fileText += `RELATÓRIO GERAL DE CADASTROS DE CLIENTES - DROGARIA AMERICANA\n`;
    fileText += `Data de Emissão: ${new Date().toLocaleString('pt-BR')} | Total: ${users.length} Clientes\n`;
    fileText += `=====================================================\n\n`;

    users.forEach((u, index) => {
      fileText += `[CLIENTE #${index + 1}]\n`;
      fileText += `ID: ${u.id}\n`;
      fileText += `Nome: ${u.name}\n`;
      fileText += `CPF: ${u.cpf || 'Não informado'}\n`;
      fileText += `E-mail: ${u.email}\n`;
      fileText += `Telefone: ${u.phone || 'Não informado'}\n`;
      fileText += `Endereço: ${u.address?.street || ''}, Nº ${u.address?.number || ''}${u.address?.complement ? ` (${u.address.complement})` : ''} - Bairro: ${u.address?.neighborhood || ''}, ${u.address?.city || ''}/${u.address?.state || ''} (CEP: ${u.address?.cep || ''})\n`;
      fileText += `-----------------------------------------------------\n\n`;
    });

    const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastros_clientes_drogaria_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Autonomous AI Product Description Generator
  const handleGenerateAutoDescription = () => {
    const pName = productForm.name || 'Medicamento / Produto de Saúde';
    const active = productForm.activeIngredient || '';
    const brand = productForm.brand || productForm.laboratory || productForm.manufacturer || 'Laboratório Farmacêutico';
    const isGen = productForm.isGeneric ? ' (Medicamento Genérico)' : '';
    const pres =
      productForm.prescriptionType === 'black'
        ? 'Tarja Preta (Uso sob estrito controle e retenção de receita B1/B2).'
        : productForm.prescriptionType === 'red_retention'
        ? 'Tarja Vermelha (Venda sob prescrição médica e retenção da receita).'
        : productForm.prescriptionType === 'red'
        ? 'Tarja Vermelha (Venda sob prescrição médica).'
        : 'Medicamento Isento de Prescrição (MIP / Livre Venda).';

    let desc = `INDICAÇÃO E FINALIDADE:\n${pName}${isGen} da ${brand} é indicado para auxílio, prevenção e tratamento sintomático conforme sua indicação terapêutica oficial.`;
    if (active) {
      desc += `\n\nPRINCÍPIO ATIVO / COMPOSIÇÃO:\nContém ${active}.`;
    }
    desc += `\n\nPOSOLOGIA E MODO DE USAR:\nUso adulto/pediátrico conforme orientação expressa na bula ou recomendações médicas/farmacêuticas.`;
    desc += `\n\nCLASSIFICAÇÃO DE VENDA:\n${pres}`;
    desc += `\n\nPRECAUÇÕES E CUIDADOS:\nConservar em local seco, fresco (15°C a 30°C) e ao abrigo da luz solar direta. Mantenha fora do alcance das crianças. Em caso de reações adversas, descontinue o uso e consulte o médico ou farmacêutico.`;
    if (productForm.ms && productForm.ms !== 'ISENTO') {
      desc += `\n\nREGISTRO MINISTÉRIO DA SAÚDE (MS):\n${productForm.ms}`;
    }

    setProductForm((prev) => ({ ...prev, description: desc }));
  };

  // Import Modal & Post-Import Review Queue State
  const [importText, setImportText] = useState('');
  const [importedQueue, setImportedQueue] = useState<Partial<Product>[]>([]);
  const [selectedQueueIdx, setSelectedQueueIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbFileInputRef = useRef<HTMLInputElement>(null);

  // EAN Verification Modal state
  const [eanOrderModal, setEanOrderModal] = useState<Order | null>(null);
  const [eanInput, setEanInput] = useState('');
  const [eanMessage, setEanMessage] = useState('');

  // Prescription Viewer Modal State
  const [viewingPrescriptionOrder, setViewingPrescriptionOrder] = useState<Order | null>(null);
  const [prescriptionZoom, setPrescriptionZoom] = useState<number>(1);
  const [prescriptionRotation, setPrescriptionRotation] = useState<number>(0);

  // Order Dispatch Printable Slip Modal State (A4)
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Local state for Settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({
    ...settings,
    offerAnnouncements: settings.offerAnnouncements || [
      'Medicamentos com até 40% OFF no App',
      'Retirada em loja sem custo de entrega',
      'Pagamento facilitado via PIX, Cartão ou Dinheiro na entrega',
    ],
  });

  const [newAnnouncementInput, setNewAnnouncementInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Auto-cancel pending orders older than 24h
  useEffect(() => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    orders.forEach((ord) => {
      if (ord.status === 'pending') {
        const createdTime = new Date(ord.createdAt).getTime();
        if (now - createdTime > TWENTY_FOUR_HOURS_MS) {
          onUpdateOrderStatus(ord.id, 'cancelled');
        }
      }
    });
  }, [orders, onUpdateOrderStatus]);

  // Sort orders descending (newest first)
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  // Split into Active vs Archived
  const activeOrders = useMemo(() => {
    return sortedOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );
  }, [sortedOrders]);

  const archivedOrders = useMemo(() => {
    return sortedOrders.filter(
      (o) => o.status === 'delivered' || o.status === 'cancelled'
    );
  }, [sortedOrders]);

  // Form State for Products
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: categories[0]?.id || 'medicamentos',
    price: 19.9,
    pmcPrice: 24.9,
    originalPrice: 24.9,
    stock: 50,
    prescriptionType: 'none',
    isGeneric: false,
    isOffer: false,
    offerTag: '',
    offerDurationType: 'stock_or_time',
    offerDurationText: '',
    description: '',
    dosage: '',
    quantity: '',
    manufacturer: '',
    laboratory: '',
    activeIngredient: '',
    ean: '7891234567890',
    ms: '',
    image: '',
    isActive: true,
  });

  // Perfumaria preset image URLs
  const perfumariaPresetImages = [
    { name: 'Perfume Luxury', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300' },
    { name: 'Protetor Solar', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300' },
    { name: 'Shampoo Nutritivo', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300' },
    { name: 'Creme Hidratante', url: 'https://images.unsplash.com/photo-1608248597263-00077227357c?w=300' },
  ];

  // Form State for Category
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    id: '',
    name: '',
    icon: 'Package',
    color: '#dc2626',
    description: '',
    isActive: true,
    displayOrder: categories.length + 1,
  });

  const handleOpenCreateProduct = () => {
    setProductForm({
      name: '',
      brand: '',
      category: categories[0]?.id || 'medicamentos',
      price: 19.9,
      pmcPrice: 24.9,
      originalPrice: 24.9,
      stock: 50,
      prescriptionType: 'none',
      isGeneric: false,
      isOffer: false,
      offerTag: '',
      offerDurationType: 'stock_or_time',
      offerDurationText: '',
      description: '',
      dosage: '',
      quantity: '',
      manufacturer: '',
      laboratory: '',
      activeIngredient: '',
      ean: '7891234567890',
      ms: '',
      image: '',
      isActive: true,
    });
    setAdditionalEansInput('');
    setEditingProduct(null);
    setIsCreatingProduct(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      ...prod,
      isOffer: prod.isOffer ?? false,
      offerDurationType: prod.offerDurationType || 'stock_or_time',
      offerDurationText: prod.offerDurationText || '',
    });
    setAdditionalEansInput((prod.additionalEans || []).join(', '));
    setIsCreatingProduct(true);
  };

  const handleAutodidacticSelect = (medName: string) => {
    const med = DIDACTIC_MEDICINES.find(m => m.name === medName || m.idName === medName);
    if (!med) return;

    setProductForm(prev => ({
      ...prev,
      name: med.name,
      brand: med.brand,
      category: med.category || prev.category || 'medicamentos',
      price: med.price,
      pmcPrice: med.pmcPrice,
      originalPrice: med.pmcPrice,
      prescriptionType: med.prescriptionType,
      isGeneric: med.isGeneric,
      description: med.description,
      ean: med.ean,
      ms: med.ms,
      laboratory: med.laboratory,
      manufacturer: med.manufacturer,
      dosage: med.dosage,
      quantity: med.quantity,
      activeIngredient: med.activeIngredient,
    }));

    setAdditionalEansInput((med.additionalEans || []).join(', '));

    if (med.laboratory && !laboratories.includes(med.laboratory)) {
      handleAddLaboratory(med.laboratory);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const parsedAdditionalEans = additionalEansInput
      .split(',')
      .map(str => str.trim())
      .filter(Boolean);

    const isOffer = productForm.isOffer ?? false;
    const finalProductData = {
      ...productForm,
      isOffer,
      additionalEans: parsedAdditionalEans,
      laboratory: productForm.laboratory || productForm.manufacturer || productForm.brand || '',
      manufacturer: productForm.manufacturer || productForm.laboratory || productForm.brand || '',
    };

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...(finalProductData as Product),
      });
    } else {
      onAddProduct(finalProductData as Omit<Product, 'id'>);
    }

    // Auto-register laboratory if new
    if (finalProductData.laboratory && !laboratories.includes(finalProductData.laboratory)) {
      handleAddLaboratory(finalProductData.laboratory);
    }

    setIsCreatingProduct(false);
    setEditingProduct(null);
  };

  const handleAdjustStock = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    onUpdateProduct({ ...product, stock: newStock });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    const newId =
      categoryForm.id ||
      categoryForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') ||
      'cat_' + Date.now();

    onAddCategory({
      id: newId,
      name: categoryForm.name,
      icon: categoryForm.icon || 'Package',
      color: categoryForm.color || '#dc2626',
      description: categoryForm.description || '',
      isActive: true,
      displayOrder: categories.length + 1,
    });

    setIsCreatingCategory(false);
    setCategoryForm({ name: '', description: '' });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    soundManager.playBeepSuccess();
  };

  const handleAddAnnouncement = () => {
    if (!newAnnouncementInput.trim()) return;
    const current = settingsForm.offerAnnouncements || [];
    setSettingsForm({
      ...settingsForm,
      offerAnnouncements: [...current, newAnnouncementInput.trim()],
    });
    setNewAnnouncementInput('');
  };

  const handleRemoveAnnouncement = (index: number) => {
    const current = settingsForm.offerAnnouncements || [];
    setSettingsForm({
      ...settingsForm,
      offerAnnouncements: current.filter((_, idx) => idx !== index),
    });
  };

  const handleCheckEanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eanOrderModal || !eanInput.trim()) return;

    const foundItem = eanOrderModal.items.find(
      (i) => i.product.ean === eanInput.trim() || String(i.product.id) === eanInput.trim()
    );

    if (foundItem) {
      onVerifyOrderEan(eanOrderModal.id, foundItem.product.id);
      soundManager.playBeepSuccess();
      setEanMessage(`Produto "${foundItem.product.name}" conferido com sucesso.`);
      setEanInput('');
    } else {
      setEanMessage(`EAN "${eanInput}" não pertence a este pedido.`);
    }
  };

  // Database Export Handler
  const handleExportDatabase = () => {
    const dbData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      products,
    };
    const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banco_de_dados_farmacia_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Database Import Handler
  const handleImportDatabaseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products || json.categories || json.settings) {
          if (onImportDatabase) {
            onImportDatabase(json);
          } else {
            if (json.products && Array.isArray(json.products)) {
              json.products.forEach((p: Product) => onAddProduct(p));
            }
            if (json.settings) {
              onUpdateSettings(json.settings);
            }
          }
          alert('Banco de dados restaurado e importado com sucesso!');
        } else {
          alert('Arquivo JSON com estrutura de banco de dados inválida.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON de banco de dados.');
      }
    };
    reader.readAsText(file);
  };

  // CSV / TXT Parser - Preserves raw imported fields & assimilates/registers laboratories
  const handleParseImportText = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const newItems: Partial<Product>[] = [];

    lines.forEach((line) => {
      // Split by semicolon, comma or tab
      const cols = line.split(/[;\t,]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 1) return;

      const name = cols[0] || '';
      if (!name || name.toLowerCase().includes('nome') || name.toLowerCase().includes('descrição') || name.toLowerCase().includes('produto')) {
        return; // skip header or empty row
      }

      const ean = cols[1] && cols[1] !== '7891234567890' ? cols[1] : (cols[1] || '');

      // Parse price without inventing false defaults. If missing, price = 0
      const rawPriceStr = cols[2]?.replace('R$', '').replace(/\./g, '').replace(',', '.');
      const rawPrice = rawPriceStr ? parseFloat(rawPriceStr) : NaN;
      const price = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : 0;

      // Parse stock. Default to 0 if not provided
      const rawStock = cols[3] ? parseInt(cols[3]) : NaN;
      const stock = !isNaN(rawStock) && rawStock >= 0 ? rawStock : 0;

      // Parse PMC price
      const rawPmcStr = cols[4]?.replace('R$', '').replace(/\./g, '').replace(',', '.');
      const rawPmc = rawPmcStr ? parseFloat(rawPmcStr) : NaN;
      const pmcPrice = !isNaN(rawPmc) && rawPmc >= 0 ? rawPmc : (price > 0 ? price * 1.25 : 0);

      const activeIngredient = cols[5] || '';
      const rawManufacturer = cols[6] || '';
      const description = cols[7] || '';
      const ms = cols[8] || '';

      // Intelligent Laboratory Assimilation & Automatic Registration
      const manufacturer = rawManufacturer ? matchAndAssimilateLaboratory(rawManufacturer) : '';

      newItems.push({
        name,
        ean,
        price,
        stock,
        pmcPrice,
        originalPrice: pmcPrice,
        activeIngredient,
        manufacturer,
        brand: manufacturer,
        description,
        category: 'medicamentos',
        prescriptionType: 'none',
        ms,
        image: '',
        isActive: true,
      });
    });

    if (newItems.length > 0) {
      setImportedQueue(newItems);
      setSelectedQueueIdx(0);
    } else {
      alert('Nenhum produto válido identificado no texto. Verifique a formatação.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      handleParseImportText(content);
    };
    reader.readAsText(file);
  };

  const handleSaveQueueItem = (itemIdx: number, finalProduct: Partial<Product>) => {
    if (!finalProduct.name) return;

    // Assimilate or auto-register lab if manufacturer or brand is filled
    const lab = finalProduct.manufacturer || finalProduct.brand
      ? matchAndAssimilateLaboratory(finalProduct.manufacturer || finalProduct.brand || '')
      : '';

    const finalPrice = finalProduct.price !== undefined && !isNaN(finalProduct.price) ? finalProduct.price : 0;

    onAddProduct({
      name: finalProduct.name,
      brand: lab || finalProduct.brand || '',
      category: finalProduct.category || 'medicamentos',
      price: finalPrice,
      pmcPrice: finalProduct.pmcPrice || 0,
      originalPrice: finalProduct.pmcPrice || 0,
      stock: finalProduct.stock !== undefined ? finalProduct.stock : 0,
      prescriptionType: finalProduct.prescriptionType || 'none',
      isGeneric: finalProduct.isGeneric || false,
      isOffer: finalProduct.isOffer || false,
      offerTag: finalProduct.offerTag || '',
      description: finalProduct.description || '',
      ean: finalProduct.ean || '',
      ms: finalProduct.ms || '',
      manufacturer: lab || finalProduct.manufacturer || '',
      activeIngredient: finalProduct.activeIngredient || '',
      image: finalProduct.image || '',
      isActive: true,
    });

    const updated = importedQueue.filter((_, idx) => idx !== itemIdx);
    setImportedQueue(updated);

    if (updated.length > 0) {
      setSelectedQueueIdx(Math.min(itemIdx, updated.length - 1));
    } else {
      setSelectedQueueIdx(null);
      alert('Todos os itens da fila de importação foram integrados ao catálogo!');
      setActiveTab('products');
    }
  };

  // Mass Import All Queue Items Instantaneously
  const handleImportAllQueue = () => {
    if (importedQueue.length === 0) return;

    let importedCount = 0;
    let unpricedCount = 0;

    importedQueue.forEach((item) => {
      if (!item.name) return;
      const lab = item.manufacturer || item.brand
        ? matchAndAssimilateLaboratory(item.manufacturer || item.brand || '')
        : '';
      const itemPrice = item.price !== undefined && !isNaN(item.price) && item.price >= 0 ? item.price : 0;
      if (itemPrice === 0) unpricedCount++;

      onAddProduct({
        name: item.name,
        brand: lab || item.brand || '',
        category: item.category || 'medicamentos',
        price: itemPrice,
        pmcPrice: item.pmcPrice || 0,
        originalPrice: item.pmcPrice || 0,
        stock: item.stock !== undefined ? item.stock : 0,
        prescriptionType: item.prescriptionType || 'none',
        isGeneric: item.isGeneric || false,
        isOffer: item.isOffer || false,
        offerTag: item.offerTag || '',
        description: item.description || '',
        ean: item.ean || '',
        ms: item.ms || '',
        manufacturer: lab || item.manufacturer || '',
        activeIngredient: item.activeIngredient || '',
        image: item.image || '',
        isActive: true,
      });
      importedCount++;
    });

    setImportedQueue([]);
    setSelectedQueueIdx(null);
    setImportText('');

    alert(
      `✓ Sucesso! ${importedCount} produto(s) importado(s) em massa para o catálogo.\n\n` +
      `• Laboratórios novos foram cadastrados/assimilados automaticamente.\n` +
      (unpricedCount > 0 ? `• ${unpricedCount} item(ns) estão sem precificação (R$ 0,00) e foram direcionados para a aba "Sem Precificação" para você definir o valor.` : '')
    );
    setActiveTab('products');
    if (unpricedCount > 0) {
      setSelectedDeptFilter('unpriced');
    }
  };

  // Filter products for admin view
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      !adminSearchQuery ||
      prod.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      (prod.ean && prod.ean.includes(adminSearchQuery)) ||
      (prod.activeIngredient && prod.activeIngredient.toLowerCase().includes(adminSearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedDeptFilter === 'medicamentos') return prod.category === 'medicamentos';
    if (selectedDeptFilter === 'perfumaria') return prod.category === 'perfumaria' || prod.category === 'higiene';
    if (selectedDeptFilter === 'perfumaria_no_image') return (prod.category === 'perfumaria' || prod.category === 'higiene') && !prod.image;
    if (selectedDeptFilter === 'genericos') return prod.isGeneric;
    if (selectedDeptFilter === 'unpriced') return !prod.price || prod.price <= 0;
    if (selectedDeptFilter === 'incomplete') {
      const missingMs = !prod.ms || (prod.category === 'medicamentos' && prod.ms !== 'ISENTO' && !/^\d+$/.test(prod.ms.replace(/\D/g, '')));
      const missingImage = !prod.image;
      const missingDesc = !prod.description;
      const missingPrice = !prod.price || prod.price <= 0;
      return missingMs || missingImage || missingDesc || missingPrice;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col overflow-hidden text-slate-900 animate-fadeIn">
      {/* Top Bar with Desktop Toggle & Database Export */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-rose-600 p-2 rounded-xl text-white font-black text-xs shadow-md">
            ADMIN
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-none flex items-center gap-2">
              <span>{settings.appName} • Painel de Gestão Farmacêutica</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão de ofertas, importação de produtos, cadastros e banco de dados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Registrations TXT Export Button */}
          <button
            onClick={handleExportUsersTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
            title="Exportar arquivo TXT com todos os cadastros de clientes"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Cadastros (.TXT)</span>
          </button>

          {/* Database Backup & Export Button */}
          <button
            onClick={handleExportDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
            title="Exportar cópia de segurança do Banco de Dados (.JSON)"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Backup Banco</span>
          </button>

          <input
            type="file"
            ref={dbFileInputRef}
            onChange={handleImportDatabaseFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => dbFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
            title="Restaurar Banco de Dados (.JSON)"
          >
            <Upload className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Restaurar Banco</span>
          </button>

          {/* DESKTOP MODE TOGGLE */}
          <button
            onClick={onToggleDesktopView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
              isDesktopView
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Alternar modo visualização"
          >
            {isDesktopView ? (
              <>
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Modo Desktop ON</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Modo Smartphone</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-100">
        {/* Navigation Sidebar */}
        <div className="w-full sm:w-64 bg-white border-b sm:border-b-0 sm:border-r border-slate-200 p-2 sm:p-4 flex sm:flex-col gap-1 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos & Estoque ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'import'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importação (Excel/TXT) {importedQueue.length > 0 && `(${importedQueue.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Seções / Categorias ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('laboratories')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'laboratories'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Laboratórios ({laboratories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Notificações & Configurações</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: PRODUCTS & SEARCH & DEPARTMENT FILTERS & MULTI-VIEW MODES */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-rose-600" />
                    <span>Gerenciar Catálogo de Produtos ({products.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Controle de estoque, alteração de preços PMC, registro MS e visualização flexível em grade ou tabela.
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateProduct}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Produto Manual</span>
                </button>
              </div>

              {/* Search Bar, Stock Filters & View Mode Toggles */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      placeholder="Pesquisar por nome do remédio, EAN, marca ou princípio ativo..."
                      className="w-full bg-transparent outline-none text-xs sm:text-sm text-slate-800"
                    />
                    {adminSearchQuery && (
                      <button onClick={() => setAdminSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Stock Status Filter */}
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-600"
                  >
                    <option value="all">Estoque: Todos</option>
                    <option value="in_stock">Disponível em Estoque</option>
                    <option value="out_of_stock">⚠️ Esgotado (Estoque 0)</option>
                    <option value="controlled">🔒 Controlados / Tarjados</option>
                  </select>

                  {/* View Mode Controls */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      onClick={() => setProductViewMode('grid_large')}
                      className={`p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                        productViewMode === 'grid_large'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Cards Grandes (Visual Completo)"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Cards Grandes</span>
                    </button>

                    <button
                      onClick={() => setProductViewMode('grid_compact')}
                      className={`p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                        productViewMode === 'grid_compact'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Cards Compactos (Grade)"
                    >
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">Grade Compacta</span>
                    </button>

                    <button
                      onClick={() => setProductViewMode('table')}
                      className={`p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                        productViewMode === 'table'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Tabela Detalhada (Linhas)"
                    >
                      <Table className="w-4 h-4" />
                      <span className="hidden sm:inline">Tabela (Linhas)</span>
                    </button>
                  </div>
                </div>

                {/* Department Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                  <button
                    onClick={() => setSelectedDeptFilter('all')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'all'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Todos os Produtos ({products.length})
                  </button>
                  <button
                    onClick={() => setSelectedDeptFilter('medicamentos')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'medicamentos'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Medicamentos ({products.filter((p) => p.category === 'medicamentos').length})
                  </button>
                  <button
                    onClick={() => setSelectedDeptFilter('perfumaria')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'perfumaria'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Perfumaria & Beleza ({products.filter((p) => p.category === 'perfumaria' || p.category === 'higiene').length})
                  </button>
                  <button
                    onClick={() => setSelectedDeptFilter('genericos')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'genericos'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Genéricos ({products.filter((p) => p.isGeneric).length})
                  </button>
                  <button
                    onClick={() => setSelectedDeptFilter('unpriced')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'unpriced'
                        ? 'bg-rose-700 text-white border-rose-700 font-extrabold shadow-xs'
                        : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                    }`}
                    title="Produtos cadastrados sem valor de preço de venda (Preço R$ 0,00)"
                  >
                    💰 Sem Precificação ({products.filter((p) => !p.price || p.price <= 0).length})
                  </button>
                  <button
                    onClick={() => setSelectedDeptFilter('incomplete')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'incomplete'
                        ? 'bg-amber-500 text-white border-amber-500 font-extrabold shadow-xs'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Produtos com dados incompletos (Falta MS/Isento, Foto, Descrição ou Preço)"
                  >
                    ⚠️ Informações Incompletas ({
                      products.filter((p) => {
                        const missingMs = !p.ms || (p.category === 'medicamentos' && p.ms !== 'ISENTO' && !/^\d+$/.test(p.ms.replace(/\D/g, '')));
                        const missingPrice = !p.price || p.price <= 0;
                        return missingMs || !p.image || !p.description || missingPrice;
                      }).length
                    })
                  </button>
                  <button
                    onClick={() => setSelectedDeptFilter('perfumaria_no_image')}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      selectedDeptFilter === 'perfumaria_no_image'
                        ? 'bg-purple-600 text-white border-purple-600 font-extrabold shadow-xs'
                        : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                    }`}
                    title="Itens de Perfumaria e Higiene sem foto de produto"
                  >
                    🖼️ Perfumaria sem Imagem ({
                      products.filter((p) => (p.category === 'perfumaria' || p.category === 'higiene') && !p.image).length
                    })
                  </button>
                </div>
              </div>

              {/* Batch Selection / Mass Edit Control Toolbar */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800 my-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectAllVisible(filteredProducts)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    {filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p.id)) ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        <span>Desmarcar Visíveis ({filteredProducts.length})</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 text-slate-400" />
                        <span>Selecionar Todos em Tela ({filteredProducts.length})</span>
                      </>
                    )}
                  </button>

                  {selectedProductIds.length > 0 && (
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedProductIds.length} selecionado(s)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedProductIds.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsMassEditOpen(true)}
                        className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer animate-pulse"
                      >
                        <Sliders className="w-4 h-4 text-amber-300" />
                        <span>⚡ EDIÇÃO & MANUTENÇÃO EM MASSA ({selectedProductIds.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 transition cursor-pointer"
                      >
                        Limpar
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                      💡 Marque os produtos para realizar edição rápida e manutenção em lote.
                    </span>
                  )}
                </div>
              </div>

              {/* RENDER MODE 1: CARDS GRANDES (DETALHADOS) */}
              {productViewMode === 'grid_large' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((prod) => {
                    const refPrice = prod.originalPrice || prod.pmcPrice;
                    const savings = refPrice && refPrice > prod.price ? refPrice - prod.price : 0;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-white rounded-3xl border transition flex flex-col justify-between overflow-hidden p-4 space-y-3 ${
                          selectedProductIds.includes(prod.id)
                            ? 'border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/10 shadow-md'
                            : 'border-slate-200 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div>
                          {/* Image Header & Badges */}
                          <div className="relative w-full h-40 bg-slate-50 rounded-2xl border border-slate-100 p-3 flex items-center justify-center mb-3">
                            {/* Selection Checkbox Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectProduct(prod.id);
                              }}
                              className={`absolute top-2 left-2 z-20 p-1.5 rounded-xl border transition shadow-xs flex items-center justify-center cursor-pointer ${
                                selectedProductIds.includes(prod.id)
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-white/90 backdrop-blur-xs text-slate-400 border-slate-300 hover:text-slate-800'
                              }`}
                              title={selectedProductIds.includes(prod.id) ? 'Desmarcar produto' : 'Selecionar para manutenção em massa'}
                            >
                              {selectedProductIds.includes(prod.id) ? (
                                <CheckSquare className="w-4 h-4 text-white" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <MedicineBoxSvg
                                prescriptionType={prod.prescriptionType}
                                isGeneric={prod.isGeneric}
                                name={prod.name}
                                category={prod.category}
                              />
                            )}

                            {/* Stock Badge Overlay */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {prod.stock <= 0 ? (
                                <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                                  Esgotado
                                </span>
                              ) : prod.stock <= 5 ? (
                                <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                                  Estoque Baixo ({prod.stock} un)
                                </span>
                              ) : (
                                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                                  Estoque: {prod.stock} un
                                </span>
                              )}
                            </div>

                            {/* Prescription Badge */}
                            {prod.prescriptionType && prod.prescriptionType !== 'none' && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-slate-900 text-rose-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-rose-800 shadow-xs flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-rose-400" />
                                  <span>Receita</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider block">
                              {prod.brand || prod.manufacturer || 'Laboratório'}
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                              {prod.name}
                            </h3>
                            {prod.activeIngredient && (
                              <p className="text-xs text-slate-500 font-medium truncate">
                                Ativo: {prod.activeIngredient}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                              <span>EAN: {prod.ean || 'S/ EAN'}</span>
                              <span>•</span>
                              <span className={!prod.ms ? 'text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded' : ''}>
                                MS: {prod.ms || '⚠️ Pendente'}
                              </span>
                            </div>

                            {/* Missing Fields Warning Tags */}
                            {(!prod.ms || !prod.image || !prod.description || !prod.price || prod.price <= 0) && (
                              <div className="flex flex-wrap gap-1 pt-1.5">
                                {(!prod.price || prod.price <= 0) && (
                                  <span className="text-[9px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-md">
                                    💰 Sem Precificação (R$ 0,00)
                                  </span>
                                )}
                                {!prod.ms && (
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md">
                                    ⚠️ Falta MS / Clicar ISENTO
                                  </span>
                                )}
                                {!prod.image && (
                                  <span className="text-[9px] font-bold text-purple-800 bg-purple-100 border border-purple-300 px-1.5 py-0.5 rounded-md">
                                    🖼️ Falta Imagem
                                  </span>
                                )}
                                {!prod.description && (
                                  <span className="text-[9px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded-md">
                                    📝 Falta Descrição Bula
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Stock Adjuster Footer */}
                        <div className="border-t border-slate-100 pt-3 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-xs text-slate-400 font-medium block">Preço de Venda</span>
                              {!prod.price || prod.price <= 0 ? (
                                <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-block">
                                  Sob Consulta (R$ 0,00)
                                </span>
                              ) : (
                                <span className="text-lg font-black text-slate-900">
                                  R$ {prod.price.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>

                            {savings > 0 && (
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 line-through block">
                                  PMC: R$ {refPrice?.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-xs font-bold text-emerald-600">
                                  Economia R$ {savings.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Stock Controls & Actions */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                              <button
                                onClick={() => handleAdjustStock(prod, -1)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold flex items-center justify-center transition shadow-xs"
                                title="Diminuir Estoque"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 font-mono font-bold text-xs text-slate-800">
                                {prod.stock} un
                              </span>
                              <button
                                onClick={() => handleAdjustStock(prod, 1)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 font-bold flex items-center justify-center transition shadow-xs"
                                title="Aumentar Estoque"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition font-bold text-xs flex items-center gap-1"
                                title="Editar Produto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProduct(prod.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                title="Excluir Produto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RENDER MODE 2: CARDS COMPACTOS (GRADE FLEX) */}
              {productViewMode === 'grid_compact' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className={`bg-white rounded-2xl border p-3 flex flex-col justify-between space-y-2 transition shadow-xs ${
                        selectedProductIds.includes(prod.id)
                          ? 'border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/10'
                          : 'border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      <div>
                        <div className="w-full h-24 bg-slate-50 rounded-xl p-2 flex items-center justify-center mb-2 relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectProduct(prod.id);
                            }}
                            className={`absolute top-1 left-1 z-20 p-1 rounded-lg border transition shadow-xs flex items-center justify-center cursor-pointer ${
                              selectedProductIds.includes(prod.id)
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-white/90 text-slate-400 border-slate-300 hover:text-slate-800'
                            }`}
                            title="Selecionar produto"
                          >
                            {selectedProductIds.includes(prod.id) ? (
                              <CheckSquare className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>

                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                          ) : (
                            <MedicineBoxSvg
                              prescriptionType={prod.prescriptionType}
                              isGeneric={prod.isGeneric}
                              name={prod.name}
                              category={prod.category}
                            />
                          )}
                          <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            {prod.stock} un
                          </span>
                        </div>

                        <span className="text-[9px] font-bold text-rose-600 uppercase block truncate">
                          {prod.brand || 'Geral'}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 truncate" title={prod.name}>
                          {prod.name}
                        </h4>
                        <span className="font-extrabold text-xs text-slate-900 block mt-0.5">
                          R$ {prod.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t pt-2 gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustStock(prod, -1)}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-bold text-[10px]"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustStock(prod, 1)}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-bold text-[10px]"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1 text-slate-500 hover:text-rose-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER MODE 3: TABELA DETALHADA (LINHAS) */}
              {productViewMode === 'table' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <th className="p-3 w-10 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectAllVisible(filteredProducts)}
                              className="text-slate-500 hover:text-emerald-600 cursor-pointer"
                              title="Selecionar / Desmarcar todos em tela"
                            >
                              {filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p.id)) ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </th>
                          <th className="p-3">Item</th>
                          <th className="p-3">Nome / Laboratório</th>
                          <th className="p-3">Ativo / EAN / Registro MS</th>
                          <th className="p-3">Preço / PMC</th>
                          <th className="p-3">Estoque</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((prod) => {
                          const refPrice = prod.originalPrice || prod.pmcPrice;
                          const savings = refPrice && refPrice > prod.price ? refPrice - prod.price : 0;
                          return (
                            <tr key={prod.id} className={`hover:bg-slate-50/80 transition ${selectedProductIds.includes(prod.id) ? 'bg-emerald-50/40' : ''}`}>
                              <td className="p-3 w-10 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectProduct(prod.id)}
                                  className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                                >
                                  {selectedProductIds.includes(prod.id) ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 w-14">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg p-1 flex items-center justify-center border border-slate-200">
                                  {prod.image ? (
                                    <img
                                      src={prod.image}
                                      alt={prod.name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <MedicineBoxSvg
                                      prescriptionType={prod.prescriptionType}
                                      isGeneric={prod.isGeneric}
                                      name={prod.name}
                                      category={prod.category}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-slate-900">
                                <span className="block font-bold">{prod.name}</span>
                                <span className="text-[10px] text-rose-600 uppercase font-bold">
                                  {prod.brand || prod.manufacturer || 'Marca Própria'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 text-xs">
                                <span className="block text-slate-800 font-medium">
                                  {prod.activeIngredient || 'Geral / MIP'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  EAN: {prod.ean || 'Não informado'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  MS: {prod.ms ? prod.ms : 'Sem Reg. MS'}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                <div>R$ {prod.price.toFixed(2).replace('.', ',')}</div>
                                {savings > 0 && (
                                  <div className="text-[10px] text-emerald-600 font-normal">
                                    PMC R$ {refPrice?.toFixed(2).replace('.', ',')}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleAdjustStock(prod, -1)}
                                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                                    title="Diminuir estoque em 1"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span
                                    className={`font-mono text-xs px-2 py-0.5 rounded ${
                                      prod.stock <= 5
                                        ? 'bg-red-100 text-red-700 font-bold'
                                        : 'bg-slate-100 text-slate-800 font-bold'
                                    }`}
                                  >
                                    {prod.stock} un
                                  </span>
                                  <button
                                    onClick={() => handleAdjustStock(prod, 1)}
                                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                                    title="Aumentar estoque em 1"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenEditProduct(prod)}
                                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                                    title="Editar produto"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteProduct(prod.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Excluir produto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORTATION VIA EXCEL / CSV / TXT & QUEUE CLASSIFICATION */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Importação em Massa via Excel / CSV ou Bloco de Notas (TXT)</h2>
                <p className="text-xs text-slate-500">
                  Importe listas de medicamentos por CSV/TXT e faça a conferência item a item para definir tarja, Registro MS e imagem.
                </p>
              </div>

              {/* Diagrams for Format Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Format 1: CSV / Excel Table */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Formato 1: Tabela Excel / CSV</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Sua planilha deve conter as colunas separadas por ponto e vírgula (;) no seguinte formato:
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto space-y-1">
                    <p className="text-emerald-400 font-bold">Coluna A: Nome do Remedio</p>
                    <p className="text-emerald-400 font-bold">Coluna B: EAN (Código de Barras)</p>
                    <p className="text-emerald-400 font-bold">Coluna C: Preço de Venda (R$)</p>
                    <p className="text-emerald-400 font-bold">Coluna D: Estoque Inicial</p>
                    <p className="text-emerald-400 font-bold">Coluna E: PMC (Preço de Tabela)</p>
                    <p className="text-emerald-400 font-bold">Coluna F: Princípio Ativo</p>
                  </div>
                </div>

                {/* Format 2: Notepad TXT */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <FileText className="w-5 h-5 text-rose-600" />
                    <span>Formato 2: Bloco de Notas (.txt)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Cada linha do arquivo de texto deve seguir a ordem com ponto e vírgula (;):
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto space-y-1">
                    <p className="text-amber-300">Dipirona 500mg;7891234567890;12.90;100;18.90;Dipirona Sódica</p>
                    <p className="text-amber-300">Paracetamol 750mg;7891234567891;14.50;80;19.90;Paracetamol</p>
                    <p className="text-amber-300">Perfume Rose;7891234567892;189.90;20;249.90;Boutique Rose</p>
                  </div>
                </div>
              </div>

              {/* Input Options: File Upload or Paste Text */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Carregar Arquivo CSV / TXT</span>
                  </button>

                  <button
                    onClick={() => {
                      const sample = `Dipirona Sódica 500mg 20 Comprimidos;7891234567891;12.90;80;18.90;Dipirona Sódica;Medley
Paracetamol 750mg 20 Comprimidos;7891234567890;14.50;100;19.90;Paracetamol;EMS
Perfume Eau de Parfum Rose 100ml;7891234567895;189.90;15;249.90;Fragrância;Boutique Rose`;
                      setImportText(sample);
                      handleParseImportText(sample);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span>Carregar Modelo de Exemplo</span>
                  </button>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1">
                    Ou cole o texto diretamente no formato abaixo:
                  </label>
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Nome do produto;EAN;Preço;Estoque;PMC;Princípio Ativo"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-600 font-mono text-xs"
                  />
                </div>

                <button
                  onClick={() => handleParseImportText(importText)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Processar e Carregar Fila de Conferência</span>
                </button>
              </div>

              {/* Post-Import Queue Item-by-Item Classifier */}
              {importedQueue.length > 0 && selectedQueueIdx !== null && (
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200 pb-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                        <span>Fila de Conferência de Cadastros ({selectedQueueIdx + 1} de {importedQueue.length})</span>
                      </h3>
                      <p className="text-xs text-amber-800">
                        Confira as informações importadas, ajuste preços/laboratórios ou salve todos em massa com um clique.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleImportAllQueue}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition shrink-0 active:scale-98"
                      title="Salva e importa todos os itens da fila preservando todos os campos carregados"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Importar Todos ({importedQueue.length}) em Massa</span>
                    </button>
                  </div>

                  {(() => {
                    const currentItem = importedQueue[selectedQueueIdx];
                    if (!currentItem) return null;

                    return (
                      <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="font-bold text-slate-700 block mb-1">Nome do Produto</label>
                            <input
                              type="text"
                              value={currentItem.name || ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                copy[selectedQueueIdx].name = e.target.value;
                                setImportedQueue(copy);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Código EAN (Barras)</label>
                            <input
                              type="text"
                              value={currentItem.ean || ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                copy[selectedQueueIdx].ean = e.target.value;
                                setImportedQueue(copy);
                              }}
                              placeholder="Opcional"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Price, Stock, PMC, Laboratory */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">
                              Preço de Venda (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentItem.price !== undefined ? currentItem.price : ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                const val = parseFloat(e.target.value);
                                copy[selectedQueueIdx].price = !isNaN(val) && val >= 0 ? val : 0;
                                setImportedQueue(copy);
                              }}
                              placeholder="0,00 (Sem Preço)"
                              className={`w-full border rounded-xl p-2 font-mono font-bold ${
                                !currentItem.price || currentItem.price <= 0
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-slate-50 border-slate-300 text-slate-900'
                              }`}
                            />
                            {(!currentItem.price || currentItem.price <= 0) && (
                              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                ⚠️ Item sem precificação
                              </span>
                            )}
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">PMC / Ref. (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentItem.pmcPrice !== undefined ? currentItem.pmcPrice : ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                const val = parseFloat(e.target.value);
                                copy[selectedQueueIdx].pmcPrice = !isNaN(val) ? val : 0;
                                setImportedQueue(copy);
                              }}
                              placeholder="Opcional"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Estoque Inicial</label>
                            <input
                              type="number"
                              min="0"
                              value={currentItem.stock !== undefined ? currentItem.stock : 0}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                const val = parseInt(e.target.value);
                                copy[selectedQueueIdx].stock = !isNaN(val) && val >= 0 ? val : 0;
                                setImportedQueue(copy);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Laboratório / Fabricante</label>
                            <input
                              type="text"
                              list="laboratories_list_import"
                              value={currentItem.manufacturer || currentItem.brand || ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                copy[selectedQueueIdx].manufacturer = e.target.value;
                                copy[selectedQueueIdx].brand = e.target.value;
                                setImportedQueue(copy);
                              }}
                              placeholder="Ex: Medley, EMS, Eurofarma"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                            />
                            <datalist id="laboratories_list_import">
                              {laboratories.map((lab, i) => (
                                <option key={i} value={lab} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Tipo de Prescrição / Tarja</label>
                            <select
                              value={currentItem.prescriptionType || 'none'}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                copy[selectedQueueIdx].prescriptionType = e.target.value as PrescriptionType;
                                if (e.target.value === 'none') {
                                  copy[selectedQueueIdx].category = 'perfumaria';
                                } else {
                                  copy[selectedQueueIdx].category = 'medicamentos';
                                }
                                setImportedQueue(copy);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold"
                            >
                              <option value="none">Perfumaria / MIP (Sem Tarja)</option>
                              <option value="red">Tarja Vermelha (Sob Prescrição)</option>
                              <option value="red_retention">Tarja Vermelha com Retenção de Receita</option>
                              <option value="black">Tarja Preta com Retenção de Receita</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Registro MS</label>
                            <input
                              type="text"
                              value={currentItem.ms || ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                copy[selectedQueueIdx].ms = e.target.value;
                                setImportedQueue(copy);
                              }}
                              placeholder="Ex: 1.0235.0142"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-900"
                            />
                            <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentItem.ms === 'ISENTO'}
                                onChange={(e) => {
                                  const copy = [...importedQueue];
                                  copy[selectedQueueIdx].ms = e.target.checked ? 'ISENTO' : '';
                                  setImportedQueue(copy);
                                }}
                                className="w-3.5 h-3.5 accent-rose-600 rounded"
                              />
                              <span className="text-[10px] text-slate-600 font-bold">Registro MS Isento / Cosmético</span>
                            </label>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Imagem em PNG/JPG ou Preset</label>
                            <input
                              type="text"
                              value={currentItem.image || ''}
                              onChange={(e) => {
                                const copy = [...importedQueue];
                                copy[selectedQueueIdx].image = e.target.value;
                                setImportedQueue(copy);
                              }}
                              placeholder="URL da imagem PNG/JPG"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                            />
                            <div className="flex gap-1 overflow-x-auto pt-1">
                              {perfumariaPresetImages.map((p, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const copy = [...importedQueue];
                                    copy[selectedQueueIdx].image = p.url;
                                    setImportedQueue(copy);
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-bold rounded border hover:bg-rose-50"
                                >
                                  + {p.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t">
                          <div className="text-slate-600 font-bold text-xs flex items-center gap-2">
                            <span>Preço:</span>
                            {!currentItem.price || currentItem.price <= 0 ? (
                              <span className="text-rose-600 font-black bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Sem Preço (R$ 0,00)
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-black">
                                R$ {currentItem.price.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                            <span className="text-slate-300">•</span>
                            <span>Estoque: {currentItem.stock || 0} un.</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveQueueItem(selectedQueueIdx, currentItem)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition"
                            >
                              <Check className="w-4 h-4" />
                              <span>Salvar Este Produto</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gerenciar Seções da Home</h2>
                  <p className="text-xs text-slate-500">
                    Crie e organize as seções de medicamentos, perfumaria e suplementos.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingCategory(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Seção</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                        style={{ backgroundColor: cat.color || '#dc2626' }}
                      >
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                        <p className="text-xs text-slate-500">{cat.description || 'Seção ativa'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LABORATORIES MANAGEMENT */}
          {activeTab === 'laboratories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Gestão de Laboratórios & Fabricantes ({laboratories.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Laboratórios cadastrados para seleção rápida no cadastro de produtos e pesquisa do cliente.
                  </p>
                </div>
              </div>

              {/* Add Lab Form */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newLabInput}
                  onChange={(e) => setNewLabInput(e.target.value)}
                  placeholder="Digite o nome do novo laboratório (ex: Eurofarma, Sanofi, Aché)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-rose-600 font-bold"
                />
                <button
                  onClick={() => {
                    if (newLabInput.trim()) {
                      handleAddLaboratory(newLabInput.trim());
                      setNewLabInput('');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 justify-center shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Laboratório</span>
                </button>
              </div>

              {/* Laboratories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {laboratories.map((lab, idx) => {
                  const labProductsCount = products.filter(
                    p => (p.laboratory && p.laboratory.toLowerCase() === lab.toLowerCase()) ||
                         (p.brand && p.brand.toLowerCase() === lab.toLowerCase()) ||
                         (p.manufacturer && p.manufacturer.toLowerCase() === lab.toLowerCase())
                  ).length;

                  return (
                    <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{lab}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {labProductsCount} produto(s)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = laboratories.filter(l => l !== lab);
                          setLaboratories(updated);
                          localStorage.setItem('pharma_laboratories', JSON.stringify(updated));
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Excluir laboratório"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS & EAN CHECK & GUIDED SEPARATION & ARCHIVE */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-rose-600" />
                    <span>Gestão Operacional de Pedidos ({orders.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fluxo prático: Visualizar → Bipar EANs → Confirmar ao Cliente → Imprimir Ficha Térmica.
                  </p>
                </div>

                {/* Sub-tabs: Active vs Archived */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    onClick={() => setOrdersTab('active')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      ordersTab === 'active'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Ativos em Andamento ({activeOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setOrdersTab('archived')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      ordersTab === 'archived'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                    <span>Arquivados / Concluídos ({archivedOrders.length})</span>
                  </button>
                </div>
              </div>

              {/* RENDER ACTIVE ORDERS TAB */}
              {ordersTab === 'active' && (
                <div className="space-y-4">
                  {activeOrders.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
                      <p className="font-bold text-slate-700">Nenhum pedido pendente ou em separação no momento.</p>
                      <p className="text-xs text-slate-400">
                        Todos os pedidos foram processados ou estão arquivados.
                      </p>
                    </div>
                  ) : (
                    activeOrders.map((order) => {
                      const verifiedCount = Object.keys(order.verifiedEanItems || {}).length;
                      const isAllVerified = verifiedCount >= order.items.length;

                      return (
                        <div
                          key={order.id}
                          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-rose-200 transition"
                        >
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-lg text-rose-600">
                                  Pedido #{order.id}
                                </span>
                                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  {order.deliveryType === 'delivery' ? (
                                    <>
                                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Entrega em Domicílio</span>
                                    </>
                                  ) : (
                                    <>
                                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Retirada na Loja</span>
                                    </>
                                  )}
                                </span>

                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 mt-1 font-medium">
                                Cliente: <strong className="text-slate-900">{order.userName}</strong> | Tel: <span className="font-mono font-bold text-slate-800">{order.userPhone || 'Não informado'}</span> ({order.userEmail})
                              </p>
                            </div>

                            {/* Action Tools Header */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Prescription Viewer Button */}
                              {order.prescriptionFile && (
                                <button
                                  onClick={() => {
                                    setViewingPrescriptionOrder(order);
                                    setPrescriptionZoom(1);
                                    setPrescriptionRotation(0);
                                  }}
                                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs"
                                >
                                  <Eye className="w-4 h-4 text-rose-600" />
                                  <span>Ver Receita Anexada</span>
                                </button>
                              )}

                              {/* Guided Separation Workflow Trigger */}
                              <button
                                onClick={() => {
                                  setGuidedSeparationOrder(order);
                                  setGuidedEanInput('');
                                  setGuidedFeedback(null);
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs ${
                                  isAllVerified
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-rose-600 text-white hover:bg-rose-700'
                                }`}
                              >
                                <Barcode className="w-4 h-4" />
                                <span>
                                  {isAllVerified ? '🟢 Separação EAN Concluída' : ` Bipar EANs (${verifiedCount}/${order.items.length})`}
                                </span>
                              </button>

                              {/* Thermal Printer Receipt */}
                              <button
                                onClick={() => setThermalPrintOrder(order)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                                title="Imprimir Cupom Térmico (58mm / 80mm)"
                              >
                                <Receipt className="w-4 h-4 text-emerald-400" />
                                <span>Cupom Térmico</span>
                              </button>

                              {/* Printable A4 Slip */}
                              <button
                                onClick={() => setPrintingOrder(order)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                                title="Imprimir Ficha de Separação A4"
                              >
                                <Printer className="w-4 h-4 text-slate-600" />
                                <span>Ficha A4</span>
                              </button>

                              {/* Status Dropdown */}
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  onUpdateOrderStatus(order.id, e.target.value as Order['status'])
                                }
                                className="bg-slate-900 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none border border-slate-700"
                              >
                                <option value="pending">⏳ Pendente</option>
                                <option value="confirmed">✅ Confirmado</option>
                                <option value="separating">📦 Em Separação</option>
                                <option value="ready">🚀 Pronto p/ Saída</option>
                                <option value="out_for_delivery">🛵 Em Rota</option>
                                <option value="delivered">🏁 Entregue</option>
                                <option value="cancelled">❌ Cancelado</option>
                              </select>
                            </div>
                          </div>

                          {/* Payment & Cash Change Information Box */}
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">Forma de Pagamento: </span>
                              <strong className="text-slate-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                {order.paymentMethod === 'pix'
                                  ? '⚡ PIX na Entrega (QR Code)'
                                  : order.paymentMethod === 'card'
                                  ? '💳 Cartão na Entrega (Maquininha)'
                                  : '💵 Dinheiro na Entrega'}
                              </strong>
                              {order.paymentMethod === 'cash' && (
                                <span className="font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                                  <Banknote className="w-4 h-4 text-amber-700" />
                                  <span>
                                    {order.cashBanknote
                                      ? `Nota: R$ ${order.cashBanknote.toFixed(2).replace('.', ',')} → TROCO: R$ ${(order.calculatedChange || 0).toFixed(2).replace('.', ',')}`
                                      : order.changeAmount || 'Sem necessidade de troco'}
                                  </span>
                                </span>
                              )}
                            </div>

                            {order.deliveryType === 'delivery' && (
                              <div className="text-slate-600 text-xs">
                                📍 Endereço: <strong>
                                  {typeof order.deliveryAddress === 'string' 
                                    ? order.deliveryAddress 
                                    : (order.deliveryAddress 
                                        ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.number || ''} ${order.deliveryAddress.neighborhood || ''}`
                                        : (order.address 
                                            ? `${order.address.street || ''}, ${order.address.number || ''} ${order.address.neighborhood || ''}` 
                                            : 'Endereço cadastrado no app'))}
                                </strong>
                              </div>
                            )}
                          </div>

                          {/* Order Items List WITH THUMBNAILS & VERIFIED BADGES */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {order.items.map((item, idx) => {
                              const isItemVerified = order.verifiedEanItems?.[item.product.id];
                              return (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-2xl border flex items-center gap-3 transition ${
                                    isItemVerified
                                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 shrink-0 flex items-center justify-center">
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
                                        category={item.product.category}
                                      />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <span className="font-extrabold text-xs block truncate text-slate-900">
                                      {item.quantity}x {item.product.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono block">
                                      EAN: {item.product.ean || '789...'} | Preço un: R$ {item.price.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>

                                  {isItemVerified ? (
                                    <span className="text-emerald-800 font-extrabold text-[10px] bg-emerald-200 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border border-emerald-300">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>CONFERIDO</span>
                                    </span>
                                  ) : (
                                    <span className="text-amber-800 font-bold text-[10px] bg-amber-100 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
                                      PENDENTE
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer Total & Direct Confirmation Buttons */}
                          <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-slate-100">
                            <div>
                              <span className="text-xs text-slate-500 font-medium">Total Pago pelo Cliente: </span>
                              <strong className="text-rose-600 font-black text-base ml-1">
                                R$ {order.total.toFixed(2).replace('.', ',')}
                              </strong>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'delivered', 'customer')}
                                className="flex-1 sm:flex-none bg-emerald-600 text-white hover:bg-emerald-700 px-3.5 py-2 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Confirmar Entrega Cliente</span>
                              </button>
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'delivered', 'driver')}
                                className="flex-1 sm:flex-none bg-blue-600 text-white hover:bg-blue-700 px-3.5 py-2 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-1"
                              >
                                <Truck className="w-4 h-4" />
                                <span>Entregue p/ Motoboy</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* RENDER ARCHIVED ORDERS TAB (DELIVERED / CANCELLED / >24h) */}
              {ordersTab === 'archived' && (
                <div className="space-y-4">
                  {archivedOrders.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                      Nenhum pedido arquivado até o momento.
                    </div>
                  ) : (
                    archivedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 opacity-90 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700">Pedido #{order.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}
                            >
                              {order.status === 'delivered' ? '🏁 Entregue & Concluído' : '❌ Cancelado / Automático +24h'}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600">
                          <span>Cliente: <strong>{order.userName}</strong> ({order.userEmail})</span>
                          <span className="font-bold font-mono text-slate-900">Total: R$ {order.total.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STORE SETTINGS & ANNOUNCEMENTS NOTIFICATION EDITOR */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-xs sm:text-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Editor de Notificações, Frases & Marca</h2>
                <p className="text-xs text-slate-500">
                  Gerencie as mensagens do banner de ofertas no topo do app, nome da farmácia e parâmetros operacionais.
                </p>
              </div>

              {/* Offer Announcements List Editor (Fully Editable by Admin) */}
              <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-950 text-xs">
                  <Tag className="w-4 h-4 text-rose-600" />
                  <span>Mensagens de Oferta no Banner Superior (Editar / Adicionar / Remover)</span>
                </div>

                <div className="space-y-2">
                  {(settingsForm.offerAnnouncements || []).map((msg, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-rose-200 text-xs font-semibold text-slate-800">
                      <span>{msg}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnnouncement(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                        title="Remover frase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newAnnouncementInput}
                    onChange={(e) => setNewAnnouncementInput(e.target.value)}
                    placeholder="Nova frase de oferta (ex: Desconto de 20% em Dermo)"
                    className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddAnnouncement}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Frase</span>
                  </button>
                </div>
              </div>

              {/* Logo Preview & Size Adjustment */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 block flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-600" />
                  <span>Logo da Loja & Ajuste de Visualização</span>
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center min-w-[80px]">
                    <img
                      src={settingsForm.appLogo}
                      alt="Logo Preview"
                      style={{ height: `${settingsForm.logoSize}px` }}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">URL da Imagem da Logo</label>
                      <input
                        type="text"
                        value={settingsForm.appLogo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, appLogo: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 outline-none focus:border-rose-600 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Ajustar Tamanho da Logo: {settingsForm.logoSize}px
                      </label>
                      <input
                        type="range"
                        min="24"
                        max="80"
                        value={settingsForm.logoSize}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoSize: parseInt(e.target.value) })}
                        className="w-full accent-rose-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Phrases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome da Farmácia</label>
                  <input
                    type="text"
                    value={settingsForm.appName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtítulo / Slogan</label>
                  <input
                    type="text"
                    value={settingsForm.appSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, appSubtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Título do Banner Promocional</label>
                  <input
                    type="text"
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtítulo do Banner Promocional</label>
                  <input
                    type="text"
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Delivery Fees Configuration */}
              <div className="grid grid-cols-2 gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <div>
                  <label className="font-bold text-rose-900 block mb-1">Taxa de Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={settingsForm.deliveryFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-rose-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-mono font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-rose-900 block mb-1">Taxa de Retirada na Loja (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={settingsForm.pickupFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, pickupFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-rose-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Stock Visibility Control */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-rose-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">Exibir Quantidade de Estoque aos Clientes</h4>
                    <p className="text-xs text-slate-500">Se desativado, a quantidade em estoque fica visível apenas no painel admin</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.showStockToCustomer ?? false}
                  onChange={(e) => setSettingsForm({ ...settingsForm, showStockToCustomer: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              {/* Admin Panel Security / Password Management */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center shadow-md">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>Segurança & Senha do Painel Administrativo</span>
                      <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Acesso Restrito
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Defina o usuário e a senha de segurança para acesso ao painel de controle.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      Usuário Administrador
                    </label>
                    <input
                      type="text"
                      value={settingsForm.adminUsername || 'admin'}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminUsername: e.target.value })}
                      placeholder="Ex: admin"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      Senha de Acesso ao Painel Admin
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        value={settingsForm.adminPassword || 'admin123'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                        placeholder="Digite a nova senha de segurança"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-rose-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(!showAdminPass)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 transition cursor-pointer"
                        title={showAdminPass ? 'Ocultar Senha' : 'Exibir Senha'}
                      >
                        {showAdminPass ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Ao salvar, as novas credenciais serão exigidas no próximo login de administrador.</span>
                </p>
              </div>

              {/* Splash Screen Simulation Trigger Button */}
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-rose-950 flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-rose-600 fill-rose-600" />
                      <span>Simular Animação de Entrada (Splash Screen)</span>
                    </h4>
                    <p className="text-[11px] text-rose-800">
                      Visualize como o cliente verá a logo, o nome e o slogan ao abrir o aplicativo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSplashPreview(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Testar Animação</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Salvar Configurações da Farmácia</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* EAN CHECK MODAL */}
      {eanOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-6 h-6 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">Conferência de EAN #{eanOrderModal.id}</h3>
              </div>
              <button onClick={() => setEanOrderModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckEanSubmit} className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Digite ou escaneie o código de barras (EAN) do produto:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={eanInput}
                  onChange={(e) => setEanInput(e.target.value)}
                  placeholder="Ex: 7891234567890"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono outline-none focus:border-rose-600"
                />
                <button
                  type="submit"
                  className="bg-rose-600 text-white font-bold px-4 rounded-xl hover:bg-rose-700"
                >
                  Conferir
                </button>
              </div>

              {eanMessage && (
                <p className={`text-xs font-bold p-2 rounded-xl ${eanMessage.includes('sucesso') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                  {eanMessage}
                </p>
              )}
            </form>

            <div className="border-t pt-3 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Itens deste pedido:</span>
              {eanOrderModal.items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border">
                  <div>
                    <span className="font-bold">{i.product.name}</span>
                    <span className="block text-[10px] font-mono text-slate-500">EAN: {i.product.ean}</span>
                  </div>
                  {eanOrderModal.verifiedEanItems?.[i.product.id] ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">Conferido</span>
                  ) : (
                    <button
                      onClick={() => {
                        onVerifyOrderEan(eanOrderModal.id, i.product.id);
                        soundManager.playBeepSuccess();
                      }}
                      className="bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold px-2 py-0.5 rounded-lg text-[10px]"
                    >
                      Marcar OK
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isCreatingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs sm:text-sm"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingProduct(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Autodidactic Medicine Database Selector */}
            <div className="bg-gradient-to-r from-blue-50 to-rose-50 p-3 rounded-2xl border border-blue-200/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Preenchimento Inteligente (Banco Didático de Medicamentos)</span>
                </span>
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAutodidacticSelect(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-white border border-blue-300 rounded-xl p-2 outline-none text-xs font-bold text-slate-800 focus:border-blue-600"
              >
                <option value="">✨ Selecione um medicamento para autopreencher todos os dados...</option>
                {DIDACTIC_MEDICINES.map((m) => (
                  <option key={m.idName} value={m.idName}>
                    {m.name} ({m.laboratory})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Dipirona Sódica 500mg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratório / Fabricante</label>
                <div className="space-y-1">
                  <select
                    value={productForm.laboratory || productForm.brand || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        laboratory: e.target.value,
                        brand: e.target.value,
                        manufacturer: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-bold"
                  >
                    <option value="">Selecione um laboratório registrado...</option>
                    {laboratories.map((lab) => (
                      <option key={lab} value={lab}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seção / Categoria</label>
                <select
                  value={productForm.category || 'medicamentos'}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tarja / Prescrição *</label>
                <select
                  value={productForm.prescriptionType || 'none'}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      prescriptionType: e.target.value as PrescriptionType,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-bold"
                >
                  <option value="none">Isento / Livre (MIP)</option>
                  <option value="red">Tarja Vermelha (Sob Prescrição)</option>
                  <option value="red_retention">Tarja Vermelha com Retenção</option>
                  <option value="black">Tarja Preta (Controle Especial)</option>
                </select>
              </div>
            </div>

            {/* Checkbox for Oferta Exclusiva (DEFAULT UNCHECKED) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-extrabold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={productForm.isOffer ?? false}
                    onChange={(e) => setProductForm({ ...productForm, isOffer: e.target.checked })}
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                  <span>Este produto está em Oferta Exclusiva?</span>
                </label>
                {productForm.isOffer && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    MODO OFERTA ATIVO
                  </span>
                )}
              </div>

              {/* Offer Exclusivity Duration & Tag settings */}
              {productForm.isOffer && (
                <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 space-y-2.5">
                  <div>
                    <label className="block font-bold text-rose-950 text-xs mb-1">
                      Regra de Duração da Oferta
                    </label>
                    <select
                      value={productForm.offerDurationType || 'stock_or_time'}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          offerDurationType: e.target.value as any,
                        })
                      }
                      className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs font-bold text-rose-900 outline-none"
                    >
                      <option value="stock_or_time">
                        Enquanto durar o estoque ou o tempo limite (o que terminar primeiro)
                      </option>
                      <option value="time_only">Por tempo determinado (data/hora limite)</option>
                      <option value="stock_only">Apenas enquanto durar o estoque</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-rose-950 text-xs mb-1">
                        Data Inicial da Oferta
                      </label>
                      <input
                        type="date"
                        value={productForm.offerStartDate || ''}
                        onChange={(e) =>
                          setProductForm({ ...productForm, offerStartDate: e.target.value })
                        }
                        className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs outline-none text-slate-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-rose-950 text-xs mb-1">
                        Data Final da Oferta (Término)
                      </label>
                      <input
                        type="date"
                        value={productForm.offerEndDate || ''}
                        onChange={(e) =>
                          setProductForm({ ...productForm, offerEndDate: e.target.value })
                        }
                        className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs outline-none text-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-rose-950 text-xs mb-1">
                        Texto de Validade da Oferta
                      </label>
                      <input
                        type="text"
                        value={productForm.offerDurationText || ''}
                        onChange={(e) =>
                          setProductForm({ ...productForm, offerDurationText: e.target.value })
                        }
                        placeholder="Ex: Válido até 48h ou estoque"
                        className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-rose-950 text-xs mb-1">
                        Selo da Oferta (Badge)
                      </label>
                      <input
                        type="text"
                        value={productForm.offerTag || ''}
                        onChange={(e) => setProductForm({ ...productForm, offerTag: e.target.value })}
                        placeholder="Ex: 50% OFF no 2º item"
                        className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Section (Dynamic based on isOffer) */}
            <div className={`p-3 rounded-2xl border space-y-2 ${
              productForm.isOffer ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="font-extrabold text-slate-800 block text-xs">
                {productForm.isOffer ? 'Valores da Oferta Promocional' : 'Preço Normal da Farmácia & PMC'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {productForm.isOffer ? 'Preço em Oferta (R$) *' : 'Preço da Farmácia (R$) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price || ''}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none font-mono font-black text-rose-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {productForm.isOffer ? 'Preço De / Normal (R$)' : 'PMC (Preço Máx Consumidor)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.pmcPrice || productForm.originalPrice || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        pmcPrice: parseFloat(e.target.value) || undefined,
                        originalPrice: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Ex: 24.90"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock ?? 50}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none font-mono font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Princípio Ativo</label>
                <input
                  type="text"
                  value={productForm.activeIngredient || ''}
                  onChange={(e) => setProductForm({ ...productForm, activeIngredient: e.target.value })}
                  placeholder="Ex: Paracetamol, Ibuprofeno"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Código EAN Principal</label>
                <input
                  type="text"
                  value={productForm.ean || ''}
                  onChange={(e) => setProductForm({ ...productForm, ean: e.target.value })}
                  placeholder="Ex: 7891234567890"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-mono text-xs"
                />
              </div>
            </div>

            {/* Additional EANs */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">EANs Secundários / Vinculados (separados por vírgula)</label>
              <input
                type="text"
                value={additionalEansInput}
                onChange={(e) => setAdditionalEansInput(e.target.value)}
                placeholder="Ex: 7896070601235, 7896070601236"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-mono text-xs"
              />
            </div>

            {/* MS Registration with ISENTO button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 text-xs">Registro Ministério da Saúde (MS)</label>
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, ms: 'ISENTO' })}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black rounded-lg text-[10px] border border-amber-300 transition"
                >
                  Marcar como ISENTO de MS
                </button>
              </div>
              <input
                type="text"
                value={productForm.ms || ''}
                onChange={(e) => setProductForm({ ...productForm, ms: e.target.value })}
                placeholder="Ex: 1.0235.0142.001-2 ou ISENTO"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 font-mono text-xs font-bold"
              />
            </div>

            {/* Image Upload & Presets */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-800 text-xs">Imagem do Produto (Upload ou URL)</label>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProductForm((prev) => ({ ...prev, image: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer"
                />
              </div>

              <input
                type="text"
                value={productForm.image || ''}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                placeholder="Ou cole o link direto da URL da imagem..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-none focus:border-rose-600 text-xs"
              />

              <div className="flex gap-2 overflow-x-auto pb-1">
                {perfumariaPresetImages.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProductForm({ ...productForm, image: p.url })}
                    className="px-2 py-1 bg-white hover:bg-rose-50 text-[10px] font-bold rounded-lg border border-slate-200 shrink-0"
                  >
                    + Preset {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-xs">
                <input
                  type="checkbox"
                  checked={productForm.isGeneric ?? false}
                  onChange={(e) =>
                    setProductForm({ ...productForm, isGeneric: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Medicamento Genérico (G)</span>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 text-xs">Descrição do Produto</label>
                <button
                  type="button"
                  onClick={handleGenerateAutoDescription}
                  className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-lg text-[10px] shadow-xs flex items-center gap-1 transition active:scale-95"
                  title="Gerar texto de bula/descrição farmacêutica completo baseado nos dados do produto"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Gerar Descrição Automática por IA</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={productForm.description || ''}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Indicações, modo de usar, posologia..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600 text-xs font-medium leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingProduct(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md text-xs"
              >
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isMassEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-rose-600" />
                  <span>Manutenção & Edição em Massa de Produtos</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Alteração rápida de características para{' '}
                  <strong className="text-rose-600 font-extrabold">{selectedProductIds.length} produto(s) selecionado(s)</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMassEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mass Edit Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 font-extrabold text-xs">
              <button
                type="button"
                onClick={() => setMassEditTab('prices')}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  massEditTab === 'prices'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Preços</span>
              </button>

              <button
                type="button"
                onClick={() => setMassEditTab('offers')}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  massEditTab === 'offers'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Ofertas & Validades</span>
              </button>

              <button
                type="button"
                onClick={() => setMassEditTab('stock')}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  massEditTab === 'stock'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Estoque</span>
              </button>

              <button
                type="button"
                onClick={() => setMassEditTab('lab')}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  massEditTab === 'lab'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Laboratório</span>
              </button>

              <button
                type="button"
                onClick={() => setMassEditTab('category')}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  massEditTab === 'category'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Categoria / Receita</span>
              </button>

              <button
                type="button"
                onClick={() => setMassEditTab('status')}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  massEditTab === 'status'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ativação & Exclusão</span>
              </button>
            </div>

            {/* TAB 1: PRICES */}
            {massEditTab === 'prices' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 font-medium">
                  💡 Atualize os preços de venda de todos os <strong>{selectedProductIds.length}</strong> produtos selecionados de uma só vez.
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-slate-800 block">Tipo de Reajuste</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massPriceType === 'fixed' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massPriceType"
                        checked={massPriceType === 'fixed'}
                        onChange={() => setMassPriceType('fixed')}
                        className="accent-rose-600"
                      />
                      <span>Fixar Preço Único (R$)</span>
                    </label>

                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massPriceType === 'discount_percent' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massPriceType"
                        checked={massPriceType === 'discount_percent'}
                        onChange={() => setMassPriceType('discount_percent')}
                        className="accent-rose-600"
                      />
                      <span>Desconto Percentual (%)</span>
                    </label>

                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massPriceType === 'increase_percent' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massPriceType"
                        checked={massPriceType === 'increase_percent'}
                        onChange={() => setMassPriceType('increase_percent')}
                        className="accent-rose-600"
                      />
                      <span>Aumento Percentual (%)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    {massPriceType === 'fixed' ? 'Valor do Preço Final (R$)' : 'Percentual (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={massPriceValue}
                    onChange={(e) => setMassPriceValue(e.target.value)}
                    placeholder={massPriceType === 'fixed' ? 'Ex: 19.90' : 'Ex: 10'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-600 font-mono font-black text-rose-600 text-base"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyMassPrice}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Aplicar Reajuste de Preço ({selectedProductIds.length} Itens)</span>
                </button>
              </div>
            )}

            {/* TAB 2: OFFERS & DATES */}
            {massEditTab === 'offers' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-950 font-medium">
                  🔥 Configure ou encerre ofertas promocionais e defina a <strong>duração/validade por datas</strong>. As ofertas são desativadas automaticamente após expirar a data limite ou se o estoque zerar.
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-slate-800 block">Ação para Oferta</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massOfferAction === 'enable' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massOfferAction"
                        checked={massOfferAction === 'enable'}
                        onChange={() => setMassOfferAction('enable')}
                        className="accent-rose-600"
                      />
                      <span>Marcar como Oferta Promocional</span>
                    </label>

                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massOfferAction === 'dates_only' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massOfferAction"
                        checked={massOfferAction === 'dates_only'}
                        onChange={() => setMassOfferAction('dates_only')}
                        className="accent-rose-600"
                      />
                      <span>Atualizar Apenas Datas de Validade</span>
                    </label>

                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massOfferAction === 'disable' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massOfferAction"
                        checked={massOfferAction === 'disable'}
                        onChange={() => setMassOfferAction('disable')}
                        className="accent-rose-600"
                      />
                      <span>Remover da Oferta</span>
                    </label>
                  </div>
                </div>

                {massOfferAction !== 'disable' && (
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Selo da Oferta / Badge (Opcional)
                      </label>
                      <input
                        type="text"
                        value={massOfferTag}
                        onChange={(e) => setMassOfferTag(e.target.value)}
                        placeholder="Ex: OFERTA DA SEMANA / LEVE 3 PAGUE 2"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">
                          Data de Início da Oferta
                        </label>
                        <input
                          type="date"
                          value={massOfferStartDate}
                          onChange={(e) => setMassOfferStartDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1">
                          Data de Término (Expira em)
                        </label>
                        <input
                          type="date"
                          value={massOfferEndDate}
                          onChange={(e) => setMassOfferEndDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApplyMassOffer}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Aplicar Configuração de Oferta ({selectedProductIds.length} Itens)</span>
                </button>
              </div>
            )}

            {/* TAB 3: STOCK */}
            {massEditTab === 'stock' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-slate-800 font-medium">
                  📦 Atualize rapidamente a quantidade em estoque para os <strong>{selectedProductIds.length}</strong> produtos selecionados.
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-slate-800 block">Operação de Estoque</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massStockType === 'fixed' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massStockType"
                        checked={massStockType === 'fixed'}
                        onChange={() => setMassStockType('fixed')}
                        className="accent-rose-600"
                      />
                      <span>Fixar Quantidade Exata</span>
                    </label>

                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massStockType === 'add' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massStockType"
                        checked={massStockType === 'add'}
                        onChange={() => setMassStockType('add')}
                        className="accent-rose-600"
                      />
                      <span>Adicionar (+ Quantidade)</span>
                    </label>

                    <label className={`p-3 rounded-2xl border cursor-pointer font-bold flex items-center gap-2 ${
                      massStockType === 'subtract' ? 'bg-rose-50 border-rose-600 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="massStockType"
                        checked={massStockType === 'subtract'}
                        onChange={() => setMassStockType('subtract')}
                        className="accent-rose-600"
                      />
                      <span>Subtrair (- Quantidade)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    Quantidade de Unidades
                  </label>
                  <input
                    type="number"
                    value={massStockValue}
                    onChange={(e) => setMassStockValue(e.target.value)}
                    placeholder="Ex: 20"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-600 font-mono font-black text-slate-900 text-base"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyMassStock}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Atualizar Estoque ({selectedProductIds.length} Itens)</span>
                </button>
              </div>
            )}

            {/* TAB 4: LABORATORY */}
            {massEditTab === 'lab' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-slate-800 font-medium">
                  🏢 Atribua ou normalize o laboratório/fabricante em massa. Se o laboratório for novo, será cadastrado e assimilado automaticamente.
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    Nome do Laboratório / Fabricante
                  </label>
                  <input
                    type="text"
                    value={massLab}
                    onChange={(e) => setMassLab(e.target.value)}
                    placeholder="Ex: Eurofarma, Medley, EMS, Neo Química..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-600 font-bold text-slate-900 text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {laboratories.slice(0, 8).map((lab) => (
                      <button
                        type="button"
                        key={lab}
                        onClick={() => setMassLab(lab)}
                        className="text-[10px] bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-bold px-2 py-1 rounded-lg border border-slate-200"
                      >
                        + {lab}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyMassLab}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Atribuir Laboratório ({selectedProductIds.length} Itens)</span>
                </button>
              </div>
            )}

            {/* TAB 5: CATEGORY & CLASSIFICATION */}
            {massEditTab === 'category' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-slate-800 font-medium">
                  🏷️ Altere a seção, tipo de retenção de receita ou status de genérico para os <strong>{selectedProductIds.length}</strong> produtos.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Mudar Seção / Categoria</label>
                    <select
                      value={massCategory}
                      onChange={(e) => setMassCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="">(Não alterar categoria)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Tipo de Receita / Tarja</label>
                    <select
                      value={massPrescription}
                      onChange={(e) => setMassPrescription(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="">(Não alterar receita)</option>
                      <option value="none">Isento de Prescrição / MIP</option>
                      <option value="red">Tarja Vermelha (Sem retenção)</option>
                      <option value="red_retention">Tarja Vermelha (Com Retenção de Receita)</option>
                      <option value="black">Tarja Preta (Retenção Especial)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Medicamento Genérico (G)</label>
                  <select
                    value={massGeneric}
                    onChange={(e) => setMassGeneric(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none font-bold"
                  >
                    <option value="">(Não alterar status de genérico)</option>
                    <option value="yes">Marcar como Medicamento Genérico (G)</option>
                    <option value="no">Desmarcar Genérico</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApplyMassCategory}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Atualizar Classificação ({selectedProductIds.length} Itens)</span>
                </button>
              </div>
            )}

            {/* TAB 6: STATUS & DELETE */}
            {massEditTab === 'status' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-slate-800 font-medium">
                  🟢 Ative, desative ou exclua em lote os <strong>{selectedProductIds.length}</strong> produtos selecionados.
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleMassToggleStatus(true)}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Ativar Todos no App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMassToggleStatus(false)}
                    className="py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>Ocultar / Desativar</span>
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={handleMassDelete}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Excluir Definitivamente os {selectedProductIds.length} Produtos</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs sm:text-sm"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Nova Seção / Categoria</h3>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome da Seção *</label>
              <input
                type="text"
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Ex: Dermocosméticos, Higiene..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Descrição Curta</label>
              <input
                type="text"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Ex: Cuidados com a pele e protetores"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-600"
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
              >
                Criar Seção
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRESCRIPTION VIEWER & VALIDATOR MODAL */}
      {viewingPrescriptionOrder && viewingPrescriptionOrder.prescriptionFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-6 h-6 text-rose-500" />
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Receita Médica - Pedido #{viewingPrescriptionOrder.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cliente: <strong>{viewingPrescriptionOrder.userName}</strong> ({viewingPrescriptionOrder.userEmail}) • {viewingPrescriptionOrder.prescriptionFile.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPrescriptionOrder(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrescriptionZoom((z) => Math.min(z + 0.25, 3))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1 transition"
                  title="Aumentar Zoom (+25%)"
                >
                  <ZoomIn className="w-4 h-4 text-rose-400" />
                  <span>Zoom +</span>
                </button>
                <button
                  onClick={() => setPrescriptionZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1 transition"
                  title="Diminuir Zoom (-25%)"
                >
                  <ZoomOut className="w-4 h-4 text-rose-400" />
                  <span>Zoom -</span>
                </button>
                <button
                  onClick={() => setPrescriptionRotation((r) => (r + 90) % 360)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1 transition"
                  title="Rotacionar 90°"
                >
                  <RotateCw className="w-4 h-4 text-rose-400" />
                  <span>Girar 90°</span>
                </button>
                <button
                  onClick={() => {
                    setPrescriptionZoom(1);
                    setPrescriptionRotation(0);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-medium transition"
                >
                  Resetar
                </button>
                <span className="text-slate-400 font-mono text-[11px] ml-1">
                  {(prescriptionZoom * 100).toFixed(0)}% | {prescriptionRotation}°
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={viewingPrescriptionOrder.prescriptionFile.dataUrl}
                  download={viewingPrescriptionOrder.prescriptionFile.fileName || `Receita_Pedido_${viewingPrescriptionOrder.id}`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Baixar Arquivo</span>
                </a>

                {/* ITI Official Digital Prescription Validator Link */}
                <a
                  href="https://validar.iti.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Validar Assinatura no ITI (gov.br)</span>
                </a>
              </div>
            </div>

            {/* Content Display Area */}
            <div className="flex-1 p-4 bg-slate-950 overflow-auto flex items-center justify-center min-h-[400px]">
              {viewingPrescriptionOrder.prescriptionFile.fileType?.includes('pdf') || viewingPrescriptionOrder.prescriptionFile.dataUrl.startsWith('data:application/pdf') ? (
                <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center gap-3">
                  <iframe
                    src={viewingPrescriptionOrder.prescriptionFile.dataUrl}
                    className="w-full h-[550px] rounded-2xl border border-slate-700 bg-white"
                    title="PDF da Receita Médica"
                  />
                  <p className="text-xs text-slate-400">
                    Se o navegador bloquear a visualização do PDF no quadro, utilize o botão "Baixar Arquivo" acima.
                  </p>
                </div>
              ) : (
                <div className="transition-transform duration-200 ease-out p-4">
                  <img
                    src={viewingPrescriptionOrder.prescriptionFile.dataUrl}
                    alt="Receita Médica Enviada pelo Cliente"
                    style={{
                      transform: `scale(${prescriptionZoom}) rotate(${prescriptionRotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Verifique legibilidade, CRM do médico emissor e validade da prescrição conforme normas da ANVISA.
              </span>
              <button
                onClick={() => setViewingPrescriptionOrder(null)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                Concluir Análise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE ORDER DISPATCH SLIP MODAL (FICHA DE SEPARAÇÃO E ENTREGA) */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 text-slate-900 shadow-2xl max-h-[95vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:shadow-none print:rounded-none">
            {/* Non-printable Action Bar */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-6 h-6 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Ficha de Separação & Guia de Entrega #{printingOrder.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha (PDF/Impressora)</span>
                </button>
                <button
                  onClick={() => setPrintingOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Content */}
            <div className="space-y-4 text-xs font-sans text-slate-900 p-2 border-2 border-slate-900 rounded-2xl print:border-none print:p-0">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wide text-slate-950">
                    {settings.appName || 'PharmaOnline'}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">{settings.appSubtitle || 'Farmácia & Drogaria Digital'}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Contato/WhatsApp: {settings.storePhone || '(11) 99999-8888'}</p>
                </div>
                <div className="text-right">
                  <div className="bg-slate-900 text-white font-black text-sm px-3 py-1 rounded-lg font-mono inline-block">
                    PEDIDO #{printingOrder.id}
                  </div>
                  <p className="text-[10px] text-slate-600 font-semibold mt-1">
                    Emissão: {new Date(printingOrder.createdAt).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-rose-700">
                    {printingOrder.deliveryType === 'delivery' ? '🚚 ENTREGA A DOMICÍLIO' : '🏬 RETIRADA NA LOJA'}
                  </p>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Dados do Cliente</span>
                  <p className="font-extrabold text-slate-900 text-sm">{printingOrder.userName}</p>
                  <p className="font-mono text-slate-700 font-semibold">Telefone: {printingOrder.customerPhone || 'Não informado'}</p>
                  <p className="text-slate-600 text-[11px]">E-mail: {printingOrder.userEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Endereço de Entrega / Destino</span>
                  {printingOrder.deliveryType === 'delivery' && printingOrder.address ? (
                    <div className="text-slate-900 font-medium leading-tight">
                      <p className="font-bold">{printingOrder.address.street}, Nº {printingOrder.address.number}</p>
                      {printingOrder.address.complement && <p className="text-[11px] italic">Comp: {printingOrder.address.complement}</p>}
                      <p className="text-[11px]">Bairro: {printingOrder.address.neighborhood} - {printingOrder.address.city}/{printingOrder.address.state}</p>
                      <p className="text-[10px] font-mono text-slate-600">CEP: {printingOrder.address.cep}</p>
                    </div>
                  ) : (
                    <p className="font-bold text-emerald-800 bg-emerald-100 p-2 rounded-lg text-center mt-1">
                      RETIRADA PRESENCIAL NO BALCÃO DA LOJA
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items Separation Table */}
              <div>
                <span className="text-[11px] font-black uppercase text-slate-800 block mb-1">
                  Itens para Conferência e Separação de Estoque ({printingOrder.items.length} itens)
                </span>
                <table className="w-full text-left border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                      <th className="p-2 border border-slate-800">Qtd</th>
                      <th className="p-2 border border-slate-800">EAN / Código</th>
                      <th className="p-2 border border-slate-800">Medicamento / Produto</th>
                      <th className="p-2 border border-slate-800 text-right">Preço Cheio</th>
                      <th className="p-2 border border-slate-800 text-right">Preço Pago</th>
                      <th className="p-2 border border-slate-800 text-right">Subtotal Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingOrder.items.map((item, idx) => {
                      const fullUnitPrice = item.product.originalPrice || item.product.pmcPrice || item.product.price;
                      const paidUnitPrice = item.product.price;
                      const subtotalPaid = paidUnitPrice * item.quantity;
                      return (
                        <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50">
                          <td className="p-2 border font-black text-center text-sm font-mono bg-slate-100">{item.quantity}x</td>
                          <td className="p-2 border font-mono text-[10px]">{item.product.ean || 'N/A'}</td>
                          <td className="p-2 border font-bold">
                            {item.product.name}
                            <span className="block text-[9px] text-slate-500 font-normal">
                              {item.product.brand || item.product.manufacturer} | {item.product.prescriptionType !== 'none' ? `Tarja: ${item.product.prescriptionType.toUpperCase()}` : 'Venda Livre'}
                            </span>
                          </td>
                          <td className="p-2 border text-right font-mono text-slate-500 line-through">
                            R$ {fullUnitPrice.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-2 border text-right font-mono font-bold text-slate-900">
                            R$ {paidUnitPrice.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-2 border text-right font-mono font-bold text-rose-700 bg-slate-50">
                            R$ {subtotalPaid.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals & Cash Change Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Financial Summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal dos Produtos (Preço Pago):</span>
                    <span className="font-mono font-bold">
                      R$ {(printingOrder.total - (printingOrder.deliveryFee || 0)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de Entrega:</span>
                    <span className="font-mono font-bold">
                      {printingOrder.deliveryFee && printingOrder.deliveryFee > 0
                        ? `R$ ${printingOrder.deliveryFee.toFixed(2).replace('.', ',')}`
                        : 'ISENTO / GRÁTIS'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-black text-slate-950">
                    <span>VALOR TOTAL DO PEDIDO:</span>
                    <span className="font-mono text-rose-700">
                      R$ {printingOrder.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Important Instructions for Motoboy & Payment / Troco */}
                <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-400 space-y-1.5 text-amber-950">
                  <span className="text-[10px] font-black uppercase text-amber-900 block">
                    💳 FORMA DE PAGAMENTO & INSTRUÇÕES AO MOTOBOY
                  </span>
                  <p className="font-extrabold text-sm">
                    {printingOrder.paymentMethod === 'pix'
                      ? '⚡ PIX NA ENTREGA (Apresentar QR Code ao cliente)'
                      : printingOrder.paymentMethod === 'card'
                      ? '💳 CARTÃO NA ENTREGA (Levar Maquininha de Cartão)'
                      : '💵 DINHEIRO NA ENTREGA'}
                  </p>

                  {printingOrder.paymentMethod === 'cash' && (
                    <div className="bg-white p-2.5 rounded-lg border border-amber-300 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-700">Nota informada pelo cliente:</span>
                        <span className="font-mono font-black text-slate-900">
                          R$ {printingOrder.cashBanknote ? printingOrder.cashBanknote.toFixed(2).replace('.', ',') : printingOrder.changeAmount || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-black text-amber-900 text-sm">
                        <span>LEVAR DE TROCO:</span>
                        <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          R$ {(printingOrder.calculatedChange !== undefined ? printingOrder.calculatedChange : 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription Warning */}
              {printingOrder.prescriptionFile && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 font-bold text-[11px]">
                  ⚠️ RECEITA MÉDICA ANEXADA PELO CLIENTE: Arquivo "{printingOrder.prescriptionFile.fileName}" validado pelo sistema antes da expedição.
                </div>
              )}

              {/* Customer Receipt Signature Stub */}
              <div className="border-t-2 border-dashed border-slate-400 pt-4 mt-4 space-y-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Canhoto de Comprovante de Recebimento do Cliente</span>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="border-b border-slate-400 pb-1">Assinatura do Recebedor: __________________________________</div>
                  <div className="border-b border-slate-400 pb-1">CPF do Recebedor: ____________________ Data: ___/___/______</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPLASH SCREEN PREVIEW SIMULATOR MODAL */}
      {showSplashPreview && (
        <SplashScreen
          settings={settingsForm}
          onComplete={() => setShowSplashPreview(false)}
          isPreview={true}
        />
      )}

      {/* GUIDED OPERATOR SEPARATION EAN WORKFLOW MODAL */}
      {guidedSeparationOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Barcode className="w-6 h-6 text-rose-600" />
                    <span>Separação Guiada por EAN • Pedido #{guidedSeparationOrder.id}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Bipe os produtos com o leitor ou clique em "Bipar EAN" para validar cada item antes de liberar o cupom térmico.
                </p>
              </div>
              <button
                onClick={() => setGuidedSeparationOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* EAN Scanner Quick Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!guidedEanInput.trim()) return;
                const trimmed = guidedEanInput.trim();
                const matchedItem = guidedSeparationOrder.items.find(
                  (i) => i.product.ean === trimmed || i.product.additionalEans?.includes(trimmed)
                );
                if (matchedItem) {
                  onVerifyOrderEan(guidedSeparationOrder.id, matchedItem.product.id);
                  soundManager.playBeepSuccess();
                  setGuidedFeedback({
                    type: 'success',
                    text: `✅ EAN "${trimmed}" verificado com sucesso para ${matchedItem.product.name}!`,
                  });
                } else {
                  soundManager.playBeepError();
                  setGuidedFeedback({
                    type: 'error',
                    text: `❌ Código EAN "${trimmed}" não pertence a nenhum produto deste pedido.`,
                  });
                }
                setGuidedEanInput('');
                setTimeout(() => setGuidedFeedback(null), 3500);
              }}
              className="bg-slate-900 p-4 rounded-2xl text-white space-y-3"
            >
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Leitor de Código de Barras / Digitação Manual EAN:</span>
                <span className="text-[10px] text-emerald-400 font-mono font-normal">Aguardando leitura...</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guidedEanInput}
                  onChange={(e) => setGuidedEanInput(e.target.value)}
                  placeholder="Bipe o código de barras ou digite o EAN aqui..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-rose-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  Bipar EAN
                </button>
              </div>

              {guidedFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    guidedFeedback.type === 'success'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}
                >
                  {guidedFeedback.text}
                </div>
              )}
            </form>

            {/* Progress Bar */}
            {(() => {
              const verifiedCount = Object.keys(guidedSeparationOrder.verifiedEanItems || {}).length;
              const totalItems = guidedSeparationOrder.items.length;
              const percent = Math.round((verifiedCount / totalItems) * 100);
              const isComplete = verifiedCount >= totalItems;

              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Progresso da Separação</span>
                    <span className={isComplete ? 'text-emerald-600' : 'text-rose-600'}>
                      {verifiedCount} de {totalItems} itens ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : 'bg-rose-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Items List with Images and Quick Bip Buttons */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {guidedSeparationOrder.items.map((item, idx) => {
                const isVerified = guidedSeparationOrder.verifiedEanItems?.[item.product.id];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isVerified
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                        ) : (
                          <MedicineBoxSvg
                            prescriptionType={item.product.prescriptionType}
                            isGeneric={item.product.isGeneric}
                            name={item.product.name}
                            category={item.product.category}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs block text-slate-900 truncate">
                          Qtd: {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          EAN: {item.product.ean || '789...'} | MS: {item.product.ms || 'Isento'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isVerified ? (
                        <span className="bg-emerald-200 text-emerald-900 font-black text-[10px] px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>CONFERIDO</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onVerifyOrderEan(guidedSeparationOrder.id, item.product.id);
                            soundManager.playBeepSuccess();
                            setGuidedFeedback({
                              type: 'success',
                              text: `✅ Item "${item.product.name}" conferido manualmente!`,
                            });
                            setTimeout(() => setGuidedFeedback(null), 3000);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition"
                        >
                          🔍 Simular Bipar EAN
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workflow Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setThermalPrintOrder(guidedSeparationOrder);
                }}
                className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Cupom Térmico (58/80mm)</span>
              </button>

              <button
                onClick={() => {
                  onUpdateOrderStatus(guidedSeparationOrder.id, 'ready');
                  soundManager.playBeepSuccess();
                  setGuidedSeparationOrder(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar Separação & Pronto para Saída</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT PRINTING SLIP MODAL (58mm / 80mm) */}
      {thermalPrintOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 my-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>Impressão de Cupom Térmico</span>
              </h3>
              <button
                onClick={() => setThermalPrintOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Ticket Content */}
            <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200 font-mono text-[11px] text-slate-900 space-y-3 leading-tight print:bg-white print:p-0 print:border-none">
              <div className="text-center space-y-1 border-b-2 border-dashed border-slate-400 pb-3">
                <img src={settings.appLogo} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-1" />
                <h4 className="font-black text-sm uppercase tracking-wide">{settings.appName || 'Drogaria Americana'}</h4>
                <p className="text-[10px] text-slate-600 font-sans">{settings.appSubtitle}</p>
                <p className="text-[10px] text-slate-500 font-sans">Tel: {settings.storePhone}</p>
                <div className="pt-1 font-black text-xs">=== COMPROVANTE DE PEDIDO ===</div>
                <div className="font-bold text-xs">PEDIDO #{thermalPrintOrder.id}</div>
                <div className="text-[10px] text-slate-500">{new Date(thermalPrintOrder.createdAt).toLocaleString('pt-BR')}</div>
              </div>

              {/* Customer details */}
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5">
                <div>CLIENTE: <strong>{thermalPrintOrder.userName}</strong></div>
                <div>TEL: <strong>{thermalPrintOrder.userPhone || 'Não informado'}</strong></div>
                <div>TIPO: <strong>{thermalPrintOrder.deliveryType === 'delivery' ? 'ENTREGA DOMICÍLIO' : 'RETIRADA NA LOJA'}</strong></div>
                {thermalPrintOrder.deliveryType === 'delivery' && (
                  <div className="text-[10px]">
                    END: {typeof thermalPrintOrder.deliveryAddress === 'string'
                      ? thermalPrintOrder.deliveryAddress
                      : (thermalPrintOrder.deliveryAddress
                          ? `${thermalPrintOrder.deliveryAddress.street || ''}, ${thermalPrintOrder.deliveryAddress.number || ''}`
                          : (thermalPrintOrder.address
                              ? `${thermalPrintOrder.address.street || ''}, ${thermalPrintOrder.address.number || ''}`
                              : 'Endereço cadastrado'))}
                  </div>
                )}
              </div>

              {/* Items list */}
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1">
                <div className="font-bold flex justify-between text-[10px]">
                  <span>ITEM / DESCRIÇÃO</span>
                  <span>TOTAL</span>
                </div>
                {thermalPrintOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="truncate pr-1">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="shrink-0 font-bold">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment & Troco Breakdown */}
              <div className="space-y-1 border-b-2 border-dashed border-slate-400 pb-3">
                <div className="flex justify-between text-xs font-black">
                  <span>TOTAL DA COMPRA:</span>
                  <span>R$ {thermalPrintOrder.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>FORMA PGTO:</span>
                  <span className="font-bold">
                    {thermalPrintOrder.paymentMethod === 'pix'
                      ? 'PIX NA ENTREGA'
                      : thermalPrintOrder.paymentMethod === 'card'
                      ? 'CARTÃO NA ENTREGA'
                      : 'DINHEIRO'}
                  </span>
                </div>
                {thermalPrintOrder.paymentMethod === 'cash' && (
                  <div className="bg-amber-100 p-2 rounded-lg border border-amber-300 space-y-0.5 mt-1 font-bold">
                    <div className="flex justify-between text-[10px]">
                      <span>NOTA INFORMADA:</span>
                      <span>R$ {thermalPrintOrder.cashBanknote?.toFixed(2).replace('.', ',') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-800">
                      <span>LEVAR TROCO DE:</span>
                      <span>R$ {(thermalPrintOrder.calculatedChange || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-1 font-sans">
                Obrigado por comprar na {settings.appName || 'Drogaria Americana'}!
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cupom Térmico</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
