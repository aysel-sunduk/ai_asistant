import { Stack } from 'expo-router';
export default function BlogLayout() {
    return (
        <Stack>
            <Stack.Screen name="create-post" options={{ title: 'Yeni Yazı' }} />
            <Stack.Screen name="post-detail" options={{ title: 'Yazı Detayı' }} />
        </Stack>
    );
}
