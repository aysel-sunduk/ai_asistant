// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    PanResponder,
} from 'react-native';
import { formatTime, saveGameResult, getBestResult } from '../../src/utils/game.utils';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#A78BFA';
const GREEN = '#4ADE80';
const SCREEN_W = Dimensions.get('window').width;
const BOARD_PAD = 16;
const BOARD_GAP = 8;
const BOARD_SIZE = Math.min(SCREEN_W - 32, 400);
const CELL_SIZE = (BOARD_SIZE - BOARD_GAP * 5) / 4;

type Grid = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
    0: { bg: '#CDC1B4', text: '#CDC1B4' },
    2: { bg: '#EEE4DA', text: '#776E65' },
    4: { bg: '#EDE0C8', text: '#776E65' },
    8: { bg: '#F2B179', text: '#F9F6F2' },
    16: { bg: '#F59563', text: '#F9F6F2' },
    32: { bg: '#F67C5F', text: '#F9F6F2' },
    64: { bg: '#F65E3B', text: '#F9F6F2' },
    128: { bg: '#EDCF72', text: '#F9F6F2' },
    256: { bg: '#EDCC61', text: '#F9F6F2' },
    512: { bg: '#EDC850', text: '#F9F6F2' },
    1024: { bg: '#EDC53F', text: '#F9F6F2' },
    2048: { bg: '#EDC22E', text: '#F9F6F2' },
    4096: { bg: '#3C3A32', text: '#F9F6F2' },
};

function createEmptyGrid(): Grid {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function addRandomTile(grid: Grid): Grid {
    const newGrid = grid.map(r => [...r]);
    const empty: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (newGrid[r][c] === 0) empty.push([r, c]);
        }
    }
    if (empty.length === 0) return newGrid;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
}

function rotateGrid(grid: Grid): Grid {
    // 90° clockwise
    const n = grid.length;
    return Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => grid[n - 1 - c][r])
    );
}

function slideLeft(grid: Grid): { grid: Grid; score: number; moved: boolean } {
    let score = 0;
    let moved = false;
    const newGrid = grid.map(row => {
        // Remove zeros
        let filtered = row.filter(v => v !== 0);
        // Merge adjacent equal
        const merged: number[] = [];
        let i = 0;
        while (i < filtered.length) {
            if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
                const val = filtered[i] * 2;
                merged.push(val);
                score += val;
                i += 2;
            } else {
                merged.push(filtered[i]);
                i++;
            }
        }
        // Pad with zeros
        while (merged.length < 4) merged.push(0);
        // Check if moved
        for (let j = 0; j < 4; j++) {
            if (merged[j] !== row[j]) moved = true;
        }
        return merged;
    });
    return { grid: newGrid, score, moved };
}

function move(grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { grid: Grid; score: number; moved: boolean } {
    let rotated = grid;
    let rotations = 0;

    switch (direction) {
        case 'left': rotations = 0; break;
        case 'down': rotations = 1; break;
        case 'right': rotations = 2; break;
        case 'up': rotations = 3; break;
    }

    for (let i = 0; i < rotations; i++) rotated = rotateGrid(rotated);
    const result = slideLeft(rotated);
    let resultGrid = result.grid;
    for (let i = 0; i < (4 - rotations) % 4; i++) resultGrid = rotateGrid(resultGrid);

    return { grid: resultGrid, score: result.score, moved: result.moved };
}

function canMove(grid: Grid): boolean {
    // Any empty cell?
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return true;
        }
    }
    // Any adjacent same values?
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const val = grid[r][c];
            if (c + 1 < 4 && grid[r][c + 1] === val) return true;
            if (r + 1 < 4 && grid[r + 1][c] === val) return true;
        }
    }
    return false;
}

function hasWon(grid: Grid): boolean {
    return grid.some(row => row.some(v => v >= 2048));
}

export default function Game2048Screen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const [grid, setGrid] = useState<Grid>(createEmptyGrid());
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [started, setStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const elapsedRef = useRef(0);

    const initGame = useCallback(() => {
        let g = createEmptyGrid();
        g = addRandomTile(g);
        g = addRandomTile(g);
        setGrid(g);
        setScore(0);
        setElapsed(0);
        elapsedRef.current = 0;
        setStarted(false);
        setGameOver(false);
        setWon(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        initGame();
        getBestResult('2048').then(r => {
            if (r) {
                setBestTime(r.time);
                setBest(r.score || 0);
            }
        });
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

    const handlePauseToggle = () => {
        if (gameOver || won) return;
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

    const handleMoveRef = useRef<(direction: 'left' | 'right' | 'up' | 'down') => void>(() => { });

    const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
        if (gameOver || won || isPaused) return;

        startTimer();

        const result = move(grid, direction);
        if (!result.moved) return;

        const newScore = score + result.score;
        const newGrid = addRandomTile(result.grid);
        setGrid(newGrid);
        setScore(newScore);

        if (hasWon(newGrid) && !won) {
            if (timerRef.current) clearInterval(timerRef.current);
            setWon(true);
            saveGameResult('2048', elapsedRef.current, newScore);
            getBestResult('2048').then(r => {
                if (r) {
                    setBestTime(r.time);
                    setBest(r.score || 0);
                }
            });
        } else if (!canMove(newGrid)) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameOver(true);
            saveGameResult('2048', elapsedRef.current, newScore);
            getBestResult('2048').then(r => {
                if (r) {
                    setBestTime(r.time);
                    setBest(r.score || 0);
                }
            });
        }
    }, [grid, score, gameOver, won, started, isPaused]);

    useEffect(() => { handleMoveRef.current = handleMove; }, [handleMove]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => {
                return Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10;
            },
            onPanResponderRelease: (_, gs) => {
                const { dx, dy } = gs;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                if (absDx < 20 && absDy < 20) return; // Too small

                if (absDx > absDy) {
                    handleMoveRef.current(dx > 0 ? 'right' : 'left');
                } else {
                    handleMoveRef.current(dy > 0 ? 'down' : 'up');
                }
            },
        })
    ).current;

    const getTileStyle = (value: number) => {
        const colors = TILE_COLORS[value] || TILE_COLORS[4096];
        return {
            backgroundColor: colors.bg,
        };
    };

    const getTileTextStyle = (value: number) => {
        const colors = TILE_COLORS[value] || TILE_COLORS[4096];
        return {
            color: colors.text,
            fontSize: value >= 1024 ? 18 : value >= 128 ? 22 : 26,
        };
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>🧩 2048</Text>
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
                        <Text style={styles.statVal}>{score}</Text>
                        <Text style={styles.statLabel}>Skor</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statVal}>{formatTime(elapsed)}</Text>
                        <Text style={styles.statLabel}>Süre</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statVal}>{best}</Text>
                        <Text style={styles.statLabel}>En İyi</Text>
                    </View>
                </View>
            </View>

            {/* Game Board */}
            <View style={styles.boardArea} {...panResponder.panHandlers}>
                <View style={styles.board}>
                    {grid.map((row, r) => (
                        <View key={r} style={styles.row}>
                            {row.map((val, c) => (
                                <View key={`${r}-${c}`} style={[styles.tile, getTileStyle(val)]}>
                                    {val > 0 && (
                                        <Text style={[styles.tileText, getTileTextStyle(val)]}>
                                            {val}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                <Text style={[styles.hint, isDark && styles.subTextDark]}>↕ ↔ Kaydırarak oyna</Text>

                {/* Direction buttons for accessibility */}
                <View style={styles.controls}>
                    <View style={styles.controlRow}>
                        <View style={styles.controlSpacer} />
                        <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove('up')} disabled={isPaused}>
                            <Ionicons name="chevron-up" size={28} color={COLOR} />
                        </TouchableOpacity>
                        <View style={styles.controlSpacer} />
                    </View>
                    <View style={styles.controlRow}>
                        <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove('left')} disabled={isPaused}>
                            <Ionicons name="chevron-back" size={28} color={COLOR} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove('down')} disabled={isPaused}>
                            <Ionicons name="chevron-down" size={28} color={COLOR} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn} onPress={() => handleMove('right')} disabled={isPaused}>
                            <Ionicons name="chevron-forward" size={28} color={COLOR} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Win / Game Over Overlay */}
            {(won || gameOver) && (
                <View style={styles.overlay}>
                    <View style={[styles.modal, isDark && styles.modalDark]}>
                        <Text style={styles.modalEmoji}>{won ? '🏆' : '💪'}</Text>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>{won ? 'Muhteşem!' : 'Oyun Bitti!'}</Text>
                        <Text style={[styles.modalSubtitle, isDark && styles.subTextDark]}>
                            {won ? '2048 taşına ulaştın!' : 'Hareket kalmadı'}
                        </Text>

                        <View style={styles.resultRow}>
                            <View style={styles.resultItem}>
                                <Text style={[styles.resultLabel, isDark && styles.subTextDark]}>Skor</Text>
                                <Text style={styles.resultVal}>{score}</Text>
                            </View>
                            <View style={styles.resultItem}>
                                <Text style={[styles.resultLabel, isDark && styles.subTextDark]}>Süre</Text>
                                <Text style={styles.resultVal}>{formatTime(elapsedRef.current)}</Text>
                            </View>
                        </View>

                        {best > 0 && (
                            <Text style={styles.bestText}>🏆 En İyi Skor: {best}</Text>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.btnSecondary, isDark && styles.btnSecondaryDark]} onPress={() => router.back()}>
                                <Text style={[styles.btnSecondaryText, isDark && styles.textDark]}>Geri Dön</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnPrimary} onPress={() => { setWon(false); setGameOver(false); initGame(); }}>
                                <Ionicons name="refresh" size={18} color="#fff" />
                                <Text style={styles.btnPrimaryText}>Tekrar Oyna</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {isPaused && !won && !gameOver && (
                <View style={styles.overlay}>
                    <View style={[styles.modal, isDark && styles.modalDark]}>
                        <Text style={styles.modalEmoji}>⏸️</Text>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>Oyun Duraklatildi</Text>
                        <Text style={[styles.modalSubtitle, isDark && styles.subTextDark]}>Devam et veya cikis yap</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.btnSecondary, isDark && styles.btnSecondaryDark]} onPress={() => router.back()}>
                                <Text style={[styles.btnSecondaryText, isDark && styles.textDark]}>Oyundan Cik</Text>
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
    container: { flex: 1, backgroundColor: '#FAF8EF' },
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

    boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    board: {
        width: BOARD_SIZE, height: BOARD_SIZE,
        backgroundColor: '#BBADA0', borderRadius: 12, padding: BOARD_GAP,
        gap: BOARD_GAP,
    },
    row: { flexDirection: 'row', flex: 1, gap: BOARD_GAP },
    tile: {
        flex: 1, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    tileText: { fontWeight: '800' },

    hint: { fontSize: 12, color: '#9BA1A6', marginTop: 12, textAlign: 'center' },

    controls: { marginTop: 16, gap: 4 },
    controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
    controlBtn: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    controlBtnDark: { backgroundColor: '#1E293B', shadowOpacity: 0 },
    controlSpacer: { width: 52 },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modal: {
        backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%',
        alignItems: 'center',
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

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    modalDark: { backgroundColor: '#111827' },
    btnSecondaryDark: { backgroundColor: '#1E293B' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});