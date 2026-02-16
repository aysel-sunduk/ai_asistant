import { Stack } from 'expo-router';

export default function FinanceLayout() {
    return (
        <Stack>
            <Stack.Screen name="accounts" options={{ title: 'Hesaplar' }} />
            <Stack.Screen name="transactions" options={{ title: 'Gelir / Gider' }} />
            <Stack.Screen name="add-transaction" options={{ title: 'İşlem Ekle' }} />
            <Stack.Screen name="categories" options={{ title: 'Kategoriler' }} />
            <Stack.Screen name="investments" options={{ title: 'Yatırımlar' }} />
            <Stack.Screen name="exchange-rates" options={{ title: 'Güncel Kurlar' }} />
        </Stack>
    );
}
