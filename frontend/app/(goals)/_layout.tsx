import { Stack } from 'expo-router';
export default function GoalsLayout() {
    return (
        <Stack>
            <Stack.Screen name="goals" options={{ title: 'Hedefler' }} />
            <Stack.Screen name="goal-detail" options={{ title: 'Hedef Detayı' }} />
        </Stack>
    );
}
