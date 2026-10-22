'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Filter, Download, Eye, Edit, Trash2, MoreVertical, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { api, Document, DocumentStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  PARTIALLY_SIGNED: 'Parcialmente assinado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<DocumentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  DRAFT: 'gray',
  PENDING: 'info',
  PARTIALLY_SIGNED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const situacaoOptions = [
  { value: '', label: 'Todas' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'assinados', label: 'Assinados' },
  { value: 'recusados', label: 'Recusados' },
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.listDocuments({
        status: statusFilter || undefined,
        situacao: situacaoFilter || undefined,
      });
      setDocuments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, situacaoFilter]);

  const handleDelete = async () => {
    if (!documentToDelete) return;
    setDeleting(true);
    try {
      // Note: API doesn't have delete endpoint yet, but we can simulate
      // await api.deleteDocument(documentToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete.id));
      toast.success('Documento removido');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover documento');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (search) {
      const term = search.toLowerCase();
      if (!doc.titulo.toLowerCase().includes(term) && !doc.nomeArquivo.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING':
      case 'PARTIALLY_SIGNED': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (user?.role === 'SIGNER') {
    return <SignerDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Documentos</h1>
          <p className="text-gray-600">Gerencie e acompanhe seus documentos para assinatura</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Documento
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título ou arquivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos os status' },
                { value: 'DRAFT', label: 'Rascunho' },
                { value: 'PENDING', label: 'Pendente' },
                { value: 'PARTIALLY_SIGNED', label: 'Parcialmente assinado' },
                { value: 'COMPLETED', label: 'Concluído' },
                { value: 'CANCELLED', label: 'Cancelado' },
              ]}
              className="w-full sm:w-48"
            />
            {(user?.role as string) === 'SIGNER' && (
              <Select
                value={situacaoFilter}
                onChange={(e) => setSituacaoFilter(e.target.value)}
                options={situacaoOptions}
                className="w-full sm:w-48"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
              <p className="mt-4 text-gray-600">Carregando documentos...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum documento encontrado</h3>
              <p className="text-gray-500 mb-6">{search ? 'Tente alterar sua busca' : 'Comece criando seu primeiro documento'}</p>
              {!search && (
                <Link href="/dashboard/documents/new">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Criar Documento
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signatários</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-xs">{doc.titulo}</p>
                            <p className="text-sm text-gray-500">{doc.nomeArquivo} • {doc.totalPaginas} pág.</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          <Badge variant={statusColors[doc.status]}>{statusLabels[doc.status]}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.totalSignatarios !== undefined ? (
                          <span className="text-gray-700">
                            {doc.assinados || 0} / {doc.totalSignatarios}
                          </span>
                        ) : doc.minhaSituacao ? (
                          <Badge variant={statusColors[doc.minhaSituacao as DocumentStatus] || 'gray'}>
                            {statusLabels[doc.minhaSituacao as DocumentStatus] || doc.minhaSituacao}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(doc.criadoEm).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/documents/${doc.id}`}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            aria-label={`Ver ${doc.titulo}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {doc.status === 'DRAFT' && (
                            <Link
                              href={`/dashboard/documents/${doc.id}/edit`}
                              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              aria-label={`Editar ${doc.titulo}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          )}
                          {(doc.status === 'COMPLETED' || doc.status === 'PARTIALLY_SIGNED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const blob = await api.downloadDocument(doc.id, 'final');
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${doc.titulo}-assinado.pdf`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Download iniciado');
                                } catch {
                                  toast.error('Erro ao baixar PDF');
                                }
                              }}
                              aria-label={`Baixar PDF final de ${doc.titulo}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="relative">
                            <button
                              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              aria-label="Mais opções"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDocumentToDelete(null); }}
        title="Excluir documento"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir <strong>{documentToDelete?.titulo}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setDocumentToDelete(null); }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SignerDashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [situacaoFilter, setSituacaoFilter] = useState('pendentes');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.listDocuments({ situacao: situacaoFilter });
      setDocuments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [situacaoFilter]);

  const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
    PENDING: 'info',
    VIEWED: 'warning',
    SIGNED: 'success',
    REJECTED: 'danger',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendente',
    VIEWED: 'Visualizado',
    SIGNED: 'Assinado',
    REJECTED: 'Recusado',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentos para Assinar</h1>
        <p className="text-gray-600">Acompanhe seus documentos pendentes e assinados</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end mb-4">
            <Select
              value={situacaoFilter}
              onChange={(e) => setSituacaoFilter(e.target.value)}
              options={situacaoOptions}
              className="w-48"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum documento</h3>
              <p className="text-gray-500">Você não tem documentos nesta categoria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/documents/${doc.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.titulo}</p>
                        <p className="text-sm text-gray-500">{doc.nomeArquivo} • {doc.totalPaginas} pág.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={statusColors[doc.minhaSituacao || ''] || 'gray'}>
                        {statusLabels[doc.minhaSituacao || ''] || doc.minhaSituacao}
                      </Badge>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}