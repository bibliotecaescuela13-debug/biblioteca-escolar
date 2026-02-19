import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Download,
  Library,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { downloadExcelTemplate, exportToCSV, parseCSV } from './lib/exportUtils';

const ADMIN_EMAIL = 'bibliotecamarianomoreno9@gmail.com';

export default function App() {
  const [activeModule, setActiveModule] = useState('opac');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false); // preparado para próximas vistas alumno

  const [session, setSession] = useState(null);
  const [libros, setLibros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [serviciosImpresion, setServiciosImpresion] = useState([]);
  const [serviciosVideo, setServiciosVideo] = useState([]);
  const [actividadesLectura, setActividadesLectura] = useState([]);

  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const toastSuccess = (message) => addToast('success', message);
  const toastError = (message) => addToast('error', message);

  const confirmAction = ({ title, text, confirmText = 'Confirmar', cancelText = 'Cancelar' }) =>
    new Promise((resolve) => {
      setConfirmState({ title, text, confirmText, cancelText, resolve });
    });

  const resolveConfirm = (value) => {
    if (confirmState?.resolve) confirmState.resolve(value);
    setConfirmState(null);
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      handleSession(data.session);
      setAuthLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleSession = (currentSession) => {
    setSession(currentSession);
    const email = currentSession?.user?.email?.toLowerCase() || '';

    if (!email) {
      setIsAdmin(false);
      setIsStudent(false);
      return;
    }

    if (email === ADMIN_EMAIL) {
      setIsAdmin(true);
      setIsStudent(false);
      return;
    }

    // futura extensión para estudiantes
    setIsAdmin(false);
    setIsStudent(true);
  };

  const loadPublicData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('libros').select('*').order('titulo');
      if (error) throw error;
      setLibros(data || []);
    } catch (error) {
      toastError(`Error cargando catálogo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [usersRes, loansRes, printRes, videoRes, readingRes, booksRes] = await Promise.all([
        supabase.from('usuarios').select('*').order('nombre'),
        supabase.from('prestamos').select('*').order('created_at', { ascending: false }),
        supabase.from('servicios_impresion').select('*').order('created_at', { ascending: false }),
        supabase.from('servicios_video').select('*').order('created_at', { ascending: false }),
        supabase.from('actividades_lectura').select('*').order('fecha', { ascending: false }),
        supabase.from('libros').select('*').order('titulo'),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (loansRes.error) throw loansRes.error;
      if (printRes.error) throw printRes.error;
      if (videoRes.error) throw videoRes.error;
      if (readingRes.error) throw readingRes.error;
      if (booksRes.error) throw booksRes.error;

      setUsuarios(usersRes.data || []);
      setPrestamos(loansRes.data || []);
      setServiciosImpresion(printRes.data || []);
      setServiciosVideo(videoRes.data || []);
      setActividadesLectura(readingRes.data || []);
      setLibros(booksRes.data || []);
    } catch (error) {
      toastError(`Error cargando panel admin: ${error.message}`);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

    if (error) toastError(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setActiveModule('opac');
    toastSuccess('Sesión cerrada correctamente.');
  };

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'prestamos', label: 'Préstamos', icon: BookOpen },
    { id: 'impresion', label: 'Impresión', icon: Printer },
    { id: 'video', label: 'Sala Video', icon: Video },
    { id: 'lectura', label: 'Lectura', icon: Sparkles },
    { id: 'catalogacion', label: 'Catalogación', icon: Library },
  ];

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col">
      <header className="bg-gradient-to-r from-amber-800 via-orange-800 to-red-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-xl rotate-3 shadow-lg">
              <BookOpen className="w-7 h-7 text-amber-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Biblioteca Mariano Moreno</h1>
              <p className="text-amber-100 text-sm sm:text-base font-semibold">Escuela N° 13 "Blanco Encalada"</p>
              <p className="text-amber-200 text-xs sm:text-sm">Eva Perón 651, General Ramírez, Entre Ríos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('opac')}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-semibold transition-all"
            >
              Catálogo OPAC
            </button>

            {!session && (
              <button
                onClick={loginWithGoogle}
                className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Acceso Bibliotecario
              </button>
            )}

            {session && (
              <button
                onClick={logout}
                className="text-sm bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full">
          <WarningBanner text="Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env para habilitar autenticación y persistencia." />
        </div>
      )}

      {session && !isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full">
          <AccessDenied onLogout={logout} />
        </div>
      )}

      {isAdmin && (
        <nav className="bg-white shadow-lg border-b-4 border-amber-400 sticky top-[96px] z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex gap-1 py-2 overflow-x-auto">
              {adminNavItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveModule(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-semibold whitespace-nowrap ${
                    activeModule === id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:bg-amber-100 hover:text-amber-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full flex-1">
        {activeModule === 'opac' && <ModuloOPAC libros={libros} />}

        {isAdmin && activeModule === 'dashboard' && (
          <Dashboard
            usuarios={usuarios}
            prestamos={prestamos}
            serviciosImpresion={serviciosImpresion}
            serviciosVideo={serviciosVideo}
            actividadesLectura={actividadesLectura}
            libros={libros}
          />
        )}

        {isAdmin && activeModule === 'catalogacion' && (
          <ModuloCatalogacion
            libros={libros}
            onReload={loadAdminData}
            toastSuccess={toastSuccess}
            toastError={toastError}
            confirmAction={confirmAction}
          />
        )}

        {isAdmin && activeModule === 'usuarios' && (
          <ModuloUsuarios
            usuarios={usuarios}
            onReload={loadAdminData}
            toastSuccess={toastSuccess}
            toastError={toastError}
            confirmAction={confirmAction}
          />
        )}

        {isAdmin && activeModule === 'prestamos' && (
          <ModuloPrestamos
            libros={libros}
            usuarios={usuarios}
            prestamos={prestamos}
            onReload={loadAdminData}
            toastSuccess={toastSuccess}
            toastError={toastError}
            confirmAction={confirmAction}
          />
        )}

        {isAdmin && activeModule === 'impresion' && (
          <ModuloImpresion
            usuarios={usuarios}
            servicios={serviciosImpresion}
            onReload={loadAdminData}
            toastSuccess={toastSuccess}
            toastError={toastError}
            confirmAction={confirmAction}
          />
        )}

        {isAdmin && activeModule === 'video' && (
          <ModuloVideo
            usuarios={usuarios}
            servicios={serviciosVideo}
            onReload={loadAdminData}
            toastSuccess={toastSuccess}
            toastError={toastError}
            confirmAction={confirmAction}
          />
        )}

        {isAdmin && activeModule === 'lectura' && (
          <ModuloLectura
            actividades={actividadesLectura}
            onReload={loadAdminData}
            toastSuccess={toastSuccess}
            toastError={toastError}
            confirmAction={confirmAction}
          />
        )}

        {isStudent && !isAdmin && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-400 text-amber-900">
            Próximamente: vista de estudiante con préstamos y deudas personales para la Biblioteca Mariano Moreno.
          </div>
        )}
      </main>

      <Footer />
      <ConfirmModal state={confirmState} onResolve={resolveConfirm} />
      <ToastViewport toasts={toasts} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xl text-amber-900 font-semibold">Cargando Biblioteca Mariano Moreno...</p>
      </div>
    </div>
  );
}

function WarningBanner({ text }) {
  return (
    <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 font-medium flex items-start gap-2">
      <AlertTriangle className="w-5 h-5 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

function AccessDenied({ onLogout }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-red-500">
      <h2 className="text-2xl font-bold text-red-700 mb-2">Acceso Denegado</h2>
      <p className="text-gray-700 mb-4">Esta cuenta no está autorizada para el panel de la Biblioteca Mariano Moreno.</p>
      <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
        Cerrar sesión
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-amber-900 via-orange-900 to-red-900 text-amber-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <p className="font-bold text-lg">Biblioteca Mariano Moreno — Escuela N° 13 "Blanco Encalada"</p>
        <p className="text-amber-200 text-sm">Eva Perón 651, General Ramírez, Entre Ríos</p>
        <p className="text-amber-300 text-xs mt-2">© {new Date().getFullYear()} Comunidad Educativa de la Escuela N° 13</p>
      </div>
    </footer>
  );
}

function ModuloOPAC({ libros }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return libros;
    return libros.filter((l) => (l.titulo || '').toLowerCase().includes(term) || (l.autor || '').toLowerCase().includes(term));
  }, [libros, query]);

  const recursos = [
    {
      icon: '📘',
      title: 'Seguinos en Facebook',
      description: 'Novedades, eventos y noticias de la Escuela N° 13 "Blanco Encalada".',
      url: 'https://www.facebook.com/61574999103555',
    },
    {
      icon: '📝',
      title: 'App Notitas',
      description: 'Herramienta para crear y previsualizar notitas para imprimir. Ideal para comunicados rápidos.',
      url: 'https://wox9000.github.io/app-Notitas/',
    },
    {
      icon: '🔤',
      title: 'Convertir Apellidos',
      description: 'Utilidad para formatear y ordenar listas de nombres y apellidos por género. Muy útil para docentes.',
      url: 'https://wox9000.github.io/appConvertirApellidos/',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-amber-500">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
          <Library className="w-8 h-8 text-amber-600" />
          OPAC — Biblioteca Mariano Moreno
        </h2>
        <p className="text-gray-600 mb-4">Escuela N° 13 "Blanco Encalada" · General Ramírez, Entre Ríos</p>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título o autor"
            className="w-full border-2 border-amber-200 rounded-xl py-2.5 pl-10 pr-4 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => {
          const disponible = (l.cantidad_disponible ?? 0) > 0;
          return (
            <article key={l.id} className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-orange-500 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg text-gray-800">{l.titulo}</h3>
              <p className="text-gray-600">{l.autor || 'Autor no especificado'}</p>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold">ISBN:</span> {l.isbn || '—'}</p>
                <p><span className="font-semibold">Categoría:</span> {l.categoria || '—'}</p>
                <p><span className="font-semibold">Ubicación:</span> {l.ubicacion || '—'}</p>
              </div>
              <span className={`mt-4 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {disponible ? 'Disponible' : 'Prestado'}
              </span>
            </article>
          );
        })}
      </div>

      <section className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-orange-500">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Recursos y herramientas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recursos.map((item) => (
            <article key={item.title} className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow hover:shadow-lg transition-all">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h4 className="font-bold text-amber-900 text-lg">{item.title}</h4>
              <p className="text-sm text-amber-800 mt-2 min-h-[72px]">{item.description}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold px-4 py-2 rounded-lg"
              >
                Abrir recurso
              </a>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function Dashboard({ usuarios, prestamos, serviciosImpresion, serviciosVideo, actividadesLectura, libros }) {
  const prestamosActivos = prestamos.filter((p) => p.estado === 'activo').length;
  const stats = [
    { icon: Users, label: 'Usuarios', value: usuarios.length, color: 'from-cyan-500 to-cyan-700' },
    { icon: BookOpen, label: 'Préstamos Activos', value: prestamosActivos, color: 'from-blue-500 to-blue-700' },
    { icon: Printer, label: 'Impresiones', value: serviciosImpresion.length, color: 'from-purple-500 to-purple-700' },
    { icon: Video, label: 'Video', value: serviciosVideo.length, color: 'from-orange-500 to-orange-700' },
    { icon: Sparkles, label: 'Lectura', value: actividadesLectura.length, color: 'from-green-500 to-green-700' },
    { icon: Library, label: 'Libros', value: libros.length, color: 'from-amber-500 to-red-600' },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((s) => (
        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl shadow-lg p-5 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-lg">
              <s.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ActionButtons({ onEdit, onDelete, extraAction }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {extraAction}
      <button onClick={onEdit} className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800" title="Editar">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700" title="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function useEditFormScroll() {
  const formRef = useRef(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return { formRef, scrollToForm };
}

function ModuleHeader({ title, icon: Icon, color, showForm, setShowForm, onOpen }) {
  const map = {
    amber: 'from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800',
    blue: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    green: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
    orange: 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
    purple: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Icon className="w-8 h-8" />
        {title}
      </h2>
      <button
        onClick={() => {
          const next = !showForm;
          setShowForm(next);
          if (next && onOpen) onOpen();
        }}
        className={`flex items-center gap-2 bg-gradient-to-r ${map[color]} text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg`}
      >
        {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {showForm ? 'Cancelar' : 'Registrar'}
      </button>
    </div>
  );
}

async function fetchBookCandidates(term) {
  const normalized = term.trim();
  if (!normalized) return [];
  const isIsbn = /^\d{8,13}$/.test(normalized.replace(/[-\s]/g, ''));

  const mapGoogle = (item) => {
    const info = item?.volumeInfo || {};
    return {
      titulo: info.title || '',
      autor: (info.authors || []).join(', '),
      isbn: (info.industryIdentifiers || []).find((id) => id.type?.includes('ISBN'))?.identifier || '',
      categoria: (info.categories || []).join(', '),
      portada_url: info.imageLinks?.thumbnail || '',
    };
  };

  const mapOpenLibraryDoc = (doc) => ({
    titulo: doc.title || '',
    autor: (doc.author_name || []).join(', '),
    isbn: (doc.isbn || [])[0] || '',
    categoria: (doc.subject || []).slice(0, 3).join(', '),
    portada_url: (doc.isbn || [])[0] ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg` : '',
  });

  const googleUrl = isIsbn
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(normalized)}&maxResults=1`
    : `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(normalized)}&maxResults=5`;

  const googleRes = await fetch(googleUrl);
  if (googleRes.ok) {
    const googleJson = await googleRes.json();
    const googleItems = (googleJson.items || []).map(mapGoogle).filter((b) => b.titulo);
    if (googleItems.length) return googleItems.slice(0, 5);
  }

  const openUrl = isIsbn
    ? `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(normalized)}&format=json&jscmd=data`
    : `https://openlibrary.org/search.json?title=${encodeURIComponent(normalized)}&limit=5`;

  const openRes = await fetch(openUrl);
  if (!openRes.ok) return [];
  const openJson = await openRes.json();

  if (isIsbn) {
    const key = `ISBN:${normalized}`;
    const book = openJson[key];
    if (!book) return [];
    return [{
      titulo: book.title || '',
      autor: (book.authors || []).map((a) => a.name).join(', '),
      isbn: normalized,
      categoria: (book.subjects || []).map((s) => s.name).slice(0, 3).join(', '),
      portada_url: `https://covers.openlibrary.org/b/isbn/${normalized}-M.jpg`,
    }];
  }

  return (openJson.docs || []).slice(0, 5).map(mapOpenLibraryDoc).filter((b) => b.titulo);
}

function ModuloCatalogacion({ libros, onReload, toastSuccess, toastError, confirmAction }) {
  const empty = { titulo: '', autor: '', isbn: '', categoria: '', ubicacion: '', cantidad_total: '1', portada_url: '' };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(empty);
  const [lookupTerm, setLookupTerm] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupMessage, setLookupMessage] = useState('');
  const { formRef, scrollToForm } = useEditFormScroll();

  const save = async (e) => {
    e.preventDefault();
    const total = parseInt(formData.cantidad_total, 10) || 1;
    const payload = {
      titulo: formData.titulo,
      autor: formData.autor || null,
      isbn: formData.isbn || null,
      categoria: formData.categoria || null,
      ubicacion: formData.ubicacion || null,
      portada_url: formData.portada_url || null,
      cantidad_total: total,
      cantidad_disponible: total,
      estado: total > 0 ? 'disponible' : 'prestado',
    };

    const { error } = editId
      ? await supabase.from('libros').update(payload).eq('id', editId)
      : await supabase.from('libros').insert([payload]);

    if (error) return toastError(error.message);
    toastSuccess(editId ? 'Libro actualizado.' : 'Libro agregado.');
    setEditId(null);
    setFormData(empty);
    setShowForm(false);
    onReload();
  };

  const runLookup = async () => {
    if (!lookupTerm.trim()) return;
    setLookupLoading(true);
    setLookupMessage('');
    setLookupResults([]);
    try {
      const results = await fetchBookCandidates(lookupTerm);
      if (!results.length) {
        setLookupMessage('No se encontraron resultados. Podés completar los datos manualmente.');
        return;
      }
      setLookupResults(results);
    } catch (error) {
      toastError(`Error buscando metadatos: ${error.message}`);
    } finally {
      setLookupLoading(false);
    }
  };

  const applyLookup = (book) => {
    setFormData((prev) => ({
      ...prev,
      titulo: book.titulo || prev.titulo,
      autor: book.autor || prev.autor,
      isbn: book.isbn || prev.isbn,
      categoria: book.categoria || prev.categoria,
      portada_url: book.portada_url || prev.portada_url,
    }));
    setLookupResults([]);
    setLookupMessage('Datos aplicados al formulario.');
  };

  const edit = (row) => {
    setEditId(row.id);
    setFormData({
      titulo: row.titulo || '',
      autor: row.autor || '',
      isbn: row.isbn || '',
      categoria: row.categoria || '',
      ubicacion: row.ubicacion || '',
      cantidad_total: String(row.cantidad_total || 1),
      portada_url: row.portada_url || '',
    });
    setShowForm(true);
    setTimeout(scrollToForm, 20);
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Eliminar libro', text: 'Esta acción removerá el libro del catálogo.', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    const { error } = await supabase.from('libros').delete().eq('id', id);
    if (error) return toastError(error.message);
    toastSuccess('Libro eliminado.');
    onReload();
  };

  return (
    <section className="space-y-6">
      <ModuleHeader title="Módulo de Catalogación" icon={Library} color="amber" showForm={showForm} setShowForm={setShowForm} onOpen={scrollToForm} />
      {showForm && (
        <div ref={formRef} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-orange-400">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Autocompletar desde internet</h3>
            <div className="flex flex-col md:flex-row gap-3">
              <Input value={lookupTerm} onChange={(e) => setLookupTerm(e.target.value)} placeholder="Buscar por ISBN o título..." className="flex-1" />
              <button
                type="button"
                onClick={runLookup}
                disabled={lookupLoading}
                className="bg-gradient-to-r from-amber-600 to-orange-700 text-white font-semibold px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {lookupLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Buscar
              </button>
            </div>
            {lookupMessage && <p className="text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 text-sm font-medium">{lookupMessage}</p>}
            {lookupResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {lookupResults.map((book, idx) => (
                  <button
                    key={`${book.titulo}-${idx}`}
                    type="button"
                    onClick={() => applyLookup(book)}
                    className="w-full text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg p-3"
                  >
                    <p className="font-semibold text-amber-900">{book.titulo}</p>
                    <p className="text-sm text-amber-700">{book.autor || 'Autor no especificado'} · {book.isbn || 'ISBN sin dato'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={save} className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-l-8 border-amber-500">
            <FormGrid>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título" required />
              <Input value={formData.autor} onChange={(e) => setFormData({ ...formData, autor: e.target.value })} placeholder="Autor" />
              <Input value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} placeholder="ISBN" />
              <Input value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} placeholder="Categoría" />
              <Input value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} placeholder="Ubicación" />
              <Input type="number" min="1" value={formData.cantidad_total} onChange={(e) => setFormData({ ...formData, cantidad_total: e.target.value })} placeholder="Cantidad" />
              <Input value={formData.portada_url} onChange={(e) => setFormData({ ...formData, portada_url: e.target.value })} placeholder="URL de portada" className="md:col-span-2" />
              {formData.portada_url && (
                <div className="md:col-span-1 flex items-center">
                  <img src={formData.portada_url} alt="Portada" className="w-20 h-28 object-cover rounded-lg border border-amber-200" />
                </div>
              )}
            </FormGrid>
            <SubmitButton>{editId ? 'Guardar cambios' : 'Guardar libro'}</SubmitButton>
          </form>
        </div>
      )}

      <SimpleTable
        headers={['Título', 'Autor', 'ISBN', 'Stock', 'Acciones']}
        rows={libros.map((l) => [
          l.titulo,
          l.autor || '-',
          l.isbn || '-',
          `${l.cantidad_disponible ?? 0}/${l.cantidad_total ?? 0}`,
          <ActionButtons key={l.id} onEdit={() => edit(l)} onDelete={() => remove(l.id)} />,
        ])}
      />
    </section>
  );
}

function ModuloPrestamos({ libros, usuarios, prestamos, onReload, toastSuccess, toastError, confirmAction }) {
  const empty = { usuario_id: '', libro_id: '', fecha_devolucion_esperada: '', notas: '' };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(empty);
  const { formRef, scrollToForm } = useEditFormScroll();

  const librosDisponibles = libros.filter((l) => (l.cantidad_disponible ?? 0) > 0);

  const save = async (e) => {
    e.preventDefault();
    const usuario = usuarios.find((u) => u.id === formData.usuario_id);
    const libro = libros.find((l) => l.id === formData.libro_id);
    if (!usuario || !libro) return toastError('Seleccioná usuario y libro válidos.');

    const payload = {
      usuario_id: formData.usuario_id,
      libro_id: formData.libro_id,
      usuario_nombre: usuario.nombre,
      libro_titulo: libro.titulo,
      fecha_prestamo: new Date().toISOString().split('T')[0],
      fecha_devolucion_esperada: formData.fecha_devolucion_esperada,
      estado: 'activo',
      notas: formData.notas || null,
    };

    const { error } = editId
      ? await supabase.from('prestamos').update({ ...payload, fecha_devolucion_real: null }).eq('id', editId)
      : await supabase.from('prestamos').insert([payload]);

    if (error) return toastError(error.message);
    toastSuccess(editId ? 'Préstamo actualizado.' : 'Préstamo registrado.');
    setEditId(null);
    setFormData(empty);
    setShowForm(false);
    onReload();
  };

  const edit = (row) => {
    setEditId(row.id);
    setFormData({
      usuario_id: row.usuario_id || '',
      libro_id: row.libro_id || '',
      fecha_devolucion_esperada: row.fecha_devolucion_esperada || '',
      notas: row.notas || '',
    });
    setShowForm(true);
    setTimeout(scrollToForm, 20);
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Eliminar préstamo', text: 'Se eliminará el registro de préstamo.', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    const { error } = await supabase.from('prestamos').delete().eq('id', id);
    if (error) return toastError(error.message);
    toastSuccess('Préstamo eliminado.');
    onReload();
  };

  const markReturned = async (row) => {
    const ok = await confirmAction({ title: 'Registrar devolución', text: `¿Confirmás la devolución de "${row.libro_titulo}"?`, confirmText: 'Registrar' });
    if (!ok) return;
    const { error } = await supabase
      .from('prestamos')
      .update({ estado: 'devuelto', fecha_devolucion_real: new Date().toISOString().split('T')[0] })
      .eq('id', row.id);
    if (error) return toastError(error.message);
    toastSuccess('Devolución registrada.');
    onReload();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section className="space-y-6">
      <ModuleHeader title="Módulo de Préstamos" icon={BookOpen} color="blue" showForm={showForm} setShowForm={setShowForm} onOpen={scrollToForm} />
      {showForm && (
        <form ref={formRef} onSubmit={save} className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-l-8 border-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              required
              value={formData.usuario_id}
              onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
              options={[['', 'Seleccionar usuario...'], ...usuarios.map((u) => [u.id, `${u.nombre} (${u.tipo})`])]}
            />
            <Select
              required
              value={formData.libro_id}
              onChange={(e) => setFormData({ ...formData, libro_id: e.target.value })}
              options={[['', 'Seleccionar libro disponible...'], ...librosDisponibles.map((l) => [l.id, `${l.titulo} — ${l.autor || 'Sin autor'}`])]}
            />
            <Input
              required
              type="date"
              value={formData.fecha_devolucion_esperada}
              onChange={(e) => setFormData({ ...formData, fecha_devolucion_esperada: e.target.value })}
            />
            <Input value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} placeholder="Notas (opcional)" />
          </div>
          <SubmitButton>{editId ? 'Guardar cambios' : 'Registrar préstamo'}</SubmitButton>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
            <tr>
              {['Fecha', 'Usuario', 'Libro', 'Vence', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prestamos.map((p) => {
              const vencido = p.estado === 'activo' && p.fecha_devolucion_esperada < today;
              const statusClass = p.estado === 'activo'
                ? 'bg-green-100 text-green-700'
                : p.estado === 'vencido'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700';
              return (
                <tr key={p.id} className={vencido ? 'bg-red-50' : 'odd:bg-white even:bg-blue-50/30'}>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.fecha_prestamo).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{p.usuario_nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{p.libro_titulo}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.fecha_devolucion_esperada).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{p.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      onEdit={() => edit(p)}
                      onDelete={() => remove(p.id)}
                      extraAction={
                        p.estado !== 'devuelto' ? (
                          <button
                            onClick={() => markReturned(p)}
                            className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold"
                          >
                            Registrar devolución
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModuloUsuarios({ usuarios, onReload, toastSuccess, toastError, confirmAction }) {
  const empty = { nombre: '', tipo: 'docente', identificacion: '', grado: '', seccion: '', telefono: '', email: '' };
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(empty);
  const { formRef, scrollToForm } = useEditFormScroll();

  const save = async (e) => {
    e.preventDefault();
    const { error } = editId
      ? await supabase.from('usuarios').update(formData).eq('id', editId)
      : await supabase.from('usuarios').insert([formData]);

    if (error) return toastError(error.message);
    toastSuccess(editId ? 'Usuario actualizado.' : 'Usuario creado.');
    setEditId(null);
    setFormData(empty);
    setShowForm(false);
    onReload();
  };

  const edit = (u) => {
    setEditId(u.id);
    setFormData({
      nombre: u.nombre || '', tipo: u.tipo || 'docente', identificacion: u.identificacion || '', grado: u.grado || '', seccion: u.seccion || '', telefono: u.telefono || '', email: u.email || '',
    });
    setShowForm(true);
    setTimeout(scrollToForm, 20);
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Eliminar usuario', text: 'Se eliminará el usuario y sus registros relacionados.', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return toastError(error.message);
    toastSuccess('Usuario eliminado.');
    onReload();
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) return toastError('CSV vacío o mal formateado.');
    const { error } = await supabase.from('usuarios').insert(rows);
    if (error) return toastError(error.message);
    toastSuccess(`${rows.length} usuarios importados.`);
    setShowImport(false);
    onReload();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><Users className="w-8 h-8 text-blue-600" />Gestión de Usuarios</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadExcelTemplate('usuarios')} className="flex items-center gap-2 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"><Download className="w-4 h-4" />Plantilla</button>
          <button onClick={() => setShowImport(!showImport)} className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg"><Upload className="w-4 h-4" />Importar CSV</button>
          <button onClick={() => exportToCSV(usuarios, `usuarios-${new Date().toISOString().split('T')[0]}`)} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg"><Download className="w-4 h-4" />Exportar</button>
          <button onClick={() => { setShowForm(!showForm); if (!showForm) setTimeout(scrollToForm, 20); }} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2 px-4 rounded-lg">{showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? 'Cancelar' : 'Registrar'}</button>
        </div>
      </div>

      {showImport && <div className="bg-white rounded-xl shadow p-4"><input type="file" accept=".csv" onChange={importCsv} className="block w-full text-sm" /></div>}

      {showForm && (
        <form ref={formRef} onSubmit={save} className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-l-8 border-blue-500">
          <FormGrid>
            <Input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre" />
            <Select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} options={[['docente', 'Docente'], ['padre', 'Padre'], ['estudiante', 'Estudiante']]} />
            <Input value={formData.identificacion} onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })} placeholder="Identificación" />
            <Input value={formData.grado} onChange={(e) => setFormData({ ...formData, grado: e.target.value })} placeholder="Grado" />
            <Input value={formData.seccion} onChange={(e) => setFormData({ ...formData, seccion: e.target.value })} placeholder="Sección" />
            <Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Teléfono" />
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" className="md:col-span-2" />
          </FormGrid>
          <SubmitButton>{editId ? 'Guardar cambios' : 'Guardar usuario'}</SubmitButton>
        </form>
      )}

      <SimpleTable
        headers={['Nombre', 'Tipo', 'Identificación', 'Grado', 'Contacto', 'Acciones']}
        rows={usuarios.map((u) => [u.nombre, u.tipo, u.identificacion || '-', [u.grado, u.seccion].filter(Boolean).join('-') || '-', u.telefono || u.email || '-', <ActionButtons key={u.id} onEdit={() => edit(u)} onDelete={() => remove(u.id)} />])}
      />
    </section>
  );
}

function ModuloImpresion({ usuarios, servicios, onReload, toastSuccess, toastError, confirmAction }) {
  const empty = { usuario_id: '', cantidad_copias: '', tipo_impresion: 'blanco_negro', costo: '', detalles: '' };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(empty);
  const { formRef, scrollToForm } = useEditFormScroll();

  const save = async (e) => {
    e.preventDefault();
    const usuario = usuarios.find((u) => u.id === formData.usuario_id);
    if (!usuario) return toastError('Debes seleccionar un usuario válido.');
    const payload = {
      usuario_id: formData.usuario_id,
      usuario_nombre: usuario.nombre,
      cantidad_copias: parseInt(formData.cantidad_copias, 10),
      tipo_impresion: formData.tipo_impresion,
      costo: formData.costo || null,
      detalles: formData.detalles || null,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
    };

    const { error } = editId ? await supabase.from('servicios_impresion').update(payload).eq('id', editId) : await supabase.from('servicios_impresion').insert([payload]);
    if (error) return toastError(error.message);
    toastSuccess(editId ? 'Registro de impresión actualizado.' : 'Registro de impresión creado.');
    setEditId(null);
    setFormData(empty);
    setShowForm(false);
    onReload();
  };

  const edit = (row) => {
    setEditId(row.id);
    setFormData({ usuario_id: row.usuario_id || '', cantidad_copias: String(row.cantidad_copias || ''), tipo_impresion: row.tipo_impresion || 'blanco_negro', costo: row.costo || '', detalles: row.detalles || '' });
    setShowForm(true);
    setTimeout(scrollToForm, 20);
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Eliminar impresión', text: 'Se eliminará el registro de impresión seleccionado.', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    const { error } = await supabase.from('servicios_impresion').delete().eq('id', id);
    if (error) return toastError(error.message);
    toastSuccess('Registro eliminado.');
    onReload();
  };

  return (
    <section className="space-y-6">
      <ModuleHeader title="Servicio de Impresión" icon={Printer} color="purple" showForm={showForm} setShowForm={setShowForm} onOpen={scrollToForm} />
      {showForm && (
        <form ref={formRef} onSubmit={save} className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-l-8 border-purple-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={formData.usuario_id} onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })} required options={[['', 'Seleccionar usuario...'], ...usuarios.map((u) => [u.id, `${u.nombre} (${u.tipo})`])]} />
            <Input required min="1" type="number" value={formData.cantidad_copias} onChange={(e) => setFormData({ ...formData, cantidad_copias: e.target.value })} placeholder="Cantidad" />
            <Select value={formData.tipo_impresion} onChange={(e) => setFormData({ ...formData, tipo_impresion: e.target.value })} options={[['blanco_negro', 'Blanco y negro'], ['color', 'Color']]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: e.target.value })} placeholder="Costo" />
            <Input value={formData.detalles} onChange={(e) => setFormData({ ...formData, detalles: e.target.value })} placeholder="Detalles" />
          </div>
          <SubmitButton>{editId ? 'Guardar cambios' : 'Guardar registro'}</SubmitButton>
        </form>
      )}
      <SimpleTable headers={['Fecha', 'Usuario', 'Copias', 'Tipo', 'Costo', 'Acciones']} rows={servicios.map((s) => [new Date(s.fecha).toLocaleDateString('es'), s.usuario_nombre, s.cantidad_copias, s.tipo_impresion, s.costo || '-', <ActionButtons key={s.id} onEdit={() => edit(s)} onDelete={() => remove(s.id)} />])} />
    </section>
  );
}

function ModuloVideo({ usuarios, servicios, onReload, toastSuccess, toastError, confirmAction }) {
  const empty = { usuario_id: '', proposito: '', duracion_minutos: '', hora_inicio: '', detalles: '' };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(empty);
  const { formRef, scrollToForm } = useEditFormScroll();

  const save = async (e) => {
    e.preventDefault();
    const usuario = usuarios.find((u) => u.id === formData.usuario_id);
    if (!usuario) return toastError('Debes seleccionar un usuario válido.');

    const payload = {
      usuario_id: formData.usuario_id,
      usuario_nombre: usuario.nombre,
      proposito: formData.proposito,
      duracion_minutos: formData.duracion_minutos ? parseInt(formData.duracion_minutos, 10) : null,
      hora_inicio: formData.hora_inicio,
      detalles: formData.detalles || null,
      fecha: new Date().toISOString().split('T')[0],
    };

    const { error } = editId ? await supabase.from('servicios_video').update(payload).eq('id', editId) : await supabase.from('servicios_video').insert([payload]);
    if (error) return toastError(error.message);
    toastSuccess(editId ? 'Uso de sala actualizado.' : 'Uso de sala registrado.');
    setEditId(null);
    setFormData(empty);
    setShowForm(false);
    onReload();
  };

  const edit = (row) => {
    setEditId(row.id);
    setFormData({ usuario_id: row.usuario_id || '', proposito: row.proposito || '', duracion_minutos: row.duracion_minutos || '', hora_inicio: row.hora_inicio || '', detalles: row.detalles || '' });
    setShowForm(true);
    setTimeout(scrollToForm, 20);
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Eliminar uso de sala', text: 'Se eliminará el registro seleccionado.', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    const { error } = await supabase.from('servicios_video').delete().eq('id', id);
    if (error) return toastError(error.message);
    toastSuccess('Registro eliminado.');
    onReload();
  };

  return (
    <section className="space-y-6">
      <ModuleHeader title="Sala de Video" icon={Video} color="orange" showForm={showForm} setShowForm={setShowForm} onOpen={scrollToForm} />
      {showForm && (
        <form ref={formRef} onSubmit={save} className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-l-8 border-orange-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={formData.usuario_id} onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })} required options={[['', 'Seleccionar usuario...'], ...usuarios.map((u) => [u.id, `${u.nombre} (${u.tipo})`])]} />
            <Input required value={formData.proposito} onChange={(e) => setFormData({ ...formData, proposito: e.target.value })} placeholder="Propósito" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input required type="time" value={formData.hora_inicio} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} />
            <Input min="1" type="number" value={formData.duracion_minutos} onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })} placeholder="Duración (min)" />
            <Input value={formData.detalles} onChange={(e) => setFormData({ ...formData, detalles: e.target.value })} placeholder="Detalles" />
          </div>
          <SubmitButton>{editId ? 'Guardar cambios' : 'Guardar registro'}</SubmitButton>
        </form>
      )}
      <SimpleTable headers={['Fecha', 'Usuario', 'Propósito', 'Hora', 'Duración', 'Acciones']} rows={servicios.map((s) => [new Date(s.fecha).toLocaleDateString('es'), s.usuario_nombre, s.proposito, s.hora_inicio, s.duracion_minutos ? `${s.duracion_minutos} min` : '-', <ActionButtons key={s.id} onEdit={() => edit(s)} onDelete={() => remove(s.id)} />])} />
    </section>
  );
}

function ModuloLectura({ actividades, onReload, toastSuccess, toastError, confirmAction }) {
  const empty = { nombre_actividad: '', tipo: 'taller', descripcion: '', fecha: new Date().toISOString().split('T')[0], participantes: '', responsable: '' };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(empty);
  const { formRef, scrollToForm } = useEditFormScroll();

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...formData, descripcion: formData.descripcion || null, participantes: formData.participantes ? parseInt(formData.participantes, 10) : null, responsable: formData.responsable || null };
    const { error } = editId ? await supabase.from('actividades_lectura').update(payload).eq('id', editId) : await supabase.from('actividades_lectura').insert([payload]);
    if (error) return toastError(error.message);
    toastSuccess(editId ? 'Actividad actualizada.' : 'Actividad registrada.');
    setEditId(null);
    setFormData(empty);
    setShowForm(false);
    onReload();
  };

  const edit = (row) => {
    setEditId(row.id);
    setFormData({ nombre_actividad: row.nombre_actividad || '', tipo: row.tipo || 'taller', descripcion: row.descripcion || '', fecha: row.fecha || new Date().toISOString().split('T')[0], participantes: row.participantes || '', responsable: row.responsable || '' });
    setShowForm(true);
    setTimeout(scrollToForm, 20);
  };

  const remove = async (id) => {
    const ok = await confirmAction({ title: 'Eliminar actividad', text: 'Se eliminará la actividad seleccionada.', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    const { error } = await supabase.from('actividades_lectura').delete().eq('id', id);
    if (error) return toastError(error.message);
    toastSuccess('Actividad eliminada.');
    onReload();
  };

  return (
    <section className="space-y-6">
      <ModuleHeader title="Promoción de Lectura" icon={Sparkles} color="green" showForm={showForm} setShowForm={setShowForm} onOpen={scrollToForm} />
      {showForm && (
        <form ref={formRef} onSubmit={save} className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-l-8 border-green-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input required value={formData.nombre_actividad} onChange={(e) => setFormData({ ...formData, nombre_actividad: e.target.value })} placeholder="Nombre actividad" />
            <Select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} options={[['taller', 'Taller'], ['club', 'Club'], ['evento', 'Evento'], ['presentacion', 'Presentación']]} />
          </div>
          <Input as="textarea" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripción" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input required type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
            <Input min="1" type="number" value={formData.participantes} onChange={(e) => setFormData({ ...formData, participantes: e.target.value })} placeholder="Participantes" />
            <Input value={formData.responsable} onChange={(e) => setFormData({ ...formData, responsable: e.target.value })} placeholder="Responsable" />
          </div>
          <SubmitButton>{editId ? 'Guardar cambios' : 'Guardar actividad'}</SubmitButton>
        </form>
      )}
      <SimpleTable headers={['Actividad', 'Tipo', 'Fecha', 'Participantes', 'Acciones']} rows={actividades.map((a) => [a.nombre_actividad, a.tipo, new Date(a.fecha).toLocaleDateString('es'), a.participantes || '-', <ActionButtons key={a.id} onEdit={() => edit(a)} onDelete={() => remove(a.id)} />])} />
    </section>
  );
}

