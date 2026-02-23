// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Stack } from 'expo-router';
export default function GoalsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="goals" />
            <Stack.Screen name="goal-detail" />
        </Stack>
    );
}