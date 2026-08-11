import { Product } from '../types';

// Common Brazilian medicine typo map for senior-friendly intelligent search
const TYPO_SYNONYMS: Record<string, string> = {
  diprina: 'dipirona',
  dirona: 'dipirona',
  depirona: 'dipirona',
  dipirone: 'dipirona',
  parasetamol: 'paracetamol',
  paracitamol: 'paracetamol',
  prasatamol: 'paracetamol',
  clonasepam: 'clonazepam',
  clonaspan: 'clonazepam',
  rivotril: 'clonazepam',
  amoxilina: 'amoxicilina',
  amoxicilina: 'amoxicilina',
  ibuprofeno: 'ibuprofeno',
  ibupofeno: 'ibuprofeno',
  omeprasol: 'omeprazol',
  omeprassol: 'omeprazol',
  dorflex: 'dorflex',
  doflex: 'dorflex',
  buscopan: 'buscopan',
  buscopam: 'buscopan',
  simeticona: 'simeticona',
  luftal: 'simeticona',
  antialergico: 'loratadina',
  loratadina: 'loratadina',
  nimesulida: 'nimesulida',
  nemesulida: 'nimesulida',
  vitamina: 'vitamina',
  shampoo: 'shampoo',
  xampu: 'shampoo',
  fralda: 'fralda',
  protetor: 'protetor solar',
};

// Groups of related active ingredients and brand names
const SYNONYM_GROUPS: string[][] = [
  ['dipirona', 'novalgina', 'dorflex', 'neosaldina', 'anador', 'lisador', 'dipirona monoidratada'],
  ['paracetamol', 'tylenol', 'resfenol', 'cimegripe', 'vick pyrena', 'dramin'],
  ['ibuprofeno', 'advil', 'alivium', 'spidufen', 'buscofem'],
  ['omeprazol', 'losec', 'peprazol', 'gastrium'],
  ['amoxicilina', 'amoxil', 'velamox', 'novocilin'],
  ['clonazepam', 'rivotril'],
  ['simeticona', 'luftal'],
  ['nimesulida', 'nisulid', 'scaflam', 'scot'],
  ['losartana', 'cozaar', 'aradois', 'corus', 'losartana potassica'],
  ['buscopan', 'escopolamina', 'buscopam'],
  ['loratadina', 'claritin', 'desloratadina', 'desalex'],
];

// Helper to expand a search query into related terms (brand <-> generic)
function getExpandedQueryTerms(query: string): string[] {
  const terms = new Set<string>([query]);
  const mapped = TYPO_SYNONYMS[query];
  if (mapped) terms.add(mapped);

  for (const group of SYNONYM_GROUPS) {
    const matched = group.some(term => query.includes(term) || (mapped && mapped.includes(term)));
    if (matched) {
      group.forEach(t => terms.add(t));
    }
  }

  return Array.from(terms);
}

// Calculate Levenshtein Distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Normalize text for search: remove accents, special chars, lowercase
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export interface SearchResult {
  products: Product[];
  didYouMean?: string;
  matchedCategory?: string;
}

export function searchProducts(products: Product[], query: string): SearchResult {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) {
    return { products: products.filter((p) => p.isActive) };
  }

  // Check synonym map first
  const mappedQuery = TYPO_SYNONYMS[cleanQuery] || cleanQuery;
  const expandedTerms = getExpandedQueryTerms(cleanQuery);

  let bestSuggestion: string | undefined = undefined;

  // Score each product
  const scoredProducts = products
    .filter((p) => p.isActive)
    .map((product) => {
      const name = normalizeText(product.name);
      const category = normalizeText(product.category);
      const desc = normalizeText(product.description || '');
      const activeIng = normalizeText(product.activeIngredient || '');
      const ean = normalizeText(product.ean || '');
      const additionalEans = (product.additionalEans || []).map(e => normalizeText(e));
      const brand = normalizeText(product.brand || '');
      const lab = normalizeText(product.laboratory || product.manufacturer || '');

      let score = 0;

      // 1. Direct or multi-EAN match
      if ((ean && ean.includes(cleanQuery)) || additionalEans.some(e => e.includes(cleanQuery))) {
        score += 200;
      }

      // 2. Exact or Synonym match in Name, Active Ingredient, Brand, or Laboratory
      for (const term of expandedTerms) {
        if (name.includes(term) || activeIng.includes(term) || brand.includes(term) || lab.includes(term)) {
          score += (term === cleanQuery || term === mappedQuery) ? 120 : 80;
        }
      }

      // 3. Match in description or tags
      if (desc.includes(mappedQuery) || expandedTerms.some(t => desc.includes(t))) score += 40;
      if (product.tags?.some((t) => expandedTerms.some(term => normalizeText(t).includes(term)))) score += 50;
      if (product.searchKeywords?.some((k) => expandedTerms.some(term => normalizeText(k).includes(term)))) score += 90;

      // 4. Word by word fuzzy check & Levenshtein distance
      const nameWords = name.split(/\s+/);
      const queryWords = cleanQuery.split(/\s+/);

      for (const qWord of queryWords) {
        if (qWord.length < 3) continue;

        for (const nWord of nameWords) {
          if (nWord.length < 3) continue;

          // Direct prefix match
          if (nWord.startsWith(qWord)) {
            score += 50;
          }

          // Levenshtein distance check for typos
          const distance = levenshteinDistance(qWord, nWord);
          const maxLen = Math.max(qWord.length, nWord.length);

          if (distance <= 2 && maxLen >= 4) {
            score += Math.max(0, 40 - distance * 15);
            if (!bestSuggestion && mappedQuery !== cleanQuery) {
              bestSuggestion = product.name.split(' ')[0];
            }
          }
        }
      }

      return { product, score };
    });

  // Filter out products with score 0
  const filtered = scoredProducts
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);

  // If mappedQuery was used and differs from original query
  let suggestion = undefined;
  if (mappedQuery !== cleanQuery) {
    suggestion = mappedQuery.charAt(0).toUpperCase() + mappedQuery.slice(1);
  } else if (bestSuggestion && filtered.length > 0) {
    suggestion = filtered[0].name.split(' ')[0];
  }

  return {
    products: filtered,
    didYouMean: suggestion,
  };
}
