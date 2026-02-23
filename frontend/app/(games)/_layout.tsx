// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Stack } from 'expo-router';
export default function GamesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="game-list" />
            <Stack.Screen name="memory" />
            <Stack.Screen name="quiz" />
            <Stack.Screen name="sudoku" />
            <Stack.Screen name="leaderboard" />
        </Stack>
    );
}