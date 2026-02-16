import { Stack } from 'expo-router';
export default function GamesLayout() {
    return (
        <Stack>
            <Stack.Screen name="game-list" options={{ title: 'Oyunlar' }} />
            <Stack.Screen name="sudoku" options={{ title: 'Sudoku' }} />
            <Stack.Screen name="quiz" options={{ title: 'Bilgi Yarışması' }} />
            <Stack.Screen name="memory" options={{ title: 'Hafıza Oyunu' }} />
            <Stack.Screen name="leaderboard" options={{ title: 'Skor Tablosu' }} />
        </Stack>
    );
}
