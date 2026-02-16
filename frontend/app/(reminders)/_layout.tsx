import { Stack } from 'expo-router';
export default function RemindersLayout() {
    return (
        <Stack>
            <Stack.Screen name="reminders" options={{ title: 'Hatırlatıcılar' }} />
        </Stack>
    );
}
