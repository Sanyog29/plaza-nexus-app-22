/**
 * Search utilities for efficient and consistent searching across the application
 */

/**
 * Normalizes a string for searching by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Removing extra whitespace
 * 
 * @param str - The string to normalize
 * @returns Normalized string
 */
export function normalizeSearchString(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if a target string matches a search query.
 * Handles null/undefined values safely.
 * 
 * @param target - The string to search in
 * @param query - The search query
 * @returns true if match found, false otherwise
 */
export function matchesSearch(
  target: string | null | undefined, 
  query: string
): boolean {
  if (!query) return true; // Empty query matches everything
  if (!target) return false; // No target to search
  
  const normalizedTarget = normalizeSearchString(target);
  const normalizedQuery = normalizeSearchString(query);
  
  return normalizedTarget.includes(normalizedQuery);
}

/**
 * Checks if any of the target strings match the search query.
 * 
 * @param targets - Array of strings to search in
 * @param query - The search query
 * @returns true if any target matches, false otherwise
 */
export function matchesAnySearch(
  targets: (string | null | undefined)[],
  query: string
): boolean {
  if (!query) return true;
  return targets.some(target => matchesSearch(target, query));
}

/**
 * Filters an array of objects based on a search query.
 * Searches across multiple specified fields.
 * 
 * @param items - Array of items to filter
 * @param query - The search query
 * @param searchFields - Array of field names to search in
 * @returns Filtered array
 * 
 * @example
 * const filtered = searchFilter(users, 'john', ['first_name', 'last_name', 'email']);
 */
export function searchFilter<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query) return items;
  
  const normalizedQuery = normalizeSearchString(query);
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value == null) return false;
      
      const normalizedValue = normalizeSearchString(String(value));
      return normalizedValue.includes(normalizedQuery);
    });
  });
}

/**
 * Advanced search filter with custom field extractors.
 * Useful when you need to search in nested objects or computed values.
 * 
 * @param items - Array of items to filter
 * @param query - The search query
 * @param fieldExtractors - Array of functions that extract searchable strings from items
 * @returns Filtered array
 * 
 * @example
 * const filtered = advancedSearchFilter(
 *   orders,
 *   'john',
 *   [
 *     (order) => order.customer.name,
 *     (order) => order.items.map(i => i.name).join(' ')
 *   ]
 * );
 */
export function advancedSearchFilter<T>(
  items: T[],
  query: string,
  fieldExtractors: ((item: T) => string | null | undefined)[]
): T[] {
  if (!query) return items;
  
  const normalizedQuery = normalizeSearchString(query);
  
  return items.filter(item => {
    return fieldExtractors.some(extractor => {
      const value = extractor(item);
      const normalizedValue = normalizeSearchString(value);
      return normalizedValue.includes(normalizedQuery);
    });
  });
}

/**
 * Highlights search query matches in text.
 * Returns text with <mark> tags around matches.
 * 
 * @param text - The text to highlight
 * @param query - The search query
 * @returns Text with highlighted matches
 * 
 * @example
 * highlightMatch('John Doe', 'doe') // "John <mark>Doe</mark>"
 */
export function highlightMatch(text: string, query: string): string {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Scores how well a string matches a search query.
 * Higher score = better match.
 * Useful for sorting search results by relevance.
 * 
 * @param target - The string to score
 * @param query - The search query
 * @returns Score (0-100)
 */
export function getSearchScore(
  target: string | null | undefined,
  query: string
): number {
  if (!query) return 100;
  if (!target) return 0;
  
  const normalizedTarget = normalizeSearchString(target);
  const normalizedQuery = normalizeSearchString(query);
  
  // Exact match
  if (normalizedTarget === normalizedQuery) return 100;
  
  // Starts with query
  if (normalizedTarget.startsWith(normalizedQuery)) return 90;
  
  // Contains query as whole word
  const wordBoundaryRegex = new RegExp(`\\b${normalizedQuery}\\b`);
  if (wordBoundaryRegex.test(normalizedTarget)) return 80;
  
  // Contains query
  if (normalizedTarget.includes(normalizedQuery)) return 70;
  
  // No match
  return 0;
}

/**
 * Sorts search results by relevance.
 * 
 * @param items - Array of items to sort
 * @param query - The search query
 * @param fieldExtractor - Function to extract searchable string from item
 * @returns Sorted array (most relevant first)
 */
export function sortByRelevance<T>(
  items: T[],
  query: string,
  fieldExtractor: (item: T) => string | null | undefined
): T[] {
  if (!query) return items;
  
  return [...items].sort((a, b) => {
    const scoreA = getSearchScore(fieldExtractor(a), query);
    const scoreB = getSearchScore(fieldExtractor(b), query);
    return scoreB - scoreA; // Higher score first
  });
}
