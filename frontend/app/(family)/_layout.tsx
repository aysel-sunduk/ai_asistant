import { Stack } from 'expo-router';
export default function FamilyLayout() {
    return (
        <Stack>
            <Stack.Screen name="contacts" options={{ title: 'Kişiler' }} />
            <Stack.Screen name="contact-detail" options={{ title: 'Kişi Detayı' }} />
        </Stack>
    );
}