function ConfirmModal({ state, onResolve }) {
  if (!state) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-t-8 border-amber-500 p-6">
        <h3 className="text-xl font-bold text-amber-900">{state.title}</h3>
        <p className="text-gray-700 mt-2">{state.text}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => onResolve(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">
            {state.cancelText}
          </button>
          <button onClick={() => onResolve(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold">
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastViewport({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[110] space-y-2 w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl shadow-xl border px-4 py-3 text-sm font-medium ${t.type === 'success' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-orange-50 border-orange-300 text-orange-900'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-amber-700 to-red-700 text-white">
          <tr>{headers.map((h) => <th key={h} className="px-4 py-3 text-left font-bold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
              {row.map((cell, i) => <td key={i} className="px-4 py-3 text-gray-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormGrid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

function Input({ as = 'input', className = '', ...props }) {
  const styles = `px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all ${className}`;
  if (as === 'textarea') return <textarea {...props} rows={3} className={styles} />;
  return <input {...props} className={styles} />;
}

function Select({ options, className = '', ...props }) {
  return (
    <select {...props} className={`px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition-all ${className}`}>
      {options.map(([value, label]) => <option key={String(value)} value={value}>{label}</option>)}
    </select>
  );
}

function SubmitButton({ children }) {
  return <button className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold py-3 rounded-xl">{children}</button>;
}
// ... (continuación del código después de la función SubmitButton)

// --- COMPONENTES DE INTERFAZ RESTANTES ---

/**
 * Vista de los Toasts (Notificaciones)
 * Asegura que las alertas se muestren correctamente en la pantalla
 */
function ToastViewport({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[110] space-y-2 w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl shadow-xl border px-4 py-3 text-sm font-medium animate-in slide-in-from-right ${
            t.type === 'success' 
              ? 'bg-amber-50 border-amber-300 text-amber-900' 
              : 'bg-orange-50 border-orange-300 text-orange-900'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/**
 * Estructura de tabla simple reutilizable
 */
function SimpleTable({ headers, rows }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-x-auto border border-amber-100">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-amber-700 to-red-700 text-white">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-bold text-sm uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-50">
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                {row.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-gray-700 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-gray-500 italic">
                No hay registros para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}