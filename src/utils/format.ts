// src/utils/format.ts
export const formatCurrency = (value: number, locale: string = 'en-IN'): string => {
  if (isNaN(value)) return '0.00';
  return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const amountInWords = (num: number): string => {
  // Simple implementation for Indian numbering system (crore, lakh, thousand, etc.)
  // For brevity, we use a basic English conversion; can be replaced with a library.
  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const c = ['','thousand','lakh','crore'];
  if (num === 0) return 'zero';
  let i = 0;
  let words = '';
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk) {
      let chunkWords = '';
      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;
      if (hundreds) chunkWords += a[hundreds] + ' hundred ';
      if (remainder < 20) {
        chunkWords += a[remainder];
      } else {
        const tens = Math.floor(remainder / 10);
        const units = remainder % 10;
        chunkWords += b[tens] + (units ? ' ' + a[units] : '');
      }
      words = chunkWords + ' ' + c[i] + ' ' + words;
    }
    num = Math.floor(num / 1000);
    i++;
  }
  return words.trim();
};

export const padInvoiceNumber = (num: number, prefix: string = 'INV-'): string => {
  const padded = num.toString().padStart(4, '0');
  return `${prefix}${padded}`;
};
