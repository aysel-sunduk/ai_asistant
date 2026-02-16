import { Stack } from 'expo-router';

export default function WorkLayout() {
    return (
        <Stack>
            <Stack.Screen name="events" options={{ title: 'Toplantılar' }} />
            <Stack.Screen name="event-detail" options={{ title: 'Toplantı Detayı' }} />
            <Stack.Screen name="mail-draft" options={{ title: 'Mail Düzenle' }} />
        </Stack>
    );
}
