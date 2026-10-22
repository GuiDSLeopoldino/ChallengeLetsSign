import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, Document } from '@/services/api';
import { formatDate, getSignerStatusLabel, formatFileSize } from '@/lib/api';

export default function PendingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await api.listDocuments(undefined, 'pendentes');
      setDocuments(data);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar documentos pendentes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const renderItem = ({ item }: { item: Document }) => {
    const statusConfig = getSignerStatusLabel(item.minhaSituacao || 'PENDING');

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/documents/${item.id}`)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={24} color="#EC4899" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.titulo}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.totalPaginas} página(s)</Text>
              <Text style={styles.metaText}>v{item.versao}</Text>
            </View>
            <Text style={styles.ownerText}>De: {item.owner?.nome}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Seu papel</Text>
            <Text style={styles.infoValue}>{getSignerStatusLabel(item.meuPapel || 'CONTRATADO').label}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Enviado em</Text>
            <Text style={styles.infoValue}>{item.enviadoEm ? formatDate(item.enviadoEm) : '—'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Carregando pendentes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pendentes</Text>
        <Text style={styles.headerSubtitle}>{documents.length} documento(s) aguardando sua assinatura</Text>
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#22C55E" />
          <Text style={styles.emptyTitle}>Nenhum documento pendente</Text>
          <Text style={styles.emptySubtitle}>Todos em dia! 🎉</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchDocuments} colors={['#EC4899']} />
          }
        />
      )}
    </View>
  );
}