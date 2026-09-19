'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  Send, Bot, User, Sparkles, BookOpen, Plus, Trash2,
  Edit2, Check, X, ShieldCheck, Zap, MessageSquare,
  HelpCircle, Settings, CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatbotKnowledgeItem } from '@/types';

export default function AssistantPage() {
  const store = useStore();
  const {
    currentShop,
    chatbotKnowledge,
    chatbotConfig,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    updateChatbotConfig,
    processClientWhatsAppMessage,
  } = store;

  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'tone'>('chat');

  // Chat State
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; ts: Date; buttons?: any[] }[]>([
    {
      role: 'assistant',
      text: `¡Hola! Soy el asistente inteligente de *${currentShop?.name || 'The Black Chair'}*. Respondo preguntas sobre precios, horarios, barberos y disponibilidad usando los datos reales de tu barbería y las preguntas frecuentes entrenadas. ¿En qué te ayudo?`,
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Knowledge Base Editor State
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState<ChatbotKnowledgeItem['category']>('faq');
  const [newTags, setNewTags] = useState('');

  const [botTone, setBotTone] = useState<'profesional' | 'urbano' | 'casual' | 'premium'>(
    chatbotConfig?.tone || 'profesional'
  );

  const QUICK_QUESTIONS = [
    '¿Cuáles son los precios?',
    '¿Tienen parqueadero?',
    '¿Ofrecen cerveza o café?',
    '¿Atienden niños?',
    '¿Qué barberos trabajan hoy?',
    'Quiero una cita a las 5pm',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = processClientWhatsAppMessage('+57 300 000 0000', 'Cliente', text);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: response.reply,
          ts: new Date(),
          buttons: response.buttons,
        },
      ]);
    }, 400);
  };

  const handleCreateKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    addKnowledgeItem({
      category: newCategory,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      isActive: true,
    });

    setNewQuestion('');
    setNewAnswer('');
    setNewTags('');
    setIsAddingFaq(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="section-title">Asistente IA & Entrenador de Barbería</h2>
          </div>
          <p className="section-desc">
            Personaliza el conocimiento, preguntas frecuentes y tono de voz con el que tu bot atiende a los clientes.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'chat' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Probar Asistente
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'knowledge' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Base de Conocimiento ({chatbotKnowledge.length})
          </button>
          <button
            onClick={() => setActiveTab('tone')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'tone' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Personalidad & Tono
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="card flex flex-col shadow-2xl border-zinc-800" style={{ height: '620px' }}>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100">Simulador de Conversación IA</div>
                    <div className="text-[10px] text-zinc-400">Entrenado con {chatbotKnowledge.length} respuestas personalizadas</div>
                  </div>
                </div>
                <span className="badge-violet text-xs">Modo Activo</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950/40">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                    )}
                    <div className="space-y-2 max-w-[82%]">
                      <div
                        className={cn(
                          'px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md',
                          msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-tr-xs'
                            : 'bg-zinc-800 text-zinc-200 rounded-tl-xs border border-zinc-700'
                        )}
                      >
                        {msg.text}
                      </div>

                      {/* Interactive buttons */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.buttons.map(btn => (
                            <button
                              key={btn.id}
                              onClick={() => sendMessage(btn.title)}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-xs px-4 py-3">
                      <div className="flex gap-1.5 items-center h-4">
                        {[0, 150, 300].map(d => (
                          <div
                            key={d}
                            className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick Questions */}
              <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900 flex gap-2 overflow-x-auto no-scrollbar">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="btn-secondary py-1 px-2.5 text-[11px] whitespace-nowrap shrink-0 hover:border-violet-500/50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3.5 border-t border-zinc-800 bg-zinc-900 flex gap-2">
                <input
                  className="input flex-1 py-2 text-xs"
                  placeholder="Escribe tu pregunta o pon a prueba el bot..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="btn-primary px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="card p-5 border-zinc-800 space-y-3">
              <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                ¿Cómo aprende el Asistente?
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                El bot combina 3 capas de inteligencia en cada respuesta:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="font-bold text-zinc-200">1. Catálogo en Vivo</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Precios, duraciones y horarios de barberos en tiempo real.</div>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="font-bold text-zinc-200">2. Base de Conocimiento</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Preguntas sobre parqueadero, comodidades, niños, mascotas.</div>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="font-bold text-zinc-200">3. Slot Booking Engine</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Detecta citas deseadas y ofrece únicamente espacios libres.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE MANAGER */}
      {activeTab === 'knowledge' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-zinc-100">Preguntas Frecuentes & Reglas del Negocio</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Añade respuestas personalizadas para que el bot responda exactamente como tú deseas.
              </p>
            </div>

            <button
              onClick={() => setIsAddingFaq(true)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Añadir Conocimiento
            </button>
          </div>

          {/* New FAQ Modal / Card */}
          {isAddingFaq && (
            <form onSubmit={handleCreateKnowledge} className="card p-5 border-violet-500/40 bg-violet-950/10 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-violet-300">Nueva Pregunta o Regla de Atención</h4>
                <button type="button" onClick={() => setIsAddingFaq(false)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Pregunta o Tema *</label>
                  <input
                    required
                    className="input text-xs"
                    placeholder="Ej: ¿Aceptan pagos con tarjeta de crédito?"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Categoría</label>
                  <select
                    className="input text-xs"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                  >
                    <option value="faq">Pregunta Frecuente (General)</option>
                    <option value="parking">Parqueadero</option>
                    <option value="amenities">Comodidades / Bebidas</option>
                    <option value="rules">Políticas / Niños / Mascotas</option>
                    <option value="promotions">Promociones</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Respuesta Oficial de la Barbería *</label>
                  <textarea
                    required
                    rows={3}
                    className="input text-xs"
                    placeholder="Escribe la respuesta exacta que el bot entregará a los clientes..."
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Palabras clave / Etiquetas (separadas por coma)</label>
                  <input
                    className="input text-xs"
                    placeholder="tarjeta, datáfono, mastercard, visa"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingFaq(false)} className="btn-secondary text-xs">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary text-xs bg-violet-600 hover:bg-violet-500">
                  Guardar en Base de Conocimiento
                </button>
              </div>
            </form>
          )}

          {/* FAQ List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chatbotKnowledge.map(item => (
              <div key={item.id} className="card p-4 border-zinc-800 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge-violet text-[10px] uppercase font-bold tracking-wider">
                      {item.category}
                    </span>
                    <button
                      onClick={() => deleteKnowledgeItem(item.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100">{item.question}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.answer}</p>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-800/60">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TONE & PERSONALITY */}
      {activeTab === 'tone' && (
        <div className="max-w-2xl space-y-5">
          <div className="card p-6 space-y-5">
            <div>
              <h3 className="font-bold text-base text-zinc-100">Personalidad del Bot</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Elige el estilo y vocabulario con el que el chatbot hablará por WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'urbano',
                  title: '💈 Urbano / Street',
                  desc: '"¡Qué onda bro! Bienvenido a la barbería, ¿qué corte te hacemos hoy?"',
                },
                {
                  id: 'profesional',
                  title: '👔 Profesional / Elegante',
                  desc: '"Estimado cliente, bienvenido a The Black Chair. ¿Desea consultar disponibilidad?"',
                },
                {
                  id: 'casual',
                  title: '👋 Casual / Amigable',
                  desc: '"¡Hola Juan! Bienvenido a nuestro salón. ¿En qué te ayudamos hoy?"',
                },
                {
                  id: 'premium',
                  title: '✨ Premium & Executive',
                  desc: '"Bienvenido a la experiencia ChairPro. Es un placer atenderle."',
                },
              ].map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setBotTone(t.id as any);
                    updateChatbotConfig({ tone: t.id as any });
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1.5',
                    botTone === t.id
                      ? 'border-violet-500 bg-violet-600/10 shadow-lg'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  )}
                >
                  <div className="font-bold text-xs text-zinc-100">{t.title}</div>
                  <div className="text-[11px] text-zinc-400 italic leading-snug">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
