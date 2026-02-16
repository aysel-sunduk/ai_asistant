import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { ShoppingList } from '../../src/models/shopping.model';
import Card from '../ui/Card';

interface Props { list: ShoppingList; onPress?: () => void; }

export default function ShoppingListCard({ list, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <Text style={styles.name}>{list.name}</Text>
                <Text style={styles.count}>{list.completedCount}/{list.itemCount} öğe tamamlandı</Text>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    name: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    count: { fontSize: 13, color: '#9BA1A6', marginTop: 4 },
});
