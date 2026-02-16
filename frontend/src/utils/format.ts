/**
 * Para birimi formatlama
 */
export function formatCurrency(amount: number, currency = 'TRY'): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Tarih formatlama – gün.ay.yıl
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

/**
 * Tarih ve saat formatlama
 */
export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Göreceli zaman – "2 saat önce" gibi
 */
export function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return formatDate(dateStr);
}

/**
 * Sayı kısaltma – 1.2K, 3.5M gibi
 */
export function formatCompactNumber(num: number): string {
    return new Intl.NumberFormat('tr-TR', {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(num);
}
