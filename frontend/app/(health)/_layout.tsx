import { Stack } from 'expo-router';
export default function HealthLayout() {
    return (
        <Stack>
            <Stack.Screen name="water-tracker" options={{ title: 'Su Takip' }} />
            <Stack.Screen name="exercise-log" options={{ title: 'Spor Takip' }} />
            <Stack.Screen name="meal-log" options={{ title: 'Öğün Takip' }} />
            <Stack.Screen name="diet-plan" options={{ title: 'Diyet Önerisi' }} />
        </Stack>
    );
}
