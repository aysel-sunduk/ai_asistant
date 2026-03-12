// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Stack } from 'expo-router';
export default function WorkLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="events" />
            <Stack.Screen name="create-event" />
            <Stack.Screen name="event-detail" />
            <Stack.Screen name="mail-draft" />
            <Stack.Screen name="my-interviews" />
            <Stack.Screen name="interview-detail" />
            <Stack.Screen name="interview-setup" />
            <Stack.Screen name="interview-session" />
        </Stack>
    );
}
