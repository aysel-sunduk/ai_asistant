import { Stack } from 'expo-router';
export default function ShoppingLayout() {
    return (
        <Stack>
            <Stack.Screen name="lists" options={{ title: 'Alışveriş Listeleri' }} />
            <Stack.Screen name="list-detail" options={{ title: 'Liste Detayı' }} />
        </Stack>
    );
}
