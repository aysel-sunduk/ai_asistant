// @ts-nocheck
// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Comment } from '../../src/models/blog.model';
import { formatRelativeTime } from '../../src/utils/format';

interface Props { comment: Comment; }

export default function CommentItem({ comment }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.content}>{comment.content}</Text>
            <Text style={styles.time}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    content: { fontSize: 14, color: '#11181C' },
    time: { fontSize: 12, color: '#9BA1A6', marginTop: 4 },
});