'use client';

import Link from 'next/link';
import { FileText, Shield, Zap, Users, CheckCircle, ArrowRight, Mail, Smartphone, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pink-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-1.5 text-sm font-medium text-pink-800 mb-6">
              <Zap className="h-4 w-4" />
              <span>LetsSign v1.0 - Assinatura Digital com Validade Jurídica</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
              Assine documentos <span className="text-pink-600">em minutos</span>, não em dias
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 mb-8 max-w-2xl mx-auto">
              Plataforma completa para gestão de documentos, assinaturas eletrônicas com biometria,
              trilha de auditoria SHA-256 e PDFs finais carimbados. Conforme MP 2.200-2/2001.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-pink-700 transition-colors"
              >
                Começar Grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Ver Demonstração
              </Link>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-pink-100/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-100/50 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tudo que você precisa para <span className="text-pink-600">assinaturas seguras</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Funcionalidades completas para empresas de todos os tamanhos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Como funciona em <span className="text-pink-600">3 passos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <StepCard key={step.title} step={step} index={index + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-pink-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-pink-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Pronto para simplificar suas assinaturas?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Junte-se a milhares de empresas que já confiam no LetsSign
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-pink-700 transition-colors"
          >
            Criar Conta Grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-pink-600 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">LetsSign</span>
              </div>
              <p className="text-sm text-gray-400">Assinatura digital simples, segura e com validade jurídica.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Assinaturas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Auditoria</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© 2024 LetsSign. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: 'PDFs Inteligentes',
    description: 'Upload de PDFs com validação automática, detecção de páginas e proteção contra arquivos corrompidos ou criptografados.',
    icon: FileText,
  },
  {
    title: 'Campos de Assinatura',
    description: 'Posicione campos de assinatura com coordenadas normalizadas (0-1) - funcionam em qualquer resolução de tela.',
    icon: CheckCircle,
  },
  {
    title: 'Assinatura Biométrica',
    description: 'Captura de pressão, velocidade, duração e pontos do gesto. Metadados salvos para prova de autoria.',
    icon: Shield,
  },
  {
    title: 'Fluxo Ordenado',
    description: 'Defina ordem de assinatura, signatários obrigatórios/opcionais, papéis (Contratante/Contratado/Testemunha).',
    icon: Users,
  },
  {
    title: 'Trilha de Auditoria',
    description: 'Eventos imutáveis com hash SHA-256, timestamp, IP e user-agent. Verificação de integridade a qualquer momento.',
    icon: Lock,
  },
  {
    title: 'PDF Final Carimbado',
    description: 'Geração automática de PDF final com assinaturas posicionadas, carimbo de tempo e hash original preservado.',
    icon: Mail,
  },
];

const steps = [
  {
    title: 'Criar e Configurar',
    description: 'Faça upload do PDF, adicione signatários e posicione os campos de assinatura arrastando e soltando.',
  },
  {
    title: 'Enviar para Assinatura',
    description: 'Envie o documento - signatários recebem e-mail com link direto. Podem assinar de qualquer dispositivo.',
  },
  {
    title: 'Concluir e Baixar',
    description: 'Quando todos assinarem, o PDF final é gerado automaticamente com carimbo de tempo e hash SHA-256.',
  },
];

const stats = [
  { value: '10k+', label: 'Documentos assinados' },
  { value: '5k+', label: 'Usuários ativos' },
  { value: '99.9%', label: 'Uptime' },
  { value: '2min', label: 'Tempo médio de assinatura' },
];

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const Icon = feature.icon;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-pink-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
      <p className="text-gray-600">{feature.description}</p>
    </div>
  );
}

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  return (
    <div className="relative text-center">
      {index < 3 && (
        <div className="absolute top-8 left-1/2 w-full h-1 bg-pink-100 -z-10 md:left-[58%]" />
      )}
      <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center text-2xl font-bold text-pink-600">
        {index}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
      <p className="text-gray-600">{step.description}</p>
    </div>
  );
}