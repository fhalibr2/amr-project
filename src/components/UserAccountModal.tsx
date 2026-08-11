import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import { MedicineBoxSvg } from './MedicineBoxSvg';
import {
  User as UserIcon,
  LogOut,
  Package,
  MapPin,
  FileText,
  X,
  LogIn,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Lock,
  RefreshCw,
  MessageCircle,
  ArrowLeft,
  Download,
  Upload,
} from 'lucide-react';

export const DEFAULT_PRESET_USERS: User[] = [
  {
    id: 'usr_1001',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@email.com',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    password: '12345678',
    pin: '12345678',
    isAdmin: false,
    address: {
      street: 'Avenida Paulista',
      number: '1500',
      neighborhood: 'Bela Vista',
      complement: 'Apto 42 - Bloco B',
      city: 'São Paulo',
      state: 'SP',
      cep: '01310-200',
    },
  },
  {
    id: 'usr_1002',
    name: 'Maria Oliveira Santos',
    email: 'maria.santos@email.com',
    cpf: '987.654.321-11',
    phone: '(11) 97123-8899',
    password: '12345678',
    pin: '12345678',
    isAdmin: false,
    address: {
      street: 'Rua Augusta',
      number: '800',
      neighborhood: 'Consolação',
      complement: '',
      city: 'São Paulo',
      state: 'SP',
      cep: '01304-000',
    },
  },
];

export const parseUserFromTxt = (text: string): User | null => {
  try {
    const getValue = (label: string): string => {
      const regex = new RegExp(`${label}:?\\s*([^\\n\\r]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    const id = getValue('ID do Cliente') || `usr_${Date.now()}`;
    const name = getValue('Nome Completo') || getValue('Nome') || 'Cliente';
    const email = getValue('E-mail') || getValue('Email') || '';
    const cpf = getValue('CPF') || '';
    const phone = getValue('Telefone/WhatsApp') || getValue('Telefone') || '';
    const pin = getValue('PIN de Segurança \\(8 Dígitos\\)') || getValue('PIN') || '';
    const street = getValue('Logradouro') || '';
    const number = getValue('Nº') || getValue('Número') || 'S/N';
    const neighborhood = getValue('Bairro') || '';
    const complement = getValue('Complemento') || '';
    const cityState = getValue('Cidade/UF') || 'São Paulo - SP';
    const cep = getValue('CEP') || '01000-000';

    let city = 'São Paulo';
    let state = 'SP';
    if (cityState.includes('-')) {
      const parts = cityState.split('-');
      city = parts[0].trim();
      state = parts[1].trim();
    } else if (cityState) {
      city = cityState.trim();
    }

    if (!email && !cpf && !name) {
      return null;
    }

    const cleanPin = pin.replace(/\D/g, '') || '12345678';

    const user: User = {
      id: id.startsWith('usr_') ? id : `usr_${id}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@cliente.com.br`,
      cpf,
      phone,
      pin: cleanPin,
      password: cleanPin,
      isAdmin: false,
      address: {
        street,
        number,
        neighborhood,
        complement,
        city,
        state,
        cep,
      },
    };

    return user;
  } catch {
    return null;
  }
};

export const downloadUserTxt = (user: User) => {
  const textContent = `=====================================================
FICHA DE CADASTRO DE CLIENTE - DROGARIA AMERICANA
=====================================================
Data de Emissão: ${new Date().toLocaleString('pt-BR')}
ID do Cliente: ${user.id}
Nome Completo: ${user.name}
CPF: ${user.cpf || 'Não informado'}
E-mail: ${user.email}
Telefone/WhatsApp: ${user.phone || 'Não informado'}

ENDEREÇO DE ENTREGA DE MEDICAMENTOS:
Logradouro: ${user.address?.street || 'N/A'}, Nº: ${user.address?.number || 'S/N'}
Bairro: ${user.address?.neighborhood || 'N/A'}
Complemento: ${user.address?.complement || 'N/A'}
Cidade/UF: ${user.address?.city || 'São Paulo'} - ${user.address?.state || 'SP'}
CEP: ${user.address?.cep || '01000-000'}

SEGURANÇA & DADOS DE RECOVERY:
PIN de Segurança (8 Dígitos): ${user.pin || 'Não informado'}
Termos LGPD: Aceitos
=====================================================`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cadastro_cliente_${user.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAllUsersTxt = (users: User[]) => {
  let fileText = `=====================================================\n`;
  fileText += `RELATÓRIO GERAL DE CLIENTES CADASTRAIS - DROGARIA AMERICANA\n`;
  fileText += `Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${users.length} Clientes\n`;
  fileText += `=====================================================\n\n`;

  users.forEach((u, index) => {
    fileText += `[CLIENTE #${index + 1}]\n`;
    fileText += `ID: ${u.id}\n`;
    fileText += `Nome: ${u.name}\n`;
    fileText += `CPF: ${u.cpf || 'Não informado'}\n`;
    fileText += `Email: ${u.email}\n`;
    fileText += `Telefone: ${u.phone || 'Não informado'}\n`;
    fileText += `Endereço: ${u.address?.street || ''}, ${u.address?.number || ''} - ${u.address?.neighborhood || ''}, ${u.address?.city || ''}\n`;
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

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  orders: Order[];
  onLogin: (user: User) => void;
  onLogout: () => void;
  onUpdateOrderStatus?: (orderId: string, status: Order['status'], confirmedBy?: 'customer' | 'driver' | 'staff') => void;
  initialTab?: 'profile' | 'orders' | 'login' | 'register' | 'recover';
  noticeMessage?: string | null;
  storePhone?: string;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders,
  onLogin,
  onLogout,
  onUpdateOrderStatus,
  initialTab,
  noticeMessage,
  storePhone = '(11) 99999-8888',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'login' | 'register'>('login');
  const [showRecoverSubView, setShowRecoverSubView] = useState(false);
  
  // Storage of all registered users locally
  const getRegisteredUsers = (): User[] => {
    const saved = localStorage.getItem('pharma_registered_users');
    if (!saved) {
      localStorage.setItem('pharma_registered_users', JSON.stringify(DEFAULT_PRESET_USERS));
      return DEFAULT_PRESET_USERS;
    }
    return JSON.parse(saved);
  };

  const saveRegisteredUser = (user: User) => {
    const existing = getRegisteredUsers();
    const updated = [user, ...existing.filter((u) => u.email !== user.email && u.cpf !== user.cpf)];
    localStorage.setItem('pharma_registered_users', JSON.stringify(updated));
  };

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('');
  const [regComplement, setRegComplement] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regConsentAccepted, setRegConsentAccepted] = useState(false);

  // Recover state
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverPin, setRecoverPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Captcha challenge state
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    return { num1: n1, num2: n2, answer: (n1 + n2).toString() };
  };
  const [captchaChallenge, setCaptchaChallenge] = useState(generateCaptcha);
  const [userCaptchaInput, setUserCaptchaInput] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setActiveTab(initialTab && (initialTab === 'profile' || initialTab === 'orders') ? initialTab : 'profile');
      } else {
        if (initialTab === 'recover') {
          setActiveTab('login');
          setShowRecoverSubView(true);
        } else {
          setActiveTab(initialTab && (initialTab === 'login' || initialTab === 'register') ? initialTab : 'login');
          setShowRecoverSubView(false);
        }
      }
      setCaptchaChallenge(generateCaptcha());
      setUserCaptchaInput('');
    }
  }, [isOpen, currentUser, initialTab]);

  if (!isOpen) return null;

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const refreshCaptcha = () => {
    setCaptchaChallenge(generateCaptcha());
    setUserCaptchaInput('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Check Captcha
    if (userCaptchaInput.trim() !== captchaChallenge.answer) {
      setErrorMessage('Verificação Anti-Robô incorreta. Resolva o cálculo do Captcha para prosseguir.');
      refreshCaptcha();
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('A senha de acesso deve conter no mínimo 6 dígitos/caracteres.');
      return;
    }

    const cleanPin = regPin.replace(/\D/g, '');
    if (cleanPin.length !== 8) {
      setErrorMessage('O PIN de segurança deve conter exatamente 8 dígitos numéricos.');
      return;
    }

    if (!regNeighborhood.trim()) {
      setErrorMessage('Por favor, informe o seu Bairro para o cadastro.');
      return;
    }

    if (!regConsentAccepted) {
      setErrorMessage('Você deve aceitar o Termo de Consentimento e Privacidade para criar sua conta.');
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      cpf: regCpf.trim(),
      password: regPassword,
      pin: cleanPin,
      phone: regPhone.trim(),
      address: {
        cep: '01000-000',
        street: regStreet || 'Rua Principal',
        number: regNumber || '100',
        complement: regComplement || '',
        neighborhood: regNeighborhood || 'Centro',
        city: regCity || 'São Paulo',
        state: 'SP',
      },
      isAdmin: false,
    };

    saveRegisteredUser(newUser);
    onLogin(newUser);
    // Download TXT file record for customer
    try {
      downloadUserTxt(newUser);
    } catch {
      // Ignore if popup blocked
    }
    setSuccessMessage('Conta criada com sucesso! O arquivo TXT com seu comprovante de cadastro foi gerado.');
    setActiveTab('profile');
  };

  const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearMessages();
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setErrorMessage('O arquivo .TXT selecionado está vazio ou ilegível.');
        return;
      }

      const parsedUser = parseUserFromTxt(content);
      if (!parsedUser) {
        setErrorMessage(
          'Não foi possível validar as credenciais neste arquivo .TXT. Verifique se é um arquivo de cadastro válido.'
        );
        return;
      }

      const registered = getRegisteredUsers();
      const existingIdx = registered.findIndex(
        (u) =>
          (u.email && parsedUser.email && u.email.toLowerCase() === parsedUser.email.toLowerCase()) ||
          (u.cpf && parsedUser.cpf && u.cpf.replace(/\D/g, '') === parsedUser.cpf.replace(/\D/g, ''))
      );

      if (existingIdx >= 0) {
        if (registered[existingIdx].password) {
          parsedUser.password = registered[existingIdx].password;
        }
        registered[existingIdx] = { ...registered[existingIdx], ...parsedUser };
        localStorage.setItem('pharma_registered_users', JSON.stringify(registered));
      } else {
        saveRegisteredUser(parsedUser);
      }

      onLogin(parsedUser);
      setSuccessMessage(`✅ Autenticado com sucesso via leitura do arquivo .TXT! Bem-vindo(a), ${parsedUser.name}.`);
      setActiveTab('profile');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadBundledTxt = async () => {
    clearMessages();
    try {
      const res = await fetch('/cadastro_cliente_exemplo.txt');
      const text = await res.text();
      const parsedUser = parseUserFromTxt(text);
      if (!parsedUser) {
        setErrorMessage('Não foi possível carregar o arquivo .TXT pré-existente no projeto.');
        return;
      }
      const registered = getRegisteredUsers();
      const existingIdx = registered.findIndex(
        (u) =>
          (u.email && parsedUser.email && u.email.toLowerCase() === parsedUser.email.toLowerCase()) ||
          (u.cpf && parsedUser.cpf && u.cpf.replace(/\D/g, '') === parsedUser.cpf.replace(/\D/g, ''))
      );

      if (existingIdx >= 0) {
        if (registered[existingIdx].password) {
          parsedUser.password = registered[existingIdx].password;
        }
        registered[existingIdx] = { ...registered[existingIdx], ...parsedUser };
        localStorage.setItem('pharma_registered_users', JSON.stringify(registered));
      } else {
        saveRegisteredUser(parsedUser);
      }

      onLogin(parsedUser);
      setSuccessMessage(`✅ Autenticado com sucesso via arquivo .TXT do projeto! Bem-vindo(a), ${parsedUser.name}.`);
      setActiveTab('profile');
    } catch {
      setErrorMessage('Erro ao ler o arquivo .TXT incluído no projeto.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Por favor, informe seu E-mail/CPF e sua Senha de acesso.');
      return;
    }

    const cleanInput = loginIdentifier.trim().toLowerCase();
    const registered = getRegisteredUsers();

    const found = registered.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        (u.cpf && u.cpf.replace(/\D/g, '') === cleanInput.replace(/\D/g, ''))
    );

    if (found) {
      if (found.password && found.password !== loginPassword) {
        setErrorMessage('Senha incorreta. Verifique seus dados ou clique em "Esqueceu a senha?".');
        return;
      }
      onLogin(found);
      setSuccessMessage(`Bem-vindo de volta, ${found.name}!`);
      setActiveTab('profile');
    } else {
      setErrorMessage(
        'Nenhum cadastro encontrado para o E-mail ou CPF informado. Por favor, crie sua conta na aba "Cadastrar" para acessar.'
      );
    }
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Verify Captcha
    if (userCaptchaInput.trim() !== captchaChallenge.answer) {
      setErrorMessage('Código Captcha incorreto. Por favor, responda o desafio de segurança.');
      refreshCaptcha();
      return;
    }

    const cleanInput = recoverIdentifier.trim().toLowerCase();
    const cleanPin = recoverPin.replace(/\D/g, '');

    if (cleanPin.length !== 8) {
      setErrorMessage('O PIN informado deve ter exatamente 8 dígitos numéricos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 dígitos/caracteres.');
      return;
    }

    const registered = getRegisteredUsers();
    const userIdx = registered.findIndex(
      (u) => u.email.toLowerCase() === cleanInput || u.cpf.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')
    );

    if (userIdx >= 0) {
      const userObj = registered[userIdx];
      if (userObj.pin && userObj.pin !== cleanPin) {
        setErrorMessage('PIN de 8 dígitos incorreto. Verifique no seu cadastro e tente novamente.');
        return;
      }
      userObj.password = newPassword;
      userObj.pin = cleanPin;
      registered[userIdx] = userObj;
      localStorage.setItem('pharma_registered_users', JSON.stringify(registered));

      setSuccessMessage('Senha alterada com sucesso! Faça login com sua nova senha.');
      setLoginIdentifier(userObj.email);
      setLoginPassword('');
      setShowRecoverSubView(false);
      setActiveTab('login');
    } else {
      setErrorMessage('Nenhuma conta encontrada para o CPF ou E-mail digitado.');
    }
  };

  const userOrders = currentUser ? orders.filter((o) => o.userId === currentUser.id || o.userEmail === currentUser.email) : [];

  const getOrderStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'confirmed':
      case 'separating':
      case 'ready':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return 0;
      default:
        return 1;
    }
  };

  const handleOpenWhatsAppSupport = (orderId?: string) => {
    const cleanPhone = storePhone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      orderId
        ? `Olá! Gostaria de suporte sobre meu pedido #${orderId} na farmácia.`
        : `Olá! Preciso de ajuda com meu atendimento na farmácia.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Área do Cliente</h3>
              <p className="text-xs text-rose-100 font-medium">
                {currentUser ? `Olá, ${currentUser.name}` : 'Acesse ou crie sua conta com segurança'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Notice Banner */}
        {noticeMessage && !currentUser && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs font-semibold text-amber-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Tab Navigation (Minimalist: ONLY Entrar and Criar Conta when logged out) */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex gap-1.5 shrink-0 text-xs font-bold overflow-x-auto scrollbar-none">
          {currentUser ? (
            <>
              <button
                onClick={() => {
                  clearMessages();
                  setActiveTab('profile');
                }}
                className={`py-2 px-4 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'profile' ? 'bg-white text-rose-600 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Meu Perfil</span>
              </button>
              <button
                onClick={() => {
                  clearMessages();
                  setActiveTab('orders');
                }}
                className={`py-2 px-4 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'orders' ? 'bg-white text-rose-600 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Meus Pedidos ({userOrders.length})</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  clearMessages();
                  setShowRecoverSubView(false);
                  setActiveTab('login');
                }}
                className={`py-2 px-4 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'login' && !showRecoverSubView
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
              <button
                onClick={() => {
                  clearMessages();
                  setShowRecoverSubView(false);
                  setActiveTab('register');
                }}
                className={`py-2 px-4 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'register'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Criar Conta</span>
              </button>
            </>
          )}
        </div>

        {/* Feedback Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: LOGGED USER PROFILE */}
          {currentUser && activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Dados Cadastrais</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    Conta Verificada
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Nome:</span>
                    <strong className="text-slate-900 font-bold">{currentUser.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">CPF:</span>
                    <strong className="text-slate-900 font-bold">{currentUser.cpf}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">E-mail:</span>
                    <strong className="text-slate-900 font-bold">{currentUser.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Telefone:</span>
                    <strong className="text-slate-900 font-bold">{currentUser.phone || 'Não informado'}</strong>
                  </div>
                </div>
              </div>

              {currentUser.address && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm border-b border-slate-200 pb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Endereço Principal de Entrega</span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed pt-1">
                    {currentUser.address.street}, {currentUser.address.number}
                    {currentUser.address.complement && ` (${currentUser.address.complement})`} - {currentUser.address.neighborhood}
                    <br />
                    {currentUser.address.city} - {currentUser.address.state} (CEP: {currentUser.address.cep})
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => downloadUserTxt(currentUser)}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs border border-rose-200"
                >
                  <Download className="w-4 h-4 text-rose-600" />
                  <span>Baixar Comprovante de Cadastro (.TXT)</span>
                </button>

                <button
                  onClick={onLogout}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MEUS PEDIDOS WITH THUMBNAILS, WHATSAPP & DELIVERY CONFIRMATION */}
          {currentUser && activeTab === 'orders' && (
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-12 space-y-3 text-slate-500 text-xs">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Package className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-slate-700">Você ainda não realizou nenhum pedido.</p>
                  <p className="text-[11px] text-slate-400">Seus pedidos e status de entrega em tempo real aparecerão aqui.</p>
                </div>
              ) : (
                userOrders.map((order) => {
                  const step = getOrderStatusStep(order.status);
                  return (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-3">
                      {/* Top Order ID & Date */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="text-rose-600 font-extrabold font-mono text-xs block">
                            Pedido #{order.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          {order.status === 'pending'
                            ? 'Pendente'
                            : order.status === 'confirmed'
                            ? 'Confirmado'
                            : order.status === 'separating'
                            ? 'Em Separação'
                            : order.status === 'ready'
                            ? 'Pronto p/ Retirada'
                            : order.status === 'out_for_delivery'
                            ? 'Em Rota de Entrega'
                            : order.status === 'delivered'
                            ? 'Entregue com Sucesso'
                            : 'Cancelado'}
                        </span>
                      </div>

                      {/* Visual Progress Timeline */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Status do Acompanhamento
                        </span>
                        <div className="grid grid-cols-4 gap-1 relative text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              1
                            </div>
                            <span className="text-[9px] font-semibold text-slate-700">Recebido</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              2
                            </div>
                            <span className="text-[9px] font-semibold text-slate-700">Separação</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              3
                            </div>
                            <span className="text-[9px] font-semibold text-slate-700">Em Rota</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              4
                            </div>
                            <span className="text-[9px] font-semibold text-slate-700">Entregue</span>
                          </div>
                        </div>
                      </div>

                      {/* Items List with Product Image Thumbnails */}
                      <div className="space-y-2 pt-1">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                            <div className="w-10 h-10 bg-white rounded-lg p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                              {i.product.image ? (
                                <img
                                  src={i.product.image}
                                  alt={i.product.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <MedicineBoxSvg
                                  prescriptionType={i.product.prescriptionType}
                                  isGeneric={i.product.isGeneric}
                                  name={i.product.name}
                                  category={i.product.category}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{i.product.name}</span>
                              <span className="text-[10px] text-slate-500">
                                {i.quantity}x R$ {i.product.price.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <span className="font-mono text-slate-900 font-bold shrink-0">
                              R$ {(i.product.price * i.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary & Customer Action Buttons */}
                      <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-bold text-xs text-slate-900">
                        <div>
                          <span>Total Pago: </span>
                          <span className="text-rose-600 font-mono text-sm ml-1">
                            R$ {order.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateOrderStatus) {
                                  onUpdateOrderStatus(order.id, 'delivered', 'customer');
                                }
                              }}
                              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Confirmar Recebimento</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppSupport(order.id)}
                            className="flex-1 sm:flex-initial bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Suporte WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LOGIN FORM OR RECOVER SUB-VIEW */}
          {!currentUser && activeTab === 'login' && (
            <>
              {!showRecoverSubView ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">Acesse sua Conta</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Informe seu CPF ou E-mail e sua senha para entrar.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CPF ou E-mail</label>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Seu CPF (000.000.000-00) ou E-mail"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm font-medium transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">Senha</label>
                        <button
                          type="button"
                          onClick={() => {
                            clearMessages();
                            setShowRecoverSubView(true);
                          }}
                          className="text-xs text-rose-600 font-bold hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Sua senha"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm font-medium transition pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition text-sm flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Entrar na Minha Conta</span>
                  </button>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between text-rose-700 font-extrabold text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Autenticação via Arquivo .TXT</span>
                        </div>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                          Segurança Local
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Você pode usar o arquivo <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono text-[10px]">.txt</code> de cadastro pré-instalado no projeto para entrar instantaneamente ou carregar seu próprio arquivo.
                      </p>

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleLoadBundledTxt}
                          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-sm active:scale-98"
                        >
                          <FileText className="w-4 h-4 text-rose-200" />
                          <span>⚡ Entrar com .TXT do Projeto (Exemplo)</span>
                        </button>

                        <div className="flex items-center gap-2 my-0.5">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[10px] text-slate-400 font-bold uppercase">ou</span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs transition shadow-xs active:scale-98">
                          <Upload className="w-4 h-4 text-rose-600" />
                          <span>📂 Carregar Arquivo .TXT do seu Dispositivo</span>
                          <input
                            type="file"
                            accept=".txt"
                            onChange={handleTxtFileUpload}
                            className="hidden"
                          />
                        </label>

                        <a
                          href="/cadastro_cliente_exemplo.txt"
                          download="cadastro_cliente_exemplo.txt"
                          className="text-[11px] text-slate-500 hover:text-rose-600 text-center font-bold flex items-center justify-center gap-1 pt-1 transition"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>Baixar cópia do arquivo cadastro_cliente_exemplo.txt</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                /* INLINE RECOVERY VIEW INSIDE ENTRAR */
                <form onSubmit={handleRecoverSubmit} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setShowRecoverSubView(false);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar ao Login</span>
                    </button>
                    <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Recuperação de Acesso
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">Redefinir Senha de Acesso</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Informe seu CPF/E-mail cadastrado e o PIN de 8 dígitos gerado no momento da conta.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CPF ou E-mail Cadastrado</label>
                      <input
                        type="text"
                        required
                        value={recoverIdentifier}
                        onChange={(e) => setRecoverIdentifier(e.target.value)}
                        placeholder="Seu CPF ou E-mail"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PIN de Segurança (8 dígitos)</label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={recoverPin}
                        onChange={(e) => setRecoverPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Seu PIN de 8 números"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 focus:border-rose-600 outline-none text-sm font-mono font-bold tracking-widest text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nova Senha</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 dígitos"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                        />
                      </div>
                    </div>

                    {/* CAPTCHA ANTI-BOT VERIFICATION BOX */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Verificação Anti-Robô (Captcha)</span>
                        </div>
                        <button
                          type="button"
                          onClick={refreshCaptcha}
                          className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline"
                          title="Gerar novo código"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Novo Código</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-amber-400 font-mono font-black text-base tracking-widest px-4 py-2 rounded-xl border border-slate-700 shadow-inner select-none flex items-center justify-center">
                          {captchaChallenge.num1} + {captchaChallenge.num2} = ?
                        </div>
                        <input
                          type="text"
                          required
                          value={userCaptchaInput}
                          onChange={(e) => setUserCaptchaInput(e.target.value)}
                          placeholder="Resultado"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none font-mono font-bold text-sm text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition text-sm flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Redefinir Senha Agora</span>
                  </button>
                </form>
              )}
            </>
          )}

          {/* REGISTER FORM WITH CAPTCHA & MIN PASS 6 DIGITS & ADDRESS & CONSENT */}
          {!currentUser && activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Criar Nova Conta</h4>
                <p className="text-slate-500 text-xs mt-0.5">Preencha os dados cadastrais e crie seu PIN de 8 dígitos para segurança.</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={regCpf}
                    onChange={(e) => setRegCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Senha de Acesso (mínimo 6 dígitos) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    PIN de 8 dígitos <span className="text-rose-600 font-extrabold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 12345678"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 focus:border-rose-600 outline-none text-xs font-mono font-bold tracking-widest text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                />
              </div>

              {/* Address Fields with Bairro & Complemento */}
              <div className="space-y-2 border-t border-slate-100 pt-2">
                <span className="font-extrabold text-slate-800 text-xs block">Endereço de Entrega</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                      placeholder="Ex: Av. Paulista"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="Ex: 1500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      value={regNeighborhood}
                      onChange={(e) => setRegNeighborhood(e.target.value)}
                      placeholder="Ex: Bela Vista"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Complemento</label>
                    <input
                      type="text"
                      value={regComplement}
                      onChange={(e) => setRegComplement(e.target.value)}
                      placeholder="Apto 42, Bloco B"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cidade / Estado *</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Ex: São Paulo / SP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-600 outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* CAPTCHA ANTI-BOT VERIFICATION BOX FOR REGISTER */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verificação Anti-Robô (Captcha)</span>
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline"
                    title="Gerar novo código"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Novo Código</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-amber-400 font-mono font-black text-sm tracking-widest px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-inner select-none flex items-center justify-center">
                    {captchaChallenge.num1} + {captchaChallenge.num2} = ?
                  </div>
                  <input
                    type="text"
                    required
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    placeholder="Resultado"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-rose-600 outline-none font-mono font-bold text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* OBLIGATORY CONSENT CHECKBOX */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    required
                    checked={regConsentAccepted}
                    onChange={(e) => setRegConsentAccepted(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded mt-0.5"
                  />
                  <span className="text-[11px] text-slate-700 font-medium leading-tight">
                    Li e concordo com os <strong>Termos de Uso, Consentimento e Política de Privacidade</strong> para salvaguarda de meus dados e histórico de pedidos.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition text-sm mt-2 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Concluir Cadastro</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
