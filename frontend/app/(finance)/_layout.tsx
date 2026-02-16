import { Stack } from 'expo-router';

export default function FinanceLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="accounts" />
            <Stack.Screen name="transactions" />
            <Stack.Screen name="add-transaction" />
            <Stack.Screen name="categories" />
            <Stack.Screen name="investments" />
            <Stack.Screen name="exchange-rates" />
        </Stack>
    );
}
