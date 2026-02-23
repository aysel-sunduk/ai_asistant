// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Stack } from 'expo-router';
export default function FamilyLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="contacts" />
            <Stack.Screen name="members" />
            <Stack.Screen name="contact-detail" />
        </Stack>
    );
}