import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, Document } from '@/services/api';
import { formatDate, getStatusLabel, getSignerStatusLabel, formatFileSize } from '@/lib/api';

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const renderItem = ({ item }: { item: Document }) => {
    const statusConfig = getStatusLabel(item.status);
    const isOwner = item.papel === 'OWNER';

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
              <Text style={styles.metaText}>{formatFileSize(item.tamanhoBytes)}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {isOwner && item.totalSignatarios !== undefined && (
          <View style={styles.signersRow}>
            <View style={styles.signerStat}>
              <Text style={styles.signerStatValue}>{item.assinados || 0}/{item.totalSignatarios}</Text>
              <Text style={styles.signerStatLabel}>Assinaram</Text>
            </View>
            <View style={styles.signerStat}>
              <Text style={styles.signerStatValue}>{formatDate(item.criadoEm)}</Text>
              <Text style={styles.signerStatLabel}>Criado</Text>
            </View>
            {item.enviadoEm && (
              <View style={styles.signerStat}>
                <Text style={styles.signerStatValue}>{formatDate(item.enviadoEm)}</Text>
                <Text style={styles.signerStatLabel}>Enviado</Text>
              </View>
            )}
          </View>
        )}

        {!isOwner && item.minhaSituacao && (
          <View style={styles.myStatusRow}>
            <Text style={styles.myStatusLabel}>Sua situação:</Text>
            <View style={styles.myStatusBadge}>
              <Text style={styles.myStatusText}>{getSignerStatusLabel(item.minhaSituacao).label}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Carregando documentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Documentos</Text>
        {documents.length > 0 && (
          <Text style={styles.headerSubtitle}>{documents.length} documento(s)</Text>
        )}
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Nenhum documento</Text>
          <Text style={styles.emptySubtitle}>
            {user?.role === 'ADMIN' ? 'Crie seu primeiro documento no painel web' : 'Você receberá documentos para assinar aqui'}
          </Text>
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhum documento</Text>
            </View>
          }
        />
      )}
    </View>
  );
}