'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils';
import { format } from 'date-fns';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message { role: 'user' | 'assistant'; text: string; ts: Date; }

function getResponse(input: string, store: ReturnType<typeof useStore.getState>): string {
  const q = input.toLowerCase();
  const { services, barbers, appointments, currentShop } = store;
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppts = appointments.filter(a => a.date === today && ['scheduled', 'confirmed'].includes(a.status));

  if (q.includes('precio') || q.includes('cuánto cuesta') || q.includes('cuesta')) {
    const results = services.filter(s => s.isActive).map(s => `• ${s.name}: ${formatCurrency(s.price)} (${s.duration} min)`).join('\n');
    return `Nuestros servicios y precios son:\n${results}\n\n¿Con cuál te gustaría agendar?`;
  }

  if (q.includes('barbero') || q.includes('quién trabaja') || q.includes('quien trabaja')) {
    const active = barbers.filter(b => b.isActive);
    const result = active.map(b => `• ${b.name} — ${b.specialties.join(', ')}`).join('\n');
    return `Nuestro equipo:\n${result}\n\n¿Con cuál quieres agendar tu cita?`;
  }

  if (q.includes('horario') || q.includes('hora') || q.includes('disponible') || q.includes('disponibilidad')) {
    const shop = currentShop;
    if (!shop) return 'No se pudo obtener información de horarios.';
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    const schedule = days.map((d, i) => {
      const h = shop.workingHours[d as any];
      return h.isOpen ? `• ${dayNames[i]}: ${h.open} – ${h.close}` : `• ${dayNames[i]}: Cerrado`;
    }).join('\n');
    return `Nuestros horarios de atención:\n${schedule}\n\nPuedes reservar escaneando nuestro código QR o directamente en nuestra página de reservas.`;
  }

  if (q.includes('cita') && (q.includes('mañana') || q.includes('manana'))) {
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
    const tmrAppts = appointments.filter(a => a.date === tomorrow && ['scheduled', 'confirmed'].includes(a.status));
    return `Para mañana hay ${tmrAppts.length} citas agendadas. Para ver disponibilidad completa, selecciona un barbero y servicio en la sección de reservas.`;
  }

  if (q.includes('cita') && q.includes('hoy')) {
    return `Hoy hay ${todayAppts.length} citas pendientes. Los barberos disponibles están atendiendo. Puedes agendar tu cita directamente desde nuestra página de reservas o escaneando el QR.`;
  }

  if (q.includes('corte') && q.includes('barba') || q.includes('combo')) {
    const combo = services.find(s => s.category === 'combo');
    if (combo) return `El servicio Corte + Barba tiene un precio de ${formatCurrency(combo.price)} y una duración de ${combo.duration} minutos. ¡Es nuestro combo más popular! ¿Quieres agendar?`;
  }

  if (q.includes('cancelar') || q.includes('reprogramar')) {
    return `Para cancelar o reprogramar una cita, el administrador puede hacerlo desde el panel de Citas o el Calendario. Los clientes pueden cancelar hasta ${currentShop?.settings?.cancellationPolicyHours || 2} horas antes sin cargo.`;
  }

  if (q.includes('sábado') || q.includes('sabado')) {
    const shop = currentShop;
    const satHours = shop?.workingHours.saturday;
    const satBarbers = barbers.filter(b => b.isActive && b.schedule.find(s => s.day === 'saturday' && s.isWorking));
    return `Los sábados atendemos de ${satHours?.open || '08:00'} a ${satHours?.close || '18:00'}. Trabajan: ${satBarbers.map(b => b.name.split(' ')[0]).join(', ')}.`;
  }

  if (q.includes('whatsapp') || q.includes('contacto') || q.includes('llamar')) {
    return `Puedes contactarnos por WhatsApp al ${currentShop?.whatsapp || '+57 316 555 0190'} o reservar directamente desde nuestra página de reservas. ¡También tenemos código QR disponible para reservar al instante!`;
  }

  if (q.includes('producto') || q.includes('cera') || q.includes('pomada') || q.includes('venta')) {
    return `Vendemos productos premium para el cuidado del cabello y la barba: ceras, pomadas, aceites, shampoos y más. Pregunta al barbero durante tu visita o revisa nuestra sección de productos.`;
  }

  if (q.includes('hola') || q.includes('buenos') || q.includes('saludos')) {
    return `¡Hola! Bienvenido a ${currentShop?.name || 'The Black Chair'}. Soy el asistente virtual. Puedo ayudarte con:\n• Precios y servicios\n• Horarios y disponibilidad\n• Información de barberos\n• Cómo reservar tu cita\n\n¿En qué te puedo ayudar?`;
  }

  return `Puedo ayudarte con información sobre nuestros servicios, precios, horarios, barberos disponibles y cómo reservar tu cita.\n\nAlgunas cosas que puedes preguntarme:\n• "¿Qué servicios ofrecen?"\n• "¿Cuánto cuesta un corte + barba?"\n• "¿Qué horarios tienen mañana?"\n• "¿Qué barberos trabajan el sábado?"`;
}

export default function AssistantPage() {
  const store = useStore();
  const { currentShop } = store;
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    text: `¡Hola! Soy el asistente inteligente de ${currentShop?.name || 'The Black Chair'}. Puedo responder preguntas sobre servicios, horarios, precios y disponibilidad usando los datos reales de la barbería. ¿En qué te ayudo?`,
    ts: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [
    '¿Cuáles son los precios?',
    '¿Qué horarios tienen hoy?',
    '¿Qué barberos trabajan el sábado?',
    '¿Cuánto cuesta corte + barba?',
  ];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    const response = getResponse(text, useStore.getState());
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', text: response, ts: new Date() }]);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div>
        <h2 className="section-title">Asistente Inteligente</h2>
        <p className="section-desc">Responde con datos reales de la barbería — base para integración con WhatsApp</p>
      </div>

      {/* Note */}
      <div className="flex items-center gap-3 p-3 bg-violet-600/5 border border-violet-600/20 rounded-xl">
        <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
        <div className="text-xs text-zinc-500">El asistente consulta los datos reales del sistema (servicios, precios, horarios, barberos). No inventa información. Listo para integrar con WhatsApp Business API.</div>
      </div>

      {/* Chat */}
      <div className="card flex flex-col" style={{ height: '60vh' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-violet-400" /></div>
              )}
              <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line', msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-300 rounded-tl-sm border border-zinc-700')}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="avatar w-8 h-8 text-xs shrink-0">Yo</div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-violet-400" /></div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div className="px-4 py-2 border-t border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)} className="btn-secondary btn-sm text-xs whitespace-nowrap flex-shrink-0">{q}</button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-800 flex gap-3">
          <input
            className="input flex-1"
            placeholder="Escribe tu pregunta..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping} className="btn-primary px-4">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
