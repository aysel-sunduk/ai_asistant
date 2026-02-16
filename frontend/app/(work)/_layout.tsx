import { Stack } from 'expo-router';
export default function WorkLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="events" />
            <Stack.Screen name="event-detail" />
            <Stack.Screen name="mail-draft" />
        </Stack>
    );
}
