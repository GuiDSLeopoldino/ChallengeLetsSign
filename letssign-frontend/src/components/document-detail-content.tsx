'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, ArrowLeft, Download, Eye, Edit, MoreVertical,
  CheckCircle, XCircle, Clock, AlertTriangle, UserCheck, PenTool,
  Trash2, Share2, RotateCcw, Signature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { api, Document, Participant, SignatureField, AuditEvent, DocumentStatus, SignerStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import SignaturePad from 'signature_pad';

const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: 'Rascunho', PENDING: 'Pendente', PARTIALLY_SIGNED: 'Parcialmente assinado',
  COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};
const statusColors: Record<DocumentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  DRAFT: 'gray', PENDING: 'info', PARTIALLY_SIGNED: 'warning', COMPLETED: 'success', CANCELLED: 'danger',
};
const signerStatusLabels: Record<SignerStatus, string> = {
  PENDING: 'Pendente', VIEWED: 'Visualizado', SIGNED: 'Assinado', REJECTED: 'Recusado',
};
const signerStatusColors: Record<SignerStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  PENDING: 'info', VIEWED: 'warning', SIGNED: 'success', REJECTED: 'danger',
};

export function DocumentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'fields' | 'audit'>('overview');
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [signing, setSigning] = useState(false);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signatureEmpty, setSignatureEmpty] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const data = await api.getDocument(documentId);
      setDocument(data);
      setParticipants(data.signers || []);
      setFields(data.fields || []);
      setAuditEvents(data.events || []);

      const myParticipant = data.signers?.find((p: Participant) => p.signerId === user?.id);
      if (myParticipant) setCurrentParticipant(myParticipant);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar documento');
      router.push('/dashboard/documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canvasRef.current && !signaturePad) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
      });
      setSignaturePad(pad);
    }
  }, [signaturePad]);

  const handleSignatureChange = () => {
    if (signaturePad) {
      setSignatureEmpty(signaturePad.isEmpty());
    }
  };

  const clearSignature = () => {
    signaturePad?.clear();
    setSignatureEmpty(true);
  };

  const saveSignature = async () => {
    if (!signaturePad || signaturePad.isEmpty() || !currentParticipant) return;
    setSigning(true);
    try {
      const base64 = signaturePad.toDataURL('image/png');
      const gestureMetadata = {
        points: signaturePad.toData(),
        pressaoMedia: 0.5,
        velocidadeMedia: 1.0,
        duracaoMs: Date.now(),
        dispositivo: navigator.userAgent,
      };
      await api.signDocument(documentId, base64, gestureMetadata);
      toast.success('Documento assinado com sucesso!');
      setSignModalOpen(false);
      signaturePad.clear();
      setSignatureEmpty(true);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao assinar documento');
    } finally {
      setSigning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || !currentParticipant) return;
    try {
      await api.rejectDocument(documentId, rejectReason);
      toast.success('Recusa registrada');
      setRejectModalOpen(false);
      setRejectReason('');
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao recusar documento');
    }
  };

  const downloadPdf = async (tipo: 'original' | 'final') => {
    try {
      const blob = await api.downloadDocument(documentId, tipo);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document?.titulo || 'documento'}${tipo === 'final' ? '-assinado' : ''}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch {
      toast.error('Erro ao baixar PDF');
    }
  };

  const canSign = currentParticipant &&
    (document?.status === 'PENDING' || document?.status === 'PARTIALLY_SIGNED') &&
    currentParticipant.status === 'PENDING' &&
    user?.role === 'SIGNER';

  const canReject = currentParticipant &&
    (document?.status === 'PENDING' || document?.status === 'PARTIALLY_SIGNED') &&
    (currentParticipant.status === 'PENDING' || currentParticipant.status === 'VIEWED') &&
    user?.role === 'SIGNER';

  const canEdit = document?.status === 'DRAFT' && user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents" className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.titulo}</h1>
            <p className="text-gray-600">{document.nomeArquivo} • {document.totalPaginas} página(s)</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusColors[document.status]} className="text-sm">
            {statusLabels[document.status]}
          </Badge>
          {(document.status === 'COMPLETED' || document.status === 'PARTIALLY_SIGNED') && (
            <Button variant="outline" size="sm" onClick={() => downloadPdf('final')}>
              <Download className="h-4 w-4" />
              PDF Final
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => downloadPdf('original')}>
            <Download className="h-4 w-4" />
            Original
          </Button>
          {canEdit && (
            <Link href={`/dashboard/documents/${documentId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px" role="tablist">
          {[
            { id: 'overview', label: 'Visão Geral', icon: FileText },
            { id: 'participants', label: 'Participantes', icon: UserCheck },
            { id: 'fields', label: 'Campos', icon: PenTool },
            { id: 'audit', label: 'Auditoria', icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-medium text-gray-900">Informações</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Versão</span>
                    <span className="font-medium">{document.versao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hash SHA-256</span>
                    <span className="font-mono text-xs text-gray-700 truncate max-w-[200px]">{document.hashSha256}</span>
                  </div>
                  {document.hashFinal && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hash Final</span>
                      <span className="font-mono text-xs text-gray-700 truncate max-w-[200px]">{document.hashFinal}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tamanho</span>
                    <span className="font-medium">{(document.tamanhoBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  {document.mensagem && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mensagem</span>
                      <span className="font-medium text-gray-700 truncate max-w-[200px]">{document.mensagem}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-medium text-gray-900">Datas</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Criado em</span>
                    <span className="font-medium">{new Date(document.criadoEm).toLocaleString('pt-BR')}</span>
                  </div>
                  {document.enviadoEm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Enviado em</span>
                      <span className="font-medium">{new Date(document.enviadoEm).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {document.concluidoEm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Concluído em</span>
                      <span className="font-medium">{new Date(document.concluidoEm).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-medium text-gray-900">Progresso</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {document.totalSignatarios && document.totalSignatarios > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Assinaturas</span>
                          <span className="font-medium">{document.assinados || 0} / {document.totalSignatarios}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pink-600 transition-all"
                            style={{ width: `${((document.assinados || 0) / document.totalSignatarios) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Obrigatórios assinados</span>
                      <span className="font-medium">
                        {participants.filter(p => p.required && p.status === 'SIGNED').length} / {participants.filter(p => p.required).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {currentParticipant && user?.role === 'SIGNER' && (document.status === 'PENDING' || document.status === 'PARTIALLY_SIGNED') && (
              <Card className="border-pink-200 bg-pink-50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Signature className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-pink-800">Ação necessária</p>
                        <p className="text-sm text-pink-700">
                          Você precisa {currentParticipant.status === 'PENDING' ? 'assinar' : 'revisar'} este documento
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canSign && (
                        <Button onClick={() => setSignModalOpen(true)}>
                          <Signature className="h-4 w-4" />
                          Assinar
                        </Button>
                      )}
                      {canReject && (
                        <Button variant="outline" onClick={() => setRejectModalOpen(true)}>
                          <XCircle className="h-4 w-4" />
                          Recusar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <Card>
            <CardContent className="p-0">
              {participants.length === 0 ? (
                <div className="p-12 text-center">
                  <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum participante adicionado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {participants.map((p) => (
                    <div key={p.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <span className="text-pink-700 font-medium">
                              {p.signer.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.signer.nome}</p>
                            <p className="text-sm text-gray-500">{p.signer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={signerStatusColors[p.status]}>
                            {signerStatusLabels[p.status]}
                          </Badge>
                          <Badge variant={p.required ? 'default' : 'gray'} className="capitalize">
                            {p.required ? 'Obrigatório' : 'Opcional'}
                          </Badge>
                          <Badge variant="gray">{p.roleLabel}</Badge>
                          {p.signedAt && (
                            <span className="text-sm text-gray-500">
                              {new Date(p.signedAt).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      {p.motivoRecusa && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                          Motivo: {p.motivoRecusa}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'fields' && (
          <Card>
            <CardContent className="p-0">
              {fields.length === 0 ? (
                <div className="p-12 text-center">
                  <PenTool className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum campo de assinatura posicionado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {fields.map((f) => {
                    const participant = participants.find(p => p.signerId === f.signerId);
                    return (
                      <div key={f.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <PenTool className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Página {f.page} • {f.required ? 'Obrigatório' : 'Opcional'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {participant?.signer.nome || f.signerId} • {f.roleLabel}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            x: {f.x}, y: {f.y}, w: {f.width}, h: {f.height}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card>
            <CardContent className="p-0">
              {auditEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum evento de auditoria</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {event.tipo}
                            </span>
                            <span className="text-sm text-gray-500">
                              v{event.versao} • {new Date(event.timestamp).toLocaleString('pt-BR')}
                            </span>
                            {event.ip && (
                              <span className="text-xs text-gray-400 font-mono">{event.ip}</span>
                            )}
                          </div>
                          <p className="text-gray-900">{event.descricao}</p>
                          {event.actorId && (
                            <p className="text-sm text-gray-500 mt-1">
                              Por: {event.actorRole} ({event.actorId})
                            </p>
                          )}
                        </div>
                        {event.hashDocumentoNoMomento && (
                          <span className="font-mono text-xs text-gray-500 truncate max-w-[150px] flex-shrink-0">
                            {event.hashDocumentoNoMomento}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sign Modal */}
      <Modal
        isOpen={signModalOpen}
        onClose={() => { setSignModalOpen(false); signaturePad?.clear(); setSignatureEmpty(true); }}
        title="Assinar Documento"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Desenhe sua assinatura abaixo. Use mouse, touch ou caneta stylus.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
            <canvas
              ref={canvasRef}
              className="w-full h-48 cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
            {signatureEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Desenhe sua assinatura aqui</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearSignature} disabled={signatureEmpty}>
              Limpar
            </Button>
            <Button onClick={saveSignature} loading={signing} disabled={signatureEmpty} className="ml-auto">
              <Signature className="h-4 w-4" />
              Confirmar Assinatura
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectReason(''); }}
        title="Recusar Documento"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Informe o motivo da recusa. Este documento será cancelado se você for signatário obrigatório.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo da recusa..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectModalOpen(false); setRejectReason(''); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
              <XCircle className="h-4 w-4" />
              Confirmar Recusa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}