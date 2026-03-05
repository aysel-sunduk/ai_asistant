// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Stack } from 'expo-router';
export default function SocialLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="feed" />
            <Stack.Screen name="user-profile" />
            <Stack.Screen name="post-detail" />
        </Stack>
    );
}