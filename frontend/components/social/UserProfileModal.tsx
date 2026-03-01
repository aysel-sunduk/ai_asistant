// Kisa aciklama: Kullanici profil bilgilerini gosteren modal bileşeni.
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { socialService } from '../../services/social.service';
import type { PublicProfileResponse } from '../../src/models/social.model';

const COLOR = '#34D399';

interface Props {
    visible: boolean;
    userId: string | null;
    onClose: () => void;
}

export default function UserProfileModal({ visible, userId, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !userId) {
            setProfile(null);
            setError(null);
            return;
        }
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await socialService.getPublicProfile(userId);
                setProfile(data);
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Profil bilgisi alinamadi.');
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [visible, userId]);

    const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Kullanici';

    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={styles.card}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={20} color="#64748B" />
                    </TouchableOpacity>

                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="small" color={COLOR} />
                            <Text style={styles.loadingText}>Yukleniyor...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centered}>
                            <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : profile ? (
                        <>
                            {/* Avatar */}
                            <View style={styles.avatarWrap}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{initials}</Text>
                                </View>
                                <Text style={styles.name}>{fullName}</Text>
                                <Text style={styles.visibility}>
                                    {profile.profileVisibility === 'private' ? '🔒 Ozel Hesap' : '🌐 Herkese Acik'}
                                </Text>
                            </View>

                            {/* Stats Row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>{profile.followersCount}</Text>
                                    <Text style={styles.statLabel}>Takipci</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>{profile.followingCount}</Text>
                                    <Text style={styles.statLabel}>Takip</Text>
                                </View>
                            </View>

                            {/* Info Rows */}
                            <View style={styles.infoSection}>
                                {profile.email ? (
                                    <TouchableOpacity
                                        style={styles.infoRow}
                                        onPress={() => Linking.openURL(`mailto:${profile.email}`)}
                                    >
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="mail-outline" size={18} color={COLOR} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoLabel}>E-posta</Text>
                                            <Text style={styles.infoValue}>{profile.email}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="mail-outline" size={18} color="#CBD5E1" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoLabel}>E-posta</Text>
                                            <Text style={styles.infoHidden}>Gizli</Text>
                                        </View>
                                    </View>
                                )}

                                {profile.phone ? (
                                    <TouchableOpacity
                                        style={styles.infoRow}
                                        onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                                    >
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="call-outline" size={18} color={COLOR} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoLabel}>Telefon</Text>
                                            <Text style={styles.infoValue}>{profile.phone}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="call-outline" size={18} color="#CBD5E1" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoLabel}>Telefon</Text>
                                            <Text style={styles.infoHidden}>Gizli</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </>
                    ) : null}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 99,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    centered: { alignItems: 'center', paddingVertical: 30 },
    loadingText: { marginTop: 10, fontSize: 13, color: '#64748B' },
    errorText: { marginTop: 10, fontSize: 13, color: '#EF4444', textAlign: 'center' },
    avatarWrap: { alignItems: 'center', marginBottom: 16 },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 99,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    avatarText: { fontSize: 24, fontWeight: '900', color: '#047857' },
    name: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
    visibility: { marginTop: 4, fontSize: 12, color: '#64748B' },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 24,
    },
    statItem: { alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    statLabel: { marginTop: 2, fontSize: 11, color: '#64748B', fontWeight: '600' },
    statDivider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
    infoSection: { gap: 8 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        gap: 10,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    infoValue: { fontSize: 14, color: '#0F172A', fontWeight: '700', marginTop: 1 },
    infoHidden: { fontSize: 13, color: '#CBD5E1', fontStyle: 'italic', marginTop: 1 },
});
