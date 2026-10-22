'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, User, Mail, Phone, Lock, Edit, Trash2, Eye, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';

export default function SignersPage() {
  const { user } = useAuth();
  const [signers, setSigners] = useState<Array<{ id: string; nome: string; email: string; telefone?: string; criadoEm: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSigner, setEditingSigner] = useState<typeof signers[0] | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [signerToDelete, setSignerToDelete] = useState<string | null>(null);

  const fetchSigners = async () => {
    setLoading(true);
    try {
      const data = await api.listSigners(search || undefined);
      setSigners(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar signatários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSigners();
  }, [search]);

  const openCreateModal = () => {
    setEditingSigner(null);
    setFormData({ nome: '', email: '', telefone: '', senha: '' });
    setModalOpen(true);
  };

  const openEditModal = (signer: typeof signers[0]) => {
    setEditingSigner(signer);
    setFormData({ nome: signer.nome, email: signer.email, telefone: signer.telefone || '', senha: '' });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !formData.email.trim() || (!editingSigner && !formData.senha.trim())) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (formData.senha && formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setSubmitLoading(true);
    try {
      if (editingSigner) {
        await api.updateSigner(editingSigner.id, {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          senha: formData.senha || undefined,
        });
        toast.success('Signatário atualizado');
      } else {
        await api.createSigner({ nome: formData.nome, email: formData.email, telefone: formData.telefone, senha: formData.senha });
        toast.success('Signatário criado');
      }
      setModalOpen(false);
      fetchSigners();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar signatário');
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!signerToDelete) return;
    try {
      await api.deleteSigner(signerToDelete);
      toast.success('Signatário removido');
      setDeleteModalOpen(false);
      setSignerToDelete(null);
      fetchSigners();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover signatário');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Signatários</h1>
          <p className="text-gray-600">Gerencie os signatários cadastrados para seus documentos</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Novo Signatário
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signers List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-pink-600 border-t-transparent rounded-full" />
              <p className="mt-4 text-gray-600">Carregando signatários...</p>
            </div>
          ) : signers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum signatário cadastrado</h3>
              <p className="text-gray-500 mb-6">Adicione signatários para usar em seus documentos</p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Signatário
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {signers.map((signer) => (
                <div key={signer.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{signer.nome}</p>
                      <p className="text-sm text-gray-500">{signer.email}</p>
                      {signer.telefone && (
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {signer.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(signer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSignerToDelete(signer.id); setDeleteModalOpen(true); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSigner ? 'Editar Signatário' : 'Novo Signatário'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nome completo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome do signatário"
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            required
          />
          <Input
            label="Telefone (opcional)"
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="+55 11 99999-9999"
          />
          <Input
            label={editingSigner ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
            type="password"
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            placeholder={editingSigner ? '••••••••' : 'Mínimo 6 caracteres'}
            required={!editingSigner}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={submitLoading}>
              {editingSigner ? 'Salvar Alterações' : 'Criar Signatário'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSignerToDelete(null); }}
        title="Excluir Signatário"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir este signatário?
          <strong className="block mt-1">Esta ação não pode ser desfeita.</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Signatários vinculados a documentos não podem ser removidos.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setSignerToDelete(null); }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}