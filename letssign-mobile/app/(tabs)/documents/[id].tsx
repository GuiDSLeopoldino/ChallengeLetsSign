import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions, PanResponder, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, Document, DocumentSigner, SignatureField } from '@/services/api';
import { formatDate, getStatusLabel, getSignerStatusLabel, getRoleLabel } from '@/lib/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import styles from './[id].styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function clearCanvas() {
  // This will be called from the modal
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [signing, setSigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [signature, setSignature] = useState<string>('');
  const [gestureMetadata, setGestureMetadata] = useState<any>({});
  const canvasRef = useRef<any>(null);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      const points = [{ x: locationX, y: locationY, time: Date.now(), pressure: 1 }];
      setGestureMetadata(prev => ({ ...prev, points }));
      setSignature(prev => prev); // trigger re-render
      if (canvasRef.current) {
        canvasRef.current.drawPoint(locationX, locationY);
      }
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      if (canvasRef.current) {
        canvasRef.current.drawPoint(locationX, locationY);
      }
      setGestureMetadata(prev => ({
        ...prev,
        points: [...(prev.points || []), { x: locationX, y: locationY, time: Date.now(), pressure: 1 }]
      }));
    },
    onPanResponderRelease: () => {
      // Calculate final metadata
      const points = gestureMetadata.points || [];
      if (points.length > 1) {
        const startTime = points[0].time;
        const endTime = points[points.length - 1].time;
        const duration = endTime - startTime;
        const distances = points.slice(1).map((p, i) => 
          Math.sqrt(Math.pow(p.x - points[i].x, 2) + Math.pow(p.y - points[i].y, 2))
        );
        const totalDistance = distances.reduce((a, b) => a + b, 0);
        const avgSpeed = duration > 0 ? totalDistance / duration : 0;
        
        setGestureMetadata(prev => ({
          ...prev,
          duracaoMs: duration,
          totalPontos: points.length,
          velocidadeMedia: avgSpeed,
        }));
      }
    },
  })).current;

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDocument(id!);
      setDocument(data);
      if (data.signers) {
        const mySigner = data.signers.find(s => s.signerId === user?.id);
        if (mySigner && mySigner.status === 'PENDING') {
          setCurrentPage(mySigner.fields?.[0]?.page || 1);
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar documento');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signature) {
      Alert.alert('Erro', 'Desenhe sua assinatura antes de confirmar');
      return;
    }
    setSigning(true);
    try {
      await api.signDocument(id!, {
        assinaturaImagemBase64: signature,
        gestureMetadata,
      });
      Alert.alert('Sucesso', 'Documento assinado com sucesso!');
      setShowSignModal(false);
      setSignature('');
      setGestureMetadata({});
      fetchDocument();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.mensagem || 'Erro ao assinar documento');
    } finally {
      setSigning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Erro', 'Informe o motivo da recusa');
      return;
    }
    try {
      await api.rejectDocument(id!, { motivo: rejectReason });
      Alert.alert('Sucesso', 'Recusa registrada.');
      setShowRejectModal(false);
      setRejectReason('');
      fetchDocument();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.mensagem || 'Erro ao recusar documento');
    }
  };

  const downloadPDF = async (tipo: 'original' | 'final') => {
    try {
      const blob = await api.downloadDocument(id!, tipo);
      const uri = `${FileSystem.cacheDirectory}${document?.nomeArquivo || 'documento'}_${tipo}.pdf`;
      await FileSystem.writeAsStringAsync(uri, blob, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao baixar PDF');
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setSignature('');
    setGestureMetadata({});
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Carregando documento...</Text>
      </View>
    );
  }

  if (!document) return null;

  const mySigner = document.signers?.find(s => s.signerId === user?.id);
  const isOwner = document.papel === 'OWNER';
  const canSign = mySigner && (mySigner.status === 'PENDING' || mySigner.status === 'VIEWED');
  const statusConfig = getStatusLabel(document.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{document.titulo}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Document Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Páginas" value={`${document.totalPaginas}`} icon="document-text-outline" />
            <InfoItem label="Versão" value={`v${document.versao}`} icon="sync-outline" />
            <InfoItem label="Tamanho" value={formatFileSize(document.tamanhoBytes)} icon="folder-outline" />
            <InfoItem label="Criado em" value={formatDate(document.criadoEm)} icon="calendar-outline" />
            {document.enviadoEm && (
              <InfoItem label="Enviado em" value={formatDate(document.enviadoEm)} icon="send-outline" />
            )}
            {document.concluidoEm && (
              <InfoItem label="Concluído em" value={formatDate(document.concluidoEm)} icon="checkmark-done-circle-outline" />
            )}
          </View>
        </View>

        {/* Owner */}
        {document.owner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remetente</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                <Ionicons name="person-circle-outline" size={40} color="#EC4899" />
              </View>
              <View>
                <Text style={styles.ownerName}>{document.owner.nome}</Text>
                <Text style={styles.ownerEmail}>{document.owner.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Signers */}
        {document.signers && document.signers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Signatários</Text>
              {isOwner && document.status === 'DRAFT' && (
                <Text style={styles.editHint}>Configure no painel web</Text>
              )}
            </View>
            {document.signers.map((signer) => (
              <SignerRow key={signer.id} signer={signer} isCurrentUser={signer.signerId === user?.id} />
            ))}
          </View>
        )}

        {/* Fields */}
        {document.fields && document.fields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campos de Assinatura</Text>
            {document.fields.map((field) => (
              <View key={field.id} style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="pencil-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Página {field.page}</Text>
                  <Text style={styles.fieldDetail}>
                    {getRoleLabel(field.roleLabel).label} • {field.required ? 'Obrigatório' : 'Opcional'}
                  </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleLabel(field.roleLabel).color }]}>
                  <Text style={styles.roleBadgeText}>{getRoleLabel(field.roleLabel).label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions for signer */}
        {canSign && document.status !== 'COMPLETED' && document.status !== 'CANCELLED' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              onPress={() => setShowSignModal(true)}
              style={styles.signButton}
            >
              <Ionicons name="pencil-outline" size={20} color="#fff" />
              <Text style={styles.signButtonText}>Assinar Documento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowRejectModal(true)}
              style={styles.rejectButton}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.rejectButtonText}>Recusar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Download buttons for owner/completed */}
        {(isOwner || document.possuiDocumentoFinal) && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              onPress={() => downloadPDF('original')}
              style={styles.downloadButton}
            >
              <Ionicons name="eye-outline" size={20} color="#EC4899" />
              <Text style={styles.downloadButtonText}>Ver Original</Text>
            </TouchableOpacity>
            {document.possuiDocumentoFinal && (
              <TouchableOpacity
                onPress={() => downloadPDF('final')}
                style={styles.downloadButtonPrimary}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Baixar PDF Final</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sign Modal */}
      {showSignModal && (
        <SignModal
          visible={showSignModal}
          onClose={() => { setShowSignModal(false); setSignature(''); setGestureMetadata({}); }}
          onSign={handleSign}
          signing={signing}
          signature={signature}
          setSignature={setSignature}
          canvasRef={canvasRef}
          panResponder={panResponder}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          visible={showRejectModal}
          onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
          onReject={handleReject}
          reason={rejectReason}
          setReason={setRejectReason}
        />
      )}
    </View>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color="#EC4899" style={styles.infoIcon} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SignerRow({ signer, isCurrentUser }: { signer: DocumentSigner; isCurrentUser: boolean }) {
  const statusConfig = getSignerStatusLabel(signer.status);
  const roleConfig = getRoleLabel(signer.roleLabel);

  return (
    <View style={styles.signerRow}>
      <View style={styles.signerAvatar}>
        <Ionicons name="person-circle-outline" size={32} color="#EC4899" />
      </View>
      <View style={styles.signerInfo}>
        <View style={styles.signerNameRow}>
          <Text style={styles.signerName}>{signer.signer?.nome}</Text>
          {isCurrentUser && <Text style={styles.youBadge}>Você</Text>}
        </View>
        <Text style={styles.signerEmail}>{signer.signer?.email}</Text>
        <View style={styles.signerBadges}>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color }]}>
            <Text style={styles.roleBadgeText}>{roleConfig.label}</Text>
          </View>
          {signer.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Obrigatório</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>
      {signer.signedAt && (
        <Text style={styles.signedAt}>Assinado em {formatDate(signer.signedAt)}</Text>
      )}
    </View>
  );
}

// Sign Modal Component
function SignModal({ visible, onClose, onSign, signing, signature, setSignature, canvasRef, panResponder }: any) {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay} onTouchStart={onClose}>
      <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Assinar Documento</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalInstruction}>
          Desenhe sua assinatura na área abaixo
        </Text>

        <View style={styles.canvasContainer} {...panResponder.panHandlers}>
          <View
            ref={canvasRef}
            style={styles.canvas}
          >
            {signature && (
              <Image
                source={{ uri: `data:image/png;base64,${signature}` }}
                style={styles.canvasImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        <View style={styles.canvasActions}>
          <TouchableOpacity onPress={clearCanvas} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSign} disabled={signing || !signature} style={[styles.confirmButton, !signature && styles.confirmButtonDisabled]}>
            {signing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Assinatura</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function RejectModal({ visible, onClose, onReject, reason, setReason }: any) {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay} onTouchStart={onClose}>
      <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Recusar Documento</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalInstruction}>
          Informe o motivo da recusa
        </Text>

        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder="Motivo da recusa..."
          value={reason}
          onChangeText={setReason}
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onReject} style={styles.rejectConfirmButton}>
            <Text style={styles.rejectConfirmButtonText}>Confirmar Recusa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}