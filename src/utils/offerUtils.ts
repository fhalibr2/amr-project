import { Product } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a product's offer is currently valid and active
 * Automatically returns false if stock <= 0 or if today is outside offerStartDate..offerEndDate
 */
export function isOfferActive(product: Product): boolean {
  if (!product.isOffer) return false;
  if (product.stock <= 0) return false;

  const today = getTodayDateString();

  if (product.offerStartDate && product.offerStartDate > today) {
    return false; // Offer has not started yet
  }

  if (product.offerEndDate && product.offerEndDate < today) {
    return false; // Offer has expired
  }

  return true;
}

/**
 * Returns detailed status information about a product's offer
 */
export function getOfferStatusDetails(product: Product): {
  isActive: boolean;
  reason?: 'expired_date' | 'not_started' | 'out_of_stock' | 'not_offer';
  text?: string;
} {
  if (!product.isOffer) {
    return { isActive: false, reason: 'not_offer', text: 'Sem Oferta Ativa' };
  }

  if (product.stock <= 0) {
    return { isActive: false, reason: 'out_of_stock', text: 'Oferta Desativada (Sem Estoque)' };
  }

  const today = getTodayDateString();

  if (product.offerStartDate && product.offerStartDate > today) {
    return {
      isActive: false,
      reason: 'not_started',
      text: `Programada (Inicia ${product.offerStartDate.split('-').reverse().join('/')})`,
    };
  }

  if (product.offerEndDate && product.offerEndDate < today) {
    return {
      isActive: false,
      reason: 'expired_date',
      text: `Expirada em ${product.offerEndDate.split('-').reverse().join('/')}`,
    };
  }

  let text = 'Oferta Ativa';
  if (product.offerEndDate) {
    text = `Válida até ${product.offerEndDate.split('-').reverse().join('/')}`;
  } else if (product.offerDurationText) {
    text = product.offerDurationText;
  }

  return { isActive: true, text };
}
