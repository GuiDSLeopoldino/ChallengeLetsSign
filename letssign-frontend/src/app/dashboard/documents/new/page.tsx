'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Upload, X, CheckCircle, AlertCircle, Users, PenTool, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

const steps = [
  { id: 1, title: 'Upload', description: 'Selecione o PDF' },
  { id: 2, title: 'Participantes', description: 'Adicione signatários' },
  { id: 3, title: 'Campos', description: 'Posicione assinaturas' },
  { id: 4, title: 'Enviar', description: 'Finalize e envie' },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [participants, setParticipants] = useState<Array<{ signerId: string; roleLabel: string; required: boolean }>>([]);
  const [availableSigners, setAvailableSigners] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [fields, setFields] = useState<Array<{
    signerId: string; page: number; x: number; y: number; width: number; height: number; required: boolean; roleLabel: string;
  }>>([]);
  const [pdfPages, setPdfPages] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSigners = async () => {
    try {
      const data = await api.listSigners();
      setAvailableSigners(data);
    } catch {
      toast.error('Erro ao carregar signatários');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são permitidos');
        return;
      }
      if (selectedFile.size > 15 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 15 MB');
        return;
      }
      setFile(selectedFile);
      setTitulo(selectedFile.name.replace('.pdf', ''));
      // Mock PDF pages - in real app, you'd use pdf.js to get page count
      setPdfPages([1, 2, 3]); // placeholder
      toast.success('PDF carregado com sucesso');
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, { signerId: '', roleLabel: 'CONTRATADO', required: true }]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: string, value: any) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setParticipants(newParticipants);
  };

  const addField = () => {
    if (participants.length === 0) {
      toast.error('Adicione pelo menos um participante primeiro');
      return;
    }
    setFields([...fields, {
      signerId: participants[0].signerId,
      page: 1,
      x: 0.1,
      y: 0.1,
      width: 0.3,
      height: 0.1,
      required: true,
      roleLabel: participants[0].roleLabel,
    }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: string, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFields(newFields);
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!file) { toast.error('Selecione um arquivo PDF'); return false; }
        if (!titulo.trim()) { toast.error('Informe o título do documento'); return false; }
        return true;
      case 2:
        if (participants.length === 0) { toast.error('Adicione pelo menos um participante'); return false; }
        if (participants.some(p => !p.signerId)) { toast.error('Selecione um signatário para todos os participantes'); return false; }
        if (!participants.some(p => p.required)) { toast.error('Pelo menos um participante deve ser obrigatório'); return false; }
        return true;
      case 3:
        if (fields.length === 0) { toast.error('Adicione pelo menos um campo de assinatura'); return false; }
        if (fields.some(f => !f.signerId)) { toast.error('Associe todos os campos a um participante'); return false; }
        const participantIds = new Set(participants.map(p => p.signerId));
        if (fields.some(f => !participantIds.has(f.signerId))) { toast.error('Todos os campos devem estar associados a participantes válidos'); return false; }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      // 1. Create document
      const doc = await api.createDocument(file!, titulo);
      // 2. Set participants
      if (participants.length > 0) {
        await api.setParticipants(doc.id, participants);
      }
      // 3. Set fields
      if (fields.length > 0) {
        await api.setFields(doc.id, fields);
      }
      // 4. Send document
      await api.sendDocument(doc.id);
      toast.success('Documento enviado com sucesso!');
      router.push(`/dashboard/documents/${doc.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents" className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Documento</h1>
          <p className="text-gray-600">Crie e envie um documento para assinatura em 4 passos</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <> 
                  <div className="flex flex-col items-center relative">
                    <div className={clsx(
                      'h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10',
                      isCompleted ? 'bg-green-600 text-white' :
                      isActive ? 'bg-pink-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    )}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={clsx(
                      'mt-2 text-xs font-medium text-center w-24',
                      isActive ? 'text-pink-600' : 'text-gray-500'
                    )}>{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={clsx(
                      'flex-1 h-1 mx-2',
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    )} />
                  )}
                </>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-medium text-gray-900">
            Passo {currentStep} de 4: {steps[currentStep - 1].title}
          </h3>
          <p className="text-sm text-gray-500">{steps[currentStep - 1].description}</p>
        </CardHeader>
        <CardContent>
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                  file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-pink-400'
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-pink-400', 'bg-pink-50'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('border-pink-400', 'bg-pink-50'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-pink-400', 'bg-pink-50');
                  if (e.dataTransfer.files[0]) handleFileChange({ target: { files: e.dataTransfer.files } } as any);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); setTitulo(''); setPdfPages([]); }}>
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-1">Clique ou arraste um PDF aqui</p>
                    <p className="text-sm text-gray-500">Máximo 15 MB • Apenas PDF</p>
                  </div>
                )}
              </div>

              <Input
                label="Título do documento"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>
          )}

          {/* Step 2: Participants */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Participantes ({participants.length})</h4>
                <Button size="sm" onClick={addParticipant} disabled={stepLoading}>
                  <Users className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum participante adicionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((p, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                      <Select
                        value={p.signerId}
                        onChange={(e) => updateParticipant(index, 'signerId', e.target.value)}
                        options={availableSigners.map(s => ({ value: s.id, label: `${s.nome} (${s.email})` }))}
                        className="flex-1"
                      />
                      <Select
                        value={p.roleLabel}
                        onChange={(e) => updateParticipant(index, 'roleLabel', e.target.value)}
                        options={[
                          { value: 'CONTRATANTE', label: 'Contratante' },
                          { value: 'CONTRATADO', label: 'Contratado' },
                          { value: 'TESTEMUNHA', label: 'Testemunha' },
                        ]}
                        className="w-40"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={p.required}
                          onChange={(e) => updateParticipant(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        Obrigatório
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => removeParticipant(index)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {availableSigners.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 inline-block mr-2" />
                  <span className="text-yellow-800">Nenhum signatário cadastrado. </span>
                  <Link href="/dashboard/signers" className="text-yellow-800 underline">Cadastre signatários</Link>
                  <span className="text-yellow-800"> primeiro.</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Fields */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Campos de Assinatura ({fields.length})</h4>
                <Button size="sm" onClick={addField} disabled={stepLoading}>
                  <PenTool className="h-4 w-4" />
                  Adicionar Campo
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PenTool className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum campo posicionado</p>
                  <p className="text-sm">Adicione campos e posicione nas páginas do PDF</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((f, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                      <Select
                        value={f.signerId}
                        onChange={(e) => updateField(index, 'signerId', e.target.value)}
                        options={participants.map(p => ({ value: p.signerId, label: p.signerId }))}
                        className="w-48"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-10">Página</span>
                        <input
                          type="number"
                          min="1"
                          max={Math.max(...pdfPages, 1)}
                          value={f.page}
                          onChange={(e) => updateField(index, 'page', parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-10">X</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={f.x}
                          onChange={(e) => updateField(index, 'x', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-10">Y</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={f.y}
                          onChange={(e) => updateField(index, 'y', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-10">Larg.</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="1"
                          value={f.width}
                          onChange={(e) => updateField(index, 'width', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-10">Alt.</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="1"
                          value={f.height}
                          onChange={(e) => updateField(index, 'height', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => updateField(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        Obrig.
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> As coordenadas são normalizadas (0 a 1) a partir do canto superior esquerdo.
                  X=0.1, Y=0.1 = 10% da largura e 10% da altura a partir do topo-esquerdo.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review & Send */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="font-medium text-gray-900">Documento</h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Título:</strong> {titulo}</p>
                    <p><strong>Arquivo:</strong> {file?.name}</p>
                    <p><strong>Páginas:</strong> {pdfPages.length || '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="font-medium text-gray-900">Participantes</h4>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {participants.map((p, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{availableSigners.find(s => s.id === p.signerId)?.nome || p.signerId}</span>
                        <span className="text-gray-500 ml-2">({p.roleLabel})</span>
                        <Badge variant={p.required ? 'default' : 'gray'} className="ml-2 capitalize">{p.required ? 'Obrigatório' : 'Opcional'}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="font-medium text-gray-900">Campos de Assinatura</h4>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {fields.map((f, i) => (
                      <div key={i} className="text-sm">
                        Página {f.page} • {availableSigners.find(s => s.id === f.signerId)?.nome || f.signerId}
                        <Badge variant="gray" className="ml-2">{f.roleLabel}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="font-medium text-gray-900">Validações</h4>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-green-700">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> PDF válido</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Título preenchido</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {participants.length} participante(s)</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {fields.length} campo(s) de assinatura</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Pelo menos 1 obrigatório</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={prevStep}>Voltar</Button>
                <Button onClick={handleSubmit} loading={loading}>
                  Enviar para Assinatura
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Buttons for Steps 1-3 */}
          {currentStep < 4 && (
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={nextStep}>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}