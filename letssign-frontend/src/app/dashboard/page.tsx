'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Users, CheckCircle, Clock, XCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, Document } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  DRAFT: 'gray', PENDING: 'info', PARTIALLY_SIGNED: 'warning', COMPLETED: 'success', CANCELLED: 'danger',
};
const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING: 'Pendente', PARTIALLY_SIGNED: 'Parcial', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0, drafts: 0, pending: 0, completed: 0, cancelled: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const docs = await api.listDocuments();
      setRecentDocuments(docs.slice(0, 5));
      setStats({
        total: docs.length,
        drafts: docs.filter((d: Document) => d.status === 'DRAFT').length,
        pending: docs.filter((d: Document) => d.status === 'PENDING' || d.status === 'PARTIALLY_SIGNED').length,
        completed: docs.filter((d: Document) => d.status === 'COMPLETED').length,
        cancelled: docs.filter((d: Document) => d.status === 'CANCELLED').length,
      });
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const statCards = [
    { title: 'Total', value: stats.total, icon: FileText, color: 'bg-blue-100 text-blue-600', href: '/dashboard/documents' },
    { title: 'Rascunhos', value: stats.drafts, icon: FileText, color: 'bg-gray-100 text-gray-600', href: '/dashboard/documents?status=DRAFT' },
    { title: 'Pendentes', value: stats.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600', href: '/dashboard/documents?status=PENDING' },
    { title: 'Concluídos', value: stats.completed, icon: CheckCircle, color: 'bg-green-100 text-green-600', href: '/dashboard/documents?status=COMPLETED' },
  ];

  if (user?.role === 'SIGNER') {
    const signerStats = [
      { title: 'Para Assinar', value: recentDocuments.filter(d => d.minhaSituacao === 'PENDING').length, icon: FileText, color: 'bg-blue-100 text-blue-600', href: '/dashboard/documents?situacao=pendentes' },
      { title: 'Assinados', value: recentDocuments.filter(d => d.minhaSituacao === 'SIGNED').length, icon: CheckCircle, color: 'bg-green-100 text-green-600', href: '/dashboard/documents?situacao=assinados' },
      { title: 'Recusados', value: recentDocuments.filter(d => d.minhaSituacao === 'REJECTED').length, icon: XCircle, color: 'bg-red-100 text-red-600', href: '/dashboard/documents?situacao=recusados' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.nome?.split(' ')[0]}!</h1>
          <p className="text-gray-600">Acompanhe seus documentos para assinatura</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {signerStats.map((stat) => (
            <Link key={stat.title} href={stat.href} className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center', stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Documentos Recentes</h3>
            <Link href="/dashboard/documents" className="text-sm text-pink-600 hover:text-pink-700">
              Ver todos <ArrowRight className="h-4 w-4 inline" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento encontrado</p>
                <Link href="/dashboard/documents" className="mt-4 inline-block text-pink-600 hover:text-pink-700 font-medium">
                  Ver documentos
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documents/${doc.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-pink-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.titulo}</p>
                          <p className="text-sm text-gray-500">{doc.nomeArquivo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.minhaSituacao && (
                          <Badge variant={statusColors[doc.minhaSituacao] || 'gray'}>
                            {statusLabels[doc.minhaSituacao] || doc.minhaSituacao}
                          </Badge>
                        )}
                        <TrendingUp className="h-5 w-5 text-gray-400" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral dos seus documentos e atividades</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center', stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Documentos Recentes</h3>
            <Link href="/dashboard/documents" className="text-sm text-pink-600 hover:text-pink-700">
              Ver todos <ArrowRight className="h-4 w-4 inline" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento criado ainda</p>
                <Link href="/dashboard/documents/new" className="mt-4 inline-block">
                  <Button>
                    <FileText className="h-4 w-4" />
                    Criar Primeiro Documento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documents/${doc.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-pink-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.titulo}</p>
                          <p className="text-sm text-gray-500">{doc.nomeArquivo} &bull; {doc.totalPaginas} p&aacute;g.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusColors[doc.status]}>
                          {statusLabels[doc.status]}
                        </Badge>
                        {doc.totalSignatarios !== undefined && (
                          <span className="text-sm text-gray-500">
                            {doc.assinados || 0}/{doc.totalSignatarios}
                          </span>
                        )}
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/documents/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Novo Documento</p>
                  <p className="text-sm text-gray-500">Upload de PDF e configuração de assinaturas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
              </Button>
            </Link>
            <Link href="/dashboard/signers" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gerenciar Signatários</p>
                  <p className="text-sm text-gray-500">Adicione ou edite signatários cadastrados</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
              </Button>
            </Link>
            <Link href="/dashboard/documents?status=DRAFT" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rascunhos Pendentes</p>
                  <p className="text-sm text-gray-500">{stats.drafts} documento(s) aguardando envio</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}