/**
 * Currency formatting utilities
 * Norwegian (no): X.XXX,- (no currency symbol)
 * English (en): $X,XXX (USD format)
 */

/**
 * Format a number as currency based on locale
 * @param price - The price value (can be in øre/cents or kroner)
 * @param locale - The locale ('no' or 'en')
 * @param fromCents - If true, price is in øre (cents) and needs division by 100
 * @returns Formatted string like "2.290,-" (no) or "$2,290" (en)
 */
export const formatCurrency = (price: number | string, locale: string = 'no', fromCents: boolean = false): string => {
    let numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (fromCents) {
        numPrice = numPrice / 100;
    }

    const rounded = Math.round(numPrice);
    
    if (locale === 'en') {
        // English: $X,XXX format
        const formatted = rounded.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return `$${formatted}`;
    } else {
        // Norwegian: X.XXX,- format (no "kr")
        const formatted = rounded.toLocaleString('de-DE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return `${formatted},-`;
    }
};

/**
 * Format a number as Norwegian Krone (legacy - use formatCurrency instead)
 * @param price - The price value (can be in øre/cents or kroner)
 * @param fromCents - If true, price is in øre (cents) and needs division by 100
 * @returns Formatted string like "2.290,-" (no "kr")
 */
export const formatNOK = (price: number | string, locale: string = 'no', fromCents: boolean = false): string => {
    return formatCurrency(price, locale, fromCents);
};

/**
 * Format a price with decimals (for per-minute rates, etc.)
 * @param price - The price value
 * @param locale - The locale ('no' or 'en')
 * @param fromCents - If true, price is in øre (cents) and needs division by 100
 * @returns Formatted string like "22,90,-" (no) or "$22.90" (en)
 */
export const formatNOKDecimal = (price: number | string, locale: string = 'no', fromCents: boolean = false): string => {
    let numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (fromCents) {
        numPrice = numPrice / 100;
    }

    if (locale === 'en') {
        // English: $X.XX format
        const formatted = numPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `$${formatted}`;
    } else {
        // Norwegian: X.XXX,XX,- format (no "kr")
        const formatted = numPrice.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${formatted},-`;
    }
};

/**
 * Format a price per unit (like per-minute cost)
 * @param price - Total price
 * @param units - Number of units (minutes, etc.)
 * @param locale - The locale ('no' or 'en')
 * @param fromCents - If true, price is in øre (cents)
 * @returns Formatted string like "11,45,-" (no) or "$11.45" (en)
 */
export const formatPricePerUnit = (price: number, units: number, locale: string = 'no', fromCents: boolean = false): string => {
    let numPrice = fromCents ? price / 100 : price;
    const perUnit = numPrice / units;

    if (locale === 'en') {
        const formatted = perUnit.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `$${formatted}`;
    } else {
        const formatted = perUnit.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${formatted},-`;
    }
};

// Legacy USD format for backwards compatibility during transition
export const formatUSD = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
};
