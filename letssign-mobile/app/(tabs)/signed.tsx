import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, Document } from '@/services/api';
import { formatDate, formatFileSize } from '@/lib/api';

export default function SignedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await api.listDocuments(undefined, 'assinados');
      setDocuments(data);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar documentos assinados');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/documents/${item.id}`)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text-outline" size={24} color="#22C55E" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.titulo}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{item.totalPaginas} página(s)</Text>
            <Text style={styles.metaText}>v{item.versao}</Text>
            <Text style={styles.metaText}>{formatFileSize(item.tamanhoBytes)}</Text>
          </View>
          <Text style={styles.ownerText}>De: {item.owner?.nome}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Assinado em</Text>
            <Text style={styles.infoValue}>{item.assinadoEm ? formatDate(item.assinadoEm) : formatDate(item.concluidoEm || item.atualizadoEm)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Seu papel</Text>
            <Text style={styles.infoValue}>{getSignerStatusLabel(item.meuPapel || 'CONTRATADO').label}</Text>
          </View>
        </View>

        {item.possuiDocumentoFinal && (
          <View style={styles.downloadHint}>
            <Ionicons name="download-outline" size={16} color="#22C55E" />
            <Text style={styles.downloadHintText}>PDF final disponível</Text>
          </View>
        )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Carregando assinados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assinados</Text>
        <Text style={styles.headerSubtitle}>{documents.length} documento(s) concluído(s)</Text>
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Nenhum documento assinado</Text>
          <Text style={styles.emptySubtitle}>Documentos que você assinou aparecerão aqui</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchDocuments} colors={['#22C55E']} />
          }
        />
      )}
    </View>
  );
}

import { getSignerStatusLabel } from '@/lib/api';