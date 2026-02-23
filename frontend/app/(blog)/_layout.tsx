// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Stack } from 'expo-router';
export default function BlogLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="create-post" />
            <Stack.Screen name="post-detail" />
        </Stack>
    );
}