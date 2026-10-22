'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Lock, Mail, Smartphone, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmSenha: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    if (!formData.senha || formData.senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
    }
    if (isRegister) {
      if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
      if (formData.senha !== formData.confirmSenha) newErrors.confirmSenha = 'As senhas não coincidem';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isRegister) {
        await register({ nome: formData.nome, email: formData.email, telefone: formData.telefone, senha: formData.senha });
        toast.success('Conta criada com sucesso!');
      } else {
        await login(formData.email, formData.senha);
        toast.success('Login realizado com sucesso!');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao autenticar';
      toast.error(message);
      if (error.response?.data?.message?.includes('e-mail')) setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-xl bg-pink-600 flex items-center justify-center">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">LetsSign</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isRegister ? 'Criar conta' : 'Entrar'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isRegister ? 'Cadastre-se para começar a assinar documentos' : 'Acesse sua conta para gerenciar documentos'}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setErrors({}); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${!isRegister ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setErrors({}); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${isRegister ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Cadastrar
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <Input
                  name="nome"
                  label="Nome completo"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  error={errors.nome}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  required
                />
              )}
              <Input
                name="email"
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
              {isRegister && (
                <Input
                  name="telefone"
                  label="Telefone (opcional)"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="+55 11 99999-9999"
                  autoComplete="tel"
                />
              )}
              <Input
                name="senha"
                label="Senha"
                type="password"
                value={formData.senha}
                onChange={handleChange}
                error={errors.senha}
                placeholder="••••••••"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
              {isRegister && (
                <Input
                  name="confirmSenha"
                  label="Confirmar senha"
                  type="password"
                  value={formData.confirmSenha}
                  onChange={handleChange}
                  error={errors.confirmSenha}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {isRegister ? 'Criar conta' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setErrors({}); }}
                  className="ml-2 text-pink-600 hover:text-pink-700 font-medium"
                >
                  {isRegister ? 'Entrar' : 'Cadastrar'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Shield, label: 'Seguro', desc: 'Criptografia AES-256' },
            { icon: CheckCircle, label: 'Válido', desc: 'Conforme MP 2.200-2' },
            { icon: Smartphone, label: 'Mobile', desc: 'Assine de qualquer lugar' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <item.icon className="h-5 w-5 text-pink-600" />
              </div>
              <p className="font-medium text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}