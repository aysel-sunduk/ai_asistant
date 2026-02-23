// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ShoppingItem } from '../../src/models/shopping.model';

interface Props {
    item: ShoppingItem;
    onToggle?: () => void;
    onDelete?: () => void;
}

export default function ShoppingItemRow({ item, onToggle, onDelete }: Props) {
    const quantityText = item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`;

    return (
        <View style={styles.row}>
            <TouchableOpacity onPress={onToggle} style={styles.left}>
                <Text style={styles.check}>{item.isChecked ? '[x]' : '[ ]'}</Text>
                <Text style={[styles.name, item.isChecked && styles.checked]}>{item.name}</Text>
                <Text style={styles.qty}>{quantityText}</Text>
            </TouchableOpacity>
            {onDelete ? (
                <TouchableOpacity onPress={onDelete}>
                    <Text style={styles.delete}>Sil</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    check: { fontSize: 14, color: '#475569' },
    name: { fontSize: 15, color: '#11181C' },
    checked: { textDecorationLine: 'line-through', color: '#9BA1A6' },
    qty: { fontSize: 13, color: '#9BA1A6' },
    delete: { fontSize: 13, color: '#DC2626', fontWeight: '700', padding: 4 },
});