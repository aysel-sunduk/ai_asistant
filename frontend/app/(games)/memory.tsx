import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatTime, getMemoryCards, saveGameResult, getBestResult } from '../../src/utils/game.utils';

const COLOR = '#A78BFA';
const GREEN = '#4ADE80';
const SCREEN_W = Dimensions.get('window').width;
const GRID_PAD = 16;
const GAP = 8;
const COLS = 4;
const CARD_SIZE = (SCREEN_W - GRID_PAD * 2 - GAP * (COLS - 1)) / COLS;

interface Card {
    id: number;
    emoji: string;
    flipped: boolean;
    matched: boolean;
}

export default function MemoryScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [firstPick, setFirstPick] = useState<number | null>(null);
    const [secondPick, setSecondPick] = useState<number | null>(null);
    const [moves, setMoves] = useState(0);
    const [matchCount, setMatchCount] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [started, setStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [locked, setLocked] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const elapsedRef = useRef(0); // Real-time elapsed for saving

    const initGame = useCallback(() => {
        const emojis = getMemoryCards(8);
        setCards(emojis.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
        setFirstPick(null);
        setSecondPick(null);
        setMoves(0);
        setMatchCount(0);
        setElapsed(0);
        elapsedRef.current = 0;
        setStarted(false);
        setFinished(false);
        setIsPaused(false);
        setLocked(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        initGame();
        getBestResult('memory').then(r => r && setBestTime(r.time));
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [initGame]);

    const startTimer = () => {
        if (started) return;
        setStarted(true);
        startTimeRef.current = Date.now() - elapsedRef.current;
        timerRef.current = setInterval(() => {
            const now = Date.now() - startTimeRef.current;
            elapsedRef.current = now;
            setElapsed(now);
        }, 100);
    };

    const handleCardPress = (index: number) => {
        if (locked || finished || isPaused) return;
        const card = cards[index];
        if (card.flipped || card.matched) return;

        startTimer();

        // Flip this card
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], flipped: true };
        setCards(newCards);

        if (firstPick === null) {
            // First card of pair
            setFirstPick(index);
        } else {
            // Second card of pair
            setSecondPick(index);
            setMoves(m => m + 1);
            setLocked(true);

            const firstCard = newCards[firstPick];
            const secondCard = newCards[index];

            if (firstCard.emoji === secondCard.emoji) {
                // Match!
                setTimeout(() => {
                    setCards(prev => {
                        const updated = [...prev];
                        updated[firstPick] = { ...updated[firstPick], matched: true };
                        updated[index] = { ...updated[index], matched: true };
                        return updated;
                    });
                    const newMatchCount = matchCount + 1;
                    setMatchCount(newMatchCount);

                    if (newMatchCount + 1 >= 8) {
                        // All matched — game won!
                        if (timerRef.current) clearInterval(timerRef.current);
                        setFinished(true);
                        const finalTime = elapsedRef.current;
                        saveGameResult('memory', finalTime);
                        getBestResult('memory').then(r => r && setBestTime(r.time));
                    }

                    setFirstPick(null);
                    setSecondPick(null);
                    setLocked(false);
                }, 300);
            } else {
                // No match — flip back
                setTimeout(() => {
                    setCards(prev => {
                        const updated = [...prev];
                        updated[firstPick] = { ...updated[firstPick], flipped: false };
                        updated[index] = { ...updated[index], flipped: false };
                        return updated;
                    });
                    setFirstPick(null);
                    setSecondPick(null);
                    setLocked(false);
                }, 800);
            }
        }
    };

    const handlePauseToggle = () => {
        if (finished) return;
        if (isPaused) {
            setIsPaused(false);
            startTimer();
            return;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setStarted(false);
        setIsPaused(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🧠 Hafıza Oyunu</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handlePauseToggle} style={styles.backBtn}>
                            <Ionicons name={isPaused ? 'play' : 'pause'} size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={initGame} style={styles.backBtn}>
                            <Ionicons name="refresh" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="time-outline" size={18} color="#FFD93D" />
                        <Text style={styles.statVal}>{formatTime(elapsed)}</Text>
                        <Text style={styles.statLabel}>Süre</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Ionicons name="swap-horizontal" size={18} color="#FF6B6B" />
                        <Text style={styles.statVal}>{moves}</Text>
                        <Text style={styles.statLabel}>Hamle</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Ionicons name="trophy" size={18} color={GREEN} />
                        <Text style={styles.statVal}>{bestTime !== null ? formatTime(bestTime) : '—'}</Text>
                        <Text style={styles.statLabel}>En İyi</Text>
                    </View>
                </View>
            </View>

            {/* Match counter */}
            <View style={styles.matchBar}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <View key={i} style={[styles.matchDot, i < matchCount && styles.matchDotFilled]} />
                ))}
            </View>

            {/* Card Grid */}
            <View style={styles.grid}>
                {cards.map((card, index) => (
                    <TouchableOpacity
                        key={card.id}
                        style={[
                            styles.card,
                            card.flipped && !card.matched && styles.cardFlipped,
                            card.matched && styles.cardMatched,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleCardPress(index)}
                        disabled={card.flipped || card.matched || locked || finished}
                    >
                        {card.flipped || card.matched ? (
                            <Text style={styles.emoji}>{card.emoji}</Text>
                        ) : (
                            <Ionicons name="help" size={28} color="rgba(255,255,255,0.8)" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Victory Overlay */}
            {finished && (
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalEmoji}>🎉</Text>
                        <Text style={styles.modalTitle}>Tebrikler!</Text>
                        <Text style={styles.modalSubtitle}>Tüm kartları eşleştirdin</Text>

                        <View style={styles.resultRow}>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Süre</Text>
                                <Text style={styles.resultVal}>{formatTime(elapsedRef.current)}</Text>
                            </View>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Hamle</Text>
                                <Text style={styles.resultVal}>{moves}</Text>
                            </View>
                        </View>

                        {bestTime !== null && (
                            <Text style={styles.bestText}>🏆 En İyi: {formatTime(bestTime)}</Text>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
                                <Text style={styles.btnSecondaryText}>Geri Dön</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnPrimary} onPress={() => { setFinished(false); initGame(); }}>
                                <Ionicons name="refresh" size={18} color="#fff" />
                                <Text style={styles.btnPrimaryText}>Tekrar Oyna</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {isPaused && !finished && (
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalEmoji}>⏸️</Text>
                        <Text style={styles.modalTitle}>Oyun Duraklatildi</Text>
                        <Text style={styles.modalSubtitle}>Devam et veya cikis yap</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
                                <Text style={styles.btnSecondaryText}>Oyundan Cik</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnPrimary} onPress={handlePauseToggle}>
                                <Ionicons name="play" size={18} color="#fff" />
                                <Text style={styles.btnPrimaryText}>Devam Et</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EFFF' },
    header: {
        backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        paddingBottom: 20, shadowColor: COLOR, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 24 },
    stat: { alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 2 },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

    matchBar: {
        flexDirection: 'row', justifyContent: 'center', gap: 8,
        paddingVertical: 16,
    },
    matchDot: {
        width: 28, height: 6, borderRadius: 3, backgroundColor: '#E0E0E0',
    },
    matchDotFilled: { backgroundColor: GREEN },

    grid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: GRID_PAD,
        gap: GAP,
    },
    card: {
        width: CARD_SIZE, height: CARD_SIZE * 1.1,
        borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#6C63FF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
    },
    cardFlipped: {
        backgroundColor: '#fff',
        borderWidth: 2, borderColor: COLOR,
    },
    cardMatched: {
        backgroundColor: '#E8FFE8',
        borderWidth: 2, borderColor: GREEN,
    },
    emoji: { fontSize: 32 },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modal: {
        backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%',
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },
    modalEmoji: { fontSize: 48 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginTop: 8 },
    modalSubtitle: { fontSize: 14, color: '#9BA1A6', marginTop: 4 },
    resultRow: { flexDirection: 'row', gap: 32, marginTop: 24, marginBottom: 12 },
    resultItem: { alignItems: 'center' },
    resultLabel: { fontSize: 12, color: '#9BA1A6', fontWeight: '600' },
    resultVal: { fontSize: 22, fontWeight: '800', color: COLOR, marginTop: 4 },
    bestText: { fontSize: 14, fontWeight: '700', color: GREEN, marginTop: 8 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    btnSecondary: {
        flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center',
    },
    btnSecondaryText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
    btnPrimary: {
        flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLOR,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
