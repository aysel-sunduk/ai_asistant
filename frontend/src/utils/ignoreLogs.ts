// Kisa aciklama: Destekleyici modul kodu icerir.
import { LogBox } from 'react-native';

export function ignoreLogs() {
    // Ignore specific YellowBox warnings
    LogBox.ignoreLogs([
        'Require cycle:',
        'fontFamily',
        'rate limit',
        '400',
        'AlphaVantage',
    ]);

    // Check if we've already overridden console.error to avoid double-wrapping
    if ((console as any).isOverridden) return;

    const originalConsoleError = console.error;

    console.error = (...args: any[]) => {
        const errorString = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        // Keywords to filter out from RedBox (downgrade to warn or log)
        const ignoredKeywords = [
            'AlphaVantage',
            'rate limit',
            'status code 400',
            'Dashboard fetch failed',
            'Request failed with status code 400',
            'Network Error',
            'ECONNABORTED',
            'timeout of',
            'ERR_NETWORK',
            '[AxiosError: Network Error]',
            'Fav Currencies fetch failed',
            'Fav Investments fetch failed',
            'Failed to load currency holdings'
        ];

        const shouldIgnore = ignoredKeywords.some(keyword =>
            errorString.includes(keyword)
        );

        if (shouldIgnore) {
            // Downgrade to warning so it doesn't show as RedBox but still visible in terminal
            console.warn('[Suppressed Error (Network/API)]', ...args);
        } else {
            // Pass through other errors normally
            originalConsoleError(...args);
        }
    };

    (console as any).isOverridden = true;
    console.log('[Logs] Global error handler initialized to suppress 400/AlphaVantage errors.');
}