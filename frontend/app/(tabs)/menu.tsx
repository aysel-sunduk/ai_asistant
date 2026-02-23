// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useMenuStore } from '../../src/store/menu.store';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function MenuScreen() {
    const router = useRouter();
    const { modules, isLoaded, loadOrder, moveUp, moveDown } = useMenuStore();
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isLoaded) loadOrder();
    }, [isLoaded]);

    const handlePress = (route: string) => {
        if (isEditing) return;
        router.push(route as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Menü</Text>
                    <Text style={styles.headerSubtitle}>Tüm modüller</Text>
                </View>
                <TouchableOpacity
                    style={[styles.editButton, isEditing && styles.editButtonActive]}
                    onPress={() => setIsEditing(!isEditing)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isEditing ? 'checkmark' : 'create-outline'}
                        size={18}
                        color={isEditing ? '#fff' : PURPLE}
                    />
                    <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
                        {isEditing ? 'Bitti' : 'Düzenle'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Grid */}
                <View style={styles.grid}>
                    {modules.map((mod, index) => (
                        <TouchableOpacity
                            key={mod.id}
                            style={[styles.card, isEditing && styles.cardEditing]}
                            activeOpacity={isEditing ? 1 : 0.7}
                            onPress={() => handlePress(mod.route)}
                        >
                            {/* Edit Controls */}
                            {isEditing && (
                                <View style={styles.editControls}>
                                    <TouchableOpacity
                                        style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                                        onPress={() => moveUp(index)}
                                        disabled={index === 0}
                                    >
                                        <Ionicons
                                            name="chevron-up"
                                            size={16}
                                            color={index === 0 ? '#D0D0D0' : '#666'}
                                        />
                                    </TouchableOpacity>
                                    <Text style={styles.orderNumber}>{index + 1}</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.arrowBtn,
                                            index === modules.length - 1 && styles.arrowBtnDisabled,
                                        ]}
                                        onPress={() => moveDown(index)}
                                        disabled={index === modules.length - 1}
                                    >
                                        <Ionicons
                                            name="chevron-down"
                                            size={16}
                                            color={index === modules.length - 1 ? '#D0D0D0' : '#666'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Icon */}
                            <View style={[styles.iconCircle, { backgroundColor: mod.color + '18' }]}>
                                <Ionicons name={mod.icon as IoniconsName} size={28} color={mod.color} />
                            </View>

                            {/* Title */}
                            <Text style={styles.cardTitle}>{mod.title}</Text>

                            {/* Arrow */}
                            {!isEditing && (
                                <View style={styles.cardArrow}>
                                    <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Edit Mode Info */}
                {isEditing && (
                    <View style={styles.editInfo}>
                        <Ionicons name="information-circle-outline" size={18} color={GRAY} />
                        <Text style={styles.editInfoText}>
                            Yukarı/aşağı okları kullanarak sıralamayı değiştirin
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 44,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A2E',
    },
    headerSubtitle: {
        fontSize: 14,
        color: GRAY,
        marginTop: 2,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: PURPLE + '12',
    },
    editButtonActive: {
        backgroundColor: PURPLE,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: PURPLE,
    },
    editButtonTextActive: {
        color: '#fff',
    },

    /* Scroll */
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },

    /* Grid */
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '48%' as any,
        flexBasis: '47%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
    },
    cardEditing: {
        borderWidth: 1.5,
        borderColor: PURPLE + '30',
        borderStyle: 'dashed',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A2E',
        textAlign: 'center',
    },
    cardArrow: {
        position: 'absolute',
        top: 14,
        right: 14,
    },

    /* Edit Controls */
    editControls: {
        position: 'absolute',
        top: 8,
        right: 8,
        alignItems: 'center',
        gap: 2,
        zIndex: 10,
    },
    arrowBtn: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowBtnDisabled: {
        opacity: 0.4,
    },
    orderNumber: {
        fontSize: 11,
        fontWeight: '800',
        color: PURPLE,
    },

    /* Edit Info */
    editInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 14,
    },
    editInfoText: {
        fontSize: 13,
        color: GRAY,
        flex: 1,
    },
});