'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  Palette, Sun, Moon, Image as ImageIcon, Check,
  Sparkles, Scissors, Eye, ExternalLink,
  Upload, Smartphone, Laptop, Wand2, RefreshCw, Layers, Sliders,
  Save, Undo2
} from 'lucide-react';
import Link from 'next/link';
import { ShopLogo } from '@/components/shared/ShopLogo';

const COLOR_PRESETS = [
  { name: 'Violeta Royal', hex: '#7c3aed', desc: 'Moderno & Sofisticado' },
  { name: 'Verde Esmeralda', hex: '#10b981', desc: 'Clásico & Orgánico' },
  { name: 'Azul Neón', hex: '#0ea5e9', desc: 'Urbano & Tecnológico' },
  { name: 'Oro Luxury', hex: '#d97706', desc: 'Exclusivo & Vintage' },
  { name: 'Rojo Carmesí', hex: '#dc2626', desc: 'Fuerte & Dinámico' },
  { name: 'Rosa Magenta', hex: '#db2777', desc: 'Atrevido & Vanguardista' },
  { name: 'Gris Carbón', hex: '#52525b', desc: 'Minimalista & Elegante' },
  { name: 'Cian Turquesa', hex: '#06b6d4', desc: 'Fresco & Premium' },
  { name: 'Ámbar Sunset', hex: '#f59e0b', desc: 'Cálido & Enérgico' },
  { name: 'Bronce Vintage', hex: '#b45309', desc: 'Tradicional & Rústico' },
  { name: 'Obsidiana Slate', hex: '#334155', desc: 'Sobrio & Ejecutivo' },
  { name: 'Oro Rosa', hex: '#fb7185', desc: 'Elegante & Estilizado' },
];

const WALLPAPER_PRESETS = [
  {
    id: 'brick',
    name: 'Ladrillo Barber Vintage',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'salon',
    name: 'Interior Barbería Luxury',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'neon',
    name: 'Estudio Neón Urbano',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'carbon',
    name: 'Fibra de Carbono Mate',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'wood',
    name: 'Madera Nogal Clásica',
    url: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'smoke',
    name: 'Humo & Mármol Oscuro',
    url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=400&q=60',
  },
];

const LOGO_PRESETS = ['✂️', '💈', '👑', '🪒', '🧔', '⚡', '🦅', '🎯', '🦁', '🔥', '🛡️', '⚔️'];

const THEME_PROMPT_PRESETS = [
  {
    title: '💈 Gentleman Vintage',
    prompt: 'Barbería clásica vintage estilo Chicago con detalles de madera nogal y oro antiguo',
    color: '#d97706',
    mode: 'dark' as const,
    bgType: 'image' as const,
    bgUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=80',
    logo: '💈',
    tagline: 'Cortes clásicos, tradición y distinción desde 1970',
  },
  {
    title: '⚡ Cyberpunk Urbano',
    prompt: 'Barbería moderna urbana con luces de neón cyan y morado en ambiente nocturno',
    color: '#0ea5e9',
    mode: 'dark' as const,
    bgType: 'image' as const,
    bgUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80',
    logo: '⚡',
    tagline: 'Estilo vanguardista, fades perfectos y arte urbano',
  },
  {
    title: '👑 Luxury Black & Gold',
    prompt: 'Club exclusivo VIP de barbería con cuero negro, atmósfera premium y oro puro',
    color: '#d97706',
    mode: 'dark' as const,
    bgType: 'image' as const,
    bgUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80',
    logo: '👑',
    tagline: 'La experiencia de grooming más exclusiva para caballeros',
  },
  {
    title: '🌿 Orgánica & Spa',
    prompt: 'Barbería natural botánica con cuidados de barba orgánicos y ambiente verde esmeralda',
    color: '#10b981',
    mode: 'dark' as const,
    bgType: 'gradient' as const,
    bgUrl: '',
    logo: '🪒',
    tagline: 'Cuidado masculino natural y bienestar integral',
  },
  {
    title: '🏎️ Street & High-Fade',
    prompt: 'Barbería callejera de alta energía en rojo carmesí con textura de fibra de carbono',
    color: '#dc2626',
    mode: 'dark' as const,
    bgType: 'image' as const,
    bgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    logo: '🔥',
    tagline: 'Líneas afiladas, degradados extremos y actitud',
  },
  {
    title: '⚪ Minimalista Nórdica',
    prompt: 'Estudio de diseño capilar limpio, monocromático elegante y luminoso',
    color: '#52525b',
    mode: 'light' as const,
    bgType: 'gradient' as const,
    bgUrl: '',
    logo: '✂️',
    tagline: 'Precisión geométrica y pureza estética',
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export default function BrandingStudioPage() {
  const { currentShop, shops, updateShopBranding } = useStore();
  const targetShop = currentShop || shops[0];

  const [shopName, setShopName] = useState(targetShop?.name || 'Mi Barbería');
  const [tagline, setTagline] = useState(targetShop?.theme?.tagline || '');
  const [logoUrl, setLogoUrl] = useState(targetShop?.theme?.logoUrl || '✂️');
  const [logoTab, setLogoTab] = useState<'emoji' | 'upload' | 'url'>('emoji');
  const [primaryColor, setPrimaryColor] = useState(targetShop?.theme?.primaryColor || '#7c3aed');
  const [mode, setMode] = useState<'dark' | 'light'>(targetShop?.theme?.mode || 'dark');
  const [backgroundType, setBackgroundType] = useState<'gradient' | 'solid' | 'image'>(
    targetShop?.theme?.backgroundType || 'gradient'
  );
  const [backgroundImage, setBackgroundImage] = useState(targetShop?.theme?.backgroundImage || '');
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    targetShop?.theme?.backgroundOpacity ?? 0.35
  );
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [savedAlert, setSavedAlert] = useState(false);

  // AI Prompt theme creator state
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccessMsg, setGeneratedSuccessMsg] = useState('');

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const isLogoImage = Boolean(
    logoUrl &&
    (logoUrl.startsWith('http') || logoUrl.startsWith('data:image') || logoUrl.startsWith('/'))
  );

  // Sync with currentShop if switched
  useEffect(() => {
    if (targetShop) {
      setShopName(targetShop.name);
      setTagline(targetShop.theme?.tagline || '');
      setLogoUrl(targetShop.theme?.logoUrl || '✂️');
      setPrimaryColor(targetShop.theme?.primaryColor || '#7c3aed');
      setMode(targetShop.theme?.mode || 'dark');
      setBackgroundType(targetShop.theme?.backgroundType || 'gradient');
      setBackgroundImage(targetShop.theme?.backgroundImage || '');
      setBackgroundOpacity(targetShop.theme?.backgroundOpacity ?? 0.15);
    }
  }, [targetShop]);

  // LIVE CSS INJECTION: Update document variables immediately as controls move
  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(primaryColor) || { r: 124, g: 58, b: 237 };
    root.style.setProperty('--brand-primary', primaryColor);
    root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty(
      '--brand-glow',
      `0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`
    );

    if (mode === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }
  }, [primaryColor, mode]);

  const handleSave = () => {
    const shopToUpdate = currentShop || shops[0];
    if (!shopToUpdate) return;

    updateShopBranding(shopToUpdate.id, {
      name: shopName,
      tagline,
      logoUrl,
      primaryColor,
      mode,
      backgroundType,
      backgroundImage,
      backgroundOpacity,
    });

    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3500);
  };

  // Handle local logo file upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local wallpaper file upload
  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('El fondo no debe superar los 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackgroundImage(reader.result);
        setBackgroundType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  // Interpret natural language instructions into a cohesive theme
  const handleGenerateThemeFromPrompt = (promptText: string) => {
    const p = promptText.toLowerCase();
    setIsGenerating(true);

    setTimeout(() => {
      let chosenColor = '#7c3aed';
      let chosenMode: 'dark' | 'light' = 'dark';
      let chosenBgType: 'gradient' | 'solid' | 'image' = 'image';
      let chosenBgUrl = WALLPAPER_PRESETS[0].url;
      let chosenLogo = '✂️';
      let chosenTagline = tagline;

      // Detect colors
      if (p.includes('oro') || p.includes('dorad') || p.includes('gold') || p.includes('vintage') || p.includes('gentleman')) {
        chosenColor = '#d97706';
        chosenBgUrl = WALLPAPER_PRESETS[0].url;
        chosenLogo = '💈';
        if (!tagline || tagline.length < 5) chosenTagline = 'Tradición, estilo clásico y navaja libre.';
      } else if (p.includes('azul') || p.includes('cyan') || p.includes('neon') || p.includes('neón') || p.includes('cyber') || p.includes('tecno')) {
        chosenColor = '#0ea5e9';
        chosenBgUrl = WALLPAPER_PRESETS[2].url;
        chosenLogo = '⚡';
        if (!tagline || tagline.length < 5) chosenTagline = 'Diseño vanguardista y cortes de alta precisión.';
      } else if (p.includes('verde') || p.includes('esmeralda') || p.includes('organ') || p.includes('natural') || p.includes('spa') || p.includes('botan')) {
        chosenColor = '#10b981';
        chosenBgType = 'gradient';
        chosenLogo = '🪒';
        if (!tagline || tagline.length < 5) chosenTagline = 'Cuidado de barba orgánico y relajación total.';
      } else if (p.includes('rojo') || p.includes('carmesi') || p.includes('fuego') || p.includes('sport') || p.includes('callej') || p.includes('urban')) {
        chosenColor = '#dc2626';
        chosenBgUrl = WALLPAPER_PRESETS[3].url;
        chosenLogo = '🔥';
        if (!tagline || tagline.length < 5) chosenTagline = 'Degradados de impacto y estética urbana.';
      } else if (p.includes('morado') || p.includes('violet') || p.includes('purple') || p.includes('royal')) {
        chosenColor = '#7c3aed';
        chosenBgUrl = WALLPAPER_PRESETS[1].url;
        chosenLogo = '👑';
        if (!tagline || tagline.length < 5) chosenTagline = 'Experiencia premium y estilo contemporáneo.';
      } else if (p.includes('rosa') || p.includes('magenta')) {
        chosenColor = '#db2777';
        chosenLogo = '🎯';
      } else if (p.includes('blanc') || p.includes('clar') || p.includes('minimal') || p.includes('nordic') || p.includes('luz')) {
        chosenColor = '#52525b';
        chosenMode = 'light';
        chosenBgType = 'solid';
        chosenLogo = '✂️';
        if (!tagline || tagline.length < 5) chosenTagline = 'Líneas limpias y estética contemporánea.';
      }

      // Check mode hints
      if (p.includes('claro') || p.includes('light') || p.includes('blanco')) {
        chosenMode = 'light';
      } else if (p.includes('oscuro') || p.includes('dark') || p.includes('negro') || p.includes('noche')) {
        chosenMode = 'dark';
      }

      // Apply interpreted parameters
      setPrimaryColor(chosenColor);
      setMode(chosenMode);
      setBackgroundType(chosenBgType);
      if (chosenBgType === 'image') {
        setBackgroundImage(chosenBgUrl);
      }
      setLogoUrl(chosenLogo);
      if (chosenTagline) setTagline(chosenTagline);

      setIsGenerating(false);
      setGeneratedSuccessMsg(`¡Tema generado con éxito según tu indicación! Revisa la vista previa y guarda.`);
      setTimeout(() => setGeneratedSuccessMsg(''), 4500);
    }, 350);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge px-2.5 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-300 border-violet-500/30">
              White-Label Branding Studio Live
            </span>
            <span className="text-xs text-zinc-500">Edición en Tiempo Real & Supabase Sync</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-zinc-100">
            Personaliza la Identidad Visual de {shopName || currentShop?.name || 'tu Barbería'}
          </h1>
          <p className="text-sm text-zinc-400">
            Modifica logotipo, paletas de color, fondos y estilos con edición en vivo instantánea.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="btn-primary px-5 py-2.5 shadow-lg text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            <Check className="w-4 h-4" />
            Guardar y Aplicar Cambios
          </button>
        </div>
      </div>

      {savedAlert && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>¡Marca actualizada en tiempo real!</strong> El tema, logotipo y fondos se han sincronizado con Supabase y se ven reflejados en tu panel y portal de clientes.
            </span>
          </div>
          <Link
            href={`/booking/${currentShop?.slug || 'the-black-chair'}`}
            target="_blank"
            className="text-xs font-bold text-emerald-200 underline hover:text-white flex items-center gap-1 shrink-0"
          >
            Ver portal en vivo ↗
          </Link>
        </div>
      )}

      {/* Feature 1: AI Prompt / Indicaciones Theme Generator */}
      <div className="card p-5 border-violet-500/30 bg-gradient-to-r from-violet-950/30 via-zinc-900 to-zinc-900 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                Generador de Temas por Indicaciones
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  IA Live
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Escribe cómo deseas el estilo de tu barbería o pulsa una sugerencia para aplicar combinaciones completas en 1 clic.
              </p>
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ej: Barbería vintage de caballeros con madera nogal y oro, o Cyberpunk neón en azul..."
              className="input w-full pr-10 text-xs sm:text-sm bg-zinc-950/80 border-zinc-700 focus:border-violet-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customPrompt.trim()) {
                  handleGenerateThemeFromPrompt(customPrompt);
                }
              }}
            />
            {customPrompt && (
              <button
                type="button"
                onClick={() => setCustomPrompt('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!customPrompt.trim() || isGenerating}
            onClick={() => handleGenerateThemeFromPrompt(customPrompt)}
            className="btn-primary px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Crear Tema con esta Indicación
          </button>
        </div>

        {/* Quick presets chips */}
        <div className="pt-3">
          <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
            O elige un estilo predefinido listo para usar:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {THEME_PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setCustomPrompt(preset.prompt);
                  handleGenerateThemeFromPrompt(preset.prompt);
                }}
                className="px-2.5 py-1 rounded-lg text-xs border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                <span>{preset.title}</span>
              </button>
            ))}
          </div>
        </div>

        {generatedSuccessMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-200 text-xs flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span>{generatedSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Layout: Controls (Left) & Real-Time Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Business Identity & Logo */}
          <div className="card p-5 border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Scissors className="w-4 h-4" style={{ color: primaryColor }} />
              1. Nombre & Logotipo de la Barbería
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Nombre comercial de la barbería</label>
                <input
                  type="text"
                  className="input"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ej. The Black Chair"
                />
              </div>

              <div className="form-group">
                <label className="label">Slogan o Frase identificadora</label>
                <input
                  type="text"
                  className="input"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ej. Cortes legendarios y estilo único"
                />
              </div>
            </div>

            {/* Logo Options: Emoji vs Custom File vs URL */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Logotipo / Emblema</label>
                <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setLogoTab('emoji')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      logoTab === 'emoji' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Emblema Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoTab('upload')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      logoTab === 'upload' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Subir Imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoTab('url')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      logoTab === 'url' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    URL de Logo
                  </button>
                </div>
              </div>

              {/* Logo Tab 1: Emoji */}
              {logoTab === 'emoji' && (
                <div className="flex items-center gap-2 flex-wrap pt-1 animate-fade-in">
                  {LOGO_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setLogoUrl(emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        logoUrl === emoji
                          ? 'border-white bg-zinc-800 scale-110 shadow-md'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Logo Tab 2: Upload File */}
              {logoTab === 'upload' && (
                <div className="pt-1 animate-fade-in space-y-3">
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-violet-500 rounded-xl p-4 text-center cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all"
                  >
                    <Upload className="w-6 h-6 mx-auto text-zinc-400 mb-1" />
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Haz clic para subir el archivo de tu Logo
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Soporta PNG transparente, SVG, JPG o WebP (máx. 3MB)
                    </span>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFileUpload}
                    />
                  </div>

                  {isLogoImage && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="w-12 h-12 object-contain rounded-lg border border-zinc-700 bg-zinc-950 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-zinc-200 font-semibold block truncate">Logo cargado</span>
                        <span className="text-[10px] text-emerald-400">✓ Listo para aplicar</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLogoUrl('✂️')}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Logo Tab 3: URL */}
              {logoTab === 'url' && (
                <div className="pt-1 animate-fade-in space-y-2">
                  <input
                    type="url"
                    className="input text-xs font-mono"
                    placeholder="https://tu-sitio.com/logo-barberia.png"
                    value={logoUrl.startsWith('http') ? logoUrl : ''}
                    onChange={(e) => setLogoUrl(e.target.value || '✂️')}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Pega el enlace directo a tu imagen o CDN de marca.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Color Palette */}
          <div className="card p-5 border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4" style={{ color: primaryColor }} />
              2. Color Primario & Acentos de Marca
            </h2>
            <p className="text-xs text-zinc-400">
              Personaliza el color de los botones, acentos de citas, selecciones de calendario, tarjetas y estilo general del SaaS.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = primaryColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setPrimaryColor(preset.hex)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-white bg-zinc-800/80 shadow-md scale-105'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 truncate">{preset.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{preset.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Picker */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">O elige un color hexadecimal exacto:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <input
                  type="text"
                  className="input w-24 text-xs font-mono py-1 px-2 uppercase"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Theme Mode & Backgrounds */}
          <div className="card p-5 border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: primaryColor }} />
              3. Modo de Pantalla & Fondos del SaaS
            </h2>

            {/* Mode: Dark vs Light */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all ${
                  mode === 'dark'
                    ? 'border-violet-500 bg-violet-600/10 text-white font-semibold'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Moon className="w-4 h-4 text-violet-400" />
                <span className="text-xs">Modo Oscuro Moderno</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('light')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all ${
                  mode === 'light'
                    ? 'border-violet-500 bg-violet-600/10 text-white font-semibold'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs">Modo Claro Elegante</span>
              </button>
            </div>

            {/* Background Style */}
            <div className="pt-2">
              <label className="label">Tipo de fondo del sistema</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gradient', label: 'Degradado Neón' },
                  { id: 'solid', label: 'Sólido Minimal' },
                  { id: 'image', label: 'Imagen / Wallpaper' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackgroundType(bg.id as any)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      backgroundType === bg.id
                        ? 'border-white bg-zinc-800 text-zinc-100 font-semibold shadow'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper Selection if backgroundType === 'image' */}
            {backgroundType === 'image' && (
              <div className="pt-3 border-t border-zinc-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Galería de Wallpapers de Barbería</label>
                  <button
                    type="button"
                    onClick={() => bgFileInputRef.current?.click()}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir fondo propio
                  </button>
                  <input
                    ref={bgFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBgFileUpload}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WALLPAPER_PRESETS.map((wp) => (
                    <div
                      key={wp.id}
                      onClick={() => setBackgroundImage(wp.url)}
                      className={`group relative h-20 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        backgroundImage === wp.url ? 'border-white ring-2 ring-violet-500 scale-105' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                      style={{
                        backgroundImage: `url(${wp.thumb})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                        <span className="text-[10px] text-white font-medium truncate">{wp.name}</span>
                      </div>
                      {backgroundImage === wp.url && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group pt-2">
                  <label className="label">O pega una URL de imagen personalizada</label>
                  <input
                    type="url"
                    className="input text-xs font-mono"
                    placeholder="https://ejemplo.com/mi-wallpaper.jpg"
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                  />
                </div>

                {/* Opacity slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                      Opacidad del fondo (intensidad del wallpaper)
                    </span>
                    <span className="font-mono text-zinc-200">{(backgroundOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.85"
                    step="0.05"
                    value={backgroundOpacity}
                    onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 border-zinc-800 sticky top-4">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-100">Vista Previa en Vivo</h3>
              </div>

              {/* Device switcher */}
              <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  title="Vista Móvil"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  title="Vista Escritorio"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mock Screen */}
            <div
              className={`rounded-2xl border p-4 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                mode === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-zinc-100 border-zinc-800'
              }`}
            >
              {/* Mock wallpaper layer */}
              {backgroundType === 'image' && backgroundImage && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: backgroundOpacity,
                  }}
                />
              )}

              {/* Mock ambient gradient */}
              {backgroundType === 'gradient' && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 20%, ${primaryColor}22 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* Mock content */}
              <div className="relative z-10 space-y-3.5">
                {/* Mock Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/40">
                  <div className="flex items-center gap-2.5">
                    <ShopLogo
                      logoUrl={logoUrl}
                      shopName={shopName || 'Mi Barbería'}
                      primaryColor={primaryColor}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-bold truncate max-w-[150px]">{shopName || 'Nombre Barbería'}</div>
                      <div className="text-[9px] text-zinc-400 truncate max-w-[150px]">{tagline || 'Eslogan aquí'}</div>
                    </div>
                  </div>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                  >
                    Abierto Hoy
                  </span>
                </div>

                {/* Mock Card */}
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    mode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Corte Signature Fade</span>
                    <span className="font-bold font-mono" style={{ color: primaryColor }}>$50.000</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Degradado a navaja y terminado con lavado premium.</p>
                  <button
                    type="button"
                    className="w-full py-1.5 rounded-lg text-white text-[11px] font-semibold shadow-md flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Reservar Turno</span>
                  </button>
                </div>

                {/* Mock Date Selector */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  {['Lun', 'Mar', 'Mié', 'Jue'].map((d, i) => (
                    <div
                      key={d}
                      className={`p-1.5 rounded-lg border ${
                        i === 1
                          ? 'font-bold text-white shadow-sm'
                          : mode === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                      style={i === 1 ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                    >
                      <div>{d}</div>
                      <div className="font-semibold">{15 + i}</div>
                    </div>
                  ))}
                </div>

                {/* Mock Footer */}
                <div className="text-center pt-2 text-[9px] text-zinc-500">
                  Impulsado por <strong style={{ color: primaryColor }}>MartiArenas Labs</strong>
                </div>
              </div>
            </div>

            {/* Open Client View Link */}
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <Link
                href={`/booking/${currentShop?.slug || 'the-black-chair'}`}
                target="_blank"
                className="w-full btn-secondary btn-sm flex items-center justify-center gap-2 text-xs py-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Portal del Cliente en Nueva Pestaña
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
