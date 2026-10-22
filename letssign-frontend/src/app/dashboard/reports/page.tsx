'use client';

import { useEffect, useState } from 'react';
import { FileText, Users, CheckCircle, Clock, XCircle, TrendingUp, Download, BarChart2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api, Document } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  DRAFT: 'gray', PENDING: 'info', PARTIALLY_SIGNED: 'warning', COMPLETED: 'success', CANCELLED: 'danger',
};
const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING: 'Pendente', PARTIALLY_SIGNED: 'Parcial', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.listDocuments({ status: statusFilter || undefined });
      setDocuments(data);
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const stats = {
    total: documents.length,
    drafts: documents.filter(d => d.status === 'DRAFT').length,
    pending: documents.filter(d => d.status === 'PENDING' || d.status === 'PARTIALLY_SIGNED').length,
    completed: documents.filter(d => d.status === 'COMPLETED').length,
    cancelled: documents.filter(d => d.status === 'CANCELLED').length,
    conversionRate: documents.length > 0
      ? ((documents.filter(d => d.status === 'COMPLETED').length / documents.length) * 100).toFixed(1)
      : '0.0',
    avgSignTime: '2.5 min', // Mock data
  };

  const statusDistribution = [
    { label: 'Concluídos', value: stats.completed, color: 'bg-green-500' },
    { label: 'Pendentes', value: stats.pending, color: 'bg-yellow-500' },
    { label: 'Rascunhos', value: stats.drafts, color: 'bg-gray-500' },
    { label: 'Cancelados', value: stats.cancelled, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Métricas</h1>
          <p className="text-gray-600">Acompanhe o desempenho dos seus documentos</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7d', label: 'Últimos 7 dias' },
              { value: '30d', label: 'Últimos 30 dias' },
              { value: '90d', label: 'Últimos 90 dias' },
              { value: '1y', label: 'Último ano' },
            ]}
            className="w-48"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'DRAFT', label: 'Rascunho' },
              { value: 'PENDING', label: 'Pendente' },
              { value: 'COMPLETED', label: 'Concluído' },
              { value: 'CANCELLED', label: 'Cancelado' },
            ]}
            className="w-48"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Documentos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.conversionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tempo Médio Assinatura</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgSignTime}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Concluídos no Período</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-pink-600" />
              Distribuição por Status
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusDistribution.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-600">{item.label}</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all', item.color)}
                      style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-16 text-sm font-medium text-gray-900 text-right">
                    {item.value} ({(stats.total > 0 ? (item.value / stats.total) * 100 : 0).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-600" />
              Funil de Conversão
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Criados', value: stats.total, color: 'bg-blue-500' },
                { label: 'Enviados', value: stats.pending + stats.completed + stats.cancelled, color: 'bg-yellow-500' },
                { label: 'Assinados', value: stats.completed, color: 'bg-green-500' },
              ].map((stage, index) => (
                <div key={stage.label} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{stage.label}</span>
                    <span className="text-sm font-medium text-gray-900">{stage.value}</span>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden relative">
                    <div
                      className={clsx('h-full rounded-full transition-all', stage.color)}
                      style={{ width: stats.total > 0 ? `${(stage.value / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  {index < 2 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      → {(stats.total > 0 ? (stage.value / stats.total) * 100 : 0).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Detalhamento de Documentos</h3>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum documento no período selecionado</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concluído em</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.slice(0, 50).map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-xs">{doc.titulo}</p>
                            <p className="text-xs text-gray-500">{doc.nomeArquivo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColors[doc.status]}>{statusLabels[doc.status]}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {doc.totalSignatarios !== undefined
                          ? `${doc.assinados || 0} / ${doc.totalSignatarios}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(doc.criadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {doc.concluidoEm ? new Date(doc.concluidoEm).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}