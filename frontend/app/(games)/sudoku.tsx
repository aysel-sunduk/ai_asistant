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
} from 'react-native';
import { formatTime, generateSudoku, saveGameResult, getBestResult } from '../../src/utils/game.utils';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#A78BFA';
const GREEN = '#4ADE80';
const RED = '#EF4444';
const BLUE = '#6C63FF';
const SCREEN_W = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_W - 32, 380);
const CELL_SIZE = BOARD_SIZE / 9;

export default function SudokuScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const [puzzle, setPuzzle] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [board, setBoard] = useState<number[][]>([]);
    const [given, setGiven] = useState<boolean[][]>([]);
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [started, setStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [errors, setErrors] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef<number>(0);

    const initGame = useCallback(() => {
        const { puzzle: p, solution: s } = generateSudoku(36);
        setPuzzle(p);
        setSolution(s);
        setBoard(p.map(row => [...row]));
        setGiven(p.map(row => row.map(v => v !== 0)));
        setSelectedCell(null);
        setElapsed(0);
        setStarted(false);
        setFinished(false);
        setIsPaused(false);
        setErrors(0);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        initGame();
        getBestResult('sudoku').then(r => r && setBestTime(r.time));
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [initGame]);

    const startTimer = () => {
        if (started) return;
        setStarted(true);
        startRef.current = Date.now() - elapsed;
        timerRef.current = setInterval(() => {
            setElapsed(Date.now() - startRef.current);
        }, 100);
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

    const hasConflict = (board: number[][], row: number, col: number, num: number): boolean => {
        if (num === 0) return false;
        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && board[row][c] === num) return true;
        }
        // Check col
        for (let r = 0; r < 9; r++) {
            if (r !== row && board[r][col] === num) return true;
        }
        // Check 3×3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r !== row && c !== col && board[r][c] === num) return true;
            }
        }
        return false;
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || finished || isPaused) return;
        const [r, c] = selectedCell;
        if (given[r][c]) return;

        startTimer();

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = num;
        setBoard(newBoard);

        // Check if wrong
        if (num !== 0 && num !== solution[r][c]) {
            setErrors(e => e + 1);
        }

        // Check if complete
        const isComplete = newBoard.every((row, ri) =>
            row.every((val, ci) => val === solution[ri][ci])
        );
        if (isComplete) {
            if (timerRef.current) clearInterval(timerRef.current);
            setFinished(true);
            saveGameResult('sudoku', elapsed);
            getBestResult('sudoku').then(r => r && setBestTime(r.time));
        }
    };

    const handleErase = () => {
        if (!selectedCell || finished || isPaused) return;
        const [r, c] = selectedCell;
        if (given[r][c]) return;
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = 0;
        setBoard(newBoard);
    };

    const getCellStyle = (r: number, c: number) => {
        const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
        const isGiven = given[r]?.[c];
        const val = board[r]?.[c] || 0;
        const conflict = val > 0 && !isGiven && hasConflict(board, r, c, val);
        const isWrong = val > 0 && !isGiven && val !== solution[r]?.[c];
        const isSameRow = selectedCell && selectedCell[0] === r;
        const isSameCol = selectedCell && selectedCell[1] === c;
        const isSameBox = selectedCell && Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) && Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);
        const isHighlighted = isSameRow || isSameCol || isSameBox;

        return [
            styles.cell,
            isHighlighted && styles.cellHighlighted,
            isSelected && styles.cellSelected,
            isWrong && styles.cellConflict,
            // Thick borders for 3×3 boxes
            c % 3 === 0 && c !== 0 && styles.cellLeftThick,
            r % 3 === 0 && r !== 0 && styles.cellTopThick,
        ];
    };

    const getCellTextStyle = (r: number, c: number) => {
        const isGiven = given[r]?.[c];
        const val = board[r]?.[c] || 0;
        const isWrong = val > 0 && !isGiven && val !== solution[r]?.[c];
        return [
            styles.cellText,
            isGiven && styles.cellTextGiven,
            !isGiven && styles.cellTextUser,
            isWrong && styles.cellTextError,
        ];
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
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>🔢 Sudoku</Text>
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
                        <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                        <Text style={styles.statVal}>{errors}</Text>
                        <Text style={styles.statLabel}>Hata</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Ionicons name="trophy" size={18} color={GREEN} />
                        <Text style={styles.statVal}>{bestTime !== null ? formatTime(bestTime) : '—'}</Text>
                        <Text style={styles.statLabel}>En İyi</Text>
                    </View>
                </View>
            </View>

            {/* Board */}
            <View style={styles.boardContainer}>
                <View style={styles.board}>
                    {board.map((row, r) => (
                        <View key={r} style={styles.row}>
                            {row.map((val, c) => (
                                <TouchableOpacity
                                    key={`${r}-${c}`}
                                    style={getCellStyle(r, c)}
                                    activeOpacity={0.6}
                                    onPress={() => setSelectedCell([r, c])}
                                    disabled={isPaused}
                                >
                                    {val > 0 && (
                                        <Text style={getCellTextStyle(r, c)}>{val}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </View>

            {/* Number Pad */}
            <View style={styles.numPad}>
                <View style={styles.numRow}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                        // Count how many of this number remain
                        const placed = board.flat().filter(v => v === num).length;
                        const allPlaced = placed >= 9;
                        return (
                            <TouchableOpacity
                                key={num}
                                style={[styles.numBtn, allPlaced && styles.numBtnDone]}
                                onPress={() => handleNumberInput(num)}
                                disabled={allPlaced || finished || isPaused}
                                activeOpacity={0.6}
                            >
                                <Text style={[styles.numText, allPlaced && styles.numTextDone]}>{num}</Text>
                                {!allPlaced && <Text style={styles.numCount}>{9 - placed}</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TouchableOpacity style={styles.eraseBtn} onPress={handleErase} disabled={isPaused}>
                    <Ionicons name="backspace-outline" size={22} color={COLOR} />
                    <Text style={styles.eraseBtnText}>Sil</Text>
                </TouchableOpacity>
            </View>

            {/* Victory Overlay */}
            {finished && (
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalEmoji}>🎉</Text>
                        <Text style={styles.modalTitle}>Harika!</Text>
                        <Text style={styles.modalSubtitle}>Sudokuyu tamamladin</Text>

                        <View style={styles.resultRow}>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Süre</Text>
                                <Text style={styles.resultVal}>{formatTime(elapsed)}</Text>
                            </View>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Hata</Text>
                                <Text style={styles.resultVal}>{errors}</Text>
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
                                <Text style={styles.btnPrimaryText}>Yeni Oyun</Text>
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
    statVal: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2 },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

    boardContainer: { alignItems: 'center', marginTop: 16, paddingHorizontal: 16 },
    board: {
        width: BOARD_SIZE, height: BOARD_SIZE,
        borderWidth: 2.5, borderColor: '#1A1A2E', borderRadius: 8, overflow: 'hidden',
        backgroundColor: '#fff',
    },
    row: { flexDirection: 'row', flex: 1 },
    cell: {
        width: CELL_SIZE, flex: 1,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0.5, borderColor: '#E0E0E0',
    },
    cellSelected: { backgroundColor: COLOR + '30' },
    cellHighlighted: { backgroundColor: COLOR + '10' },
    cellConflict: { backgroundColor: RED + '20' },
    cellLeftThick: { borderLeftWidth: 2, borderLeftColor: '#1A1A2E' },
    cellTopThick: { borderTopWidth: 2, borderTopColor: '#1A1A2E' },
    cellText: { fontSize: CELL_SIZE * 0.45, fontWeight: '700' },
    cellTextGiven: { color: '#1A1A2E' },
    cellTextUser: { color: BLUE },
    cellTextError: { color: RED },

    numPad: { paddingHorizontal: 20, marginTop: 20 },
    numRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    numBtn: {
        width: (SCREEN_W - 40 - 48) / 9, aspectRatio: 1,
        borderRadius: 12, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    numBtnDone: { backgroundColor: '#F0F0F0', opacity: 0.5 },
    numText: { fontSize: 18, fontWeight: '800', color: BLUE },
    numTextDone: { color: '#C4C4C4' },
    numCount: { fontSize: 9, color: '#9BA1A6', fontWeight: '600', marginTop: 1 },
    eraseBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        marginTop: 10, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    eraseBtnText: { fontSize: 14, fontWeight: '700', color: COLOR },

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
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});