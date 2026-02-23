// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GameScore } from '../../src/models/game.model';

interface Props { score: GameScore; rank: number; }

export default function ScoreRow({ score, rank }: Props) {
    return (
        <View style={styles.row}>
            <Text style={styles.rank}>#{rank}</Text>
            <View style={styles.info}>
                <Text style={styles.game}>{score.gameType}</Text>
                {score.level && <Text style={styles.level}>Seviye {score.level}</Text>}
            </View>
            <Text style={styles.score}>{score.score}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    rank: { fontSize: 16, fontWeight: '700', color: '#6C63FF', width: 40 },
    info: { flex: 1 },
    game: { fontSize: 15, fontWeight: '600', color: '#11181C' },
    level: { fontSize: 12, color: '#9BA1A6' },
    score: { fontSize: 18, fontWeight: '700', color: '#11181C' },
});