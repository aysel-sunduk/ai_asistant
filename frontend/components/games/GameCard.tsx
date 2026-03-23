// @ts-nocheck
// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { GameType } from '../../src/models/game.model';
import Card from '../ui/Card';

interface Props { gameType: GameType; title: string; icon: string; onPress?: () => void; }

export default function GameCard({ gameType, title, icon, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.card}>
                <Text style={styles.icon}>{icon}</Text>
                <Text style={styles.title}>{title}</Text>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: { alignItems: 'center', padding: 24 },
    icon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 16, fontWeight: '600', color: '#11181C' },
});