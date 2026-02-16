import { Stack } from 'expo-router';
export default function SocialLayout() {
    return (
        <Stack>
            <Stack.Screen name="feed" options={{ title: 'Akış' }} />
            <Stack.Screen name="user-profile" options={{ title: 'Kullanıcı Profili' }} />
        </Stack>
    );
}
