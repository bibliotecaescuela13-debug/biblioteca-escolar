import React, { useState, useEffect } from 'react';
import { BookOpen, Printer, Video, Sparkles, Users, BarChart3, Upload, Download, Calendar, TrendingUp, FileText, Search, Plus, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { exportToCSV, parseCSV, downloadExcelTemplate } from './lib/exportUtils';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [usuarios, setUsuarios] = useState([]);
  const [serviciosImpresion, setServiciosImpresion] = useState([]);
  const [serviciosVideo, setServiciosVideo] = useState([]);
  const [actividadesLectura, setActividadesLectura] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [usersRes, printRes, videoRes, readingRes] = await Promise.all([
        supabase.from('usuarios').select('*').order('nombre'),
        supabase.from('servicios_impresion').select('*').order('created_at', { ascending: false }),
        supabase.from('servicios_video').select('*').order('created_at', { ascending: false }),
        supabase.from('actividades_lectura').select('*').order('fecha', { ascending: false })
      ]);

      if (usersRes.data) setUsuarios(usersRes.data);
      if (printRes.data) setServiciosImpresion(printRes.data);
      if (videoRes.data) setServiciosVideo(videoRes.data);
      if (readingRes.data) setActividadesLectura(readingRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-amber-900 font-semibold">Cargando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 via-orange-800 to-red-800 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2.5 rounded-xl rotate-3 shadow-lg">
                <BookOpen className="w-7 h-7 text-amber-900" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Biblioteca Escolar
                </h1>
                <p className="text-amber-200 text-xs sm:text-sm">Gestión de servicios</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b-4 border-amber-400 sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Panel', icon: BarChart3 },
              { id: 'impresion', label: 'Impresión', icon: Printer },
              { id: 'video', label: 'Sala Video', icon: Video },
              { id: 'lectura', label: 'Lectura', icon: Sparkles },
              { id: 'usuarios', label: 'Usuarios', icon: Users },
            ].map(({ id, label, icon: Icon }) => (
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
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeModule === 'dashboard' && (
          <Dashboard 
            usuarios={usuarios}
            serviciosImpresion={serviciosImpresion}
            serviciosVideo={serviciosVideo}
            actividadesLectura={actividadesLectura}
          />
        )}
        {activeModule === 'impresion' && (
          <ModuloImpresion 
            usuarios={usuarios}
            servicios={serviciosImpresion}
            onReload={loadAllData}
          />
        )}
        {activeModule === 'video' && (
          <ModuloVideo 
            usuarios={usuarios}
            servicios={serviciosVideo}
            onReload={loadAllData}
          />
        )}
        {activeModule === 'lectura' && (
          <ModuloLectura 
            usuarios={usuarios}
            actividades={actividadesLectura}
            onReload={loadAllData}
          />
        )}
        {activeModule === 'usuarios' && (
          <ModuloUsuarios 
            usuarios={usuarios}
            onReload={loadAllData}
          />
        )}
      </main>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ usuarios, serviciosImpresion, serviciosVideo, actividadesLectura }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const thisWeekPrint = serviciosImpresion.filter(s => new Date(s.fecha) >= startOfWeek);
  const thisWeekVideo = serviciosVideo.filter(s => new Date(s.fecha) >= startOfWeek);
  const todayPrint = serviciosImpresion.filter(s => new Date(s.fecha).toDateString() === today.toDateString());
  const todayVideo = serviciosVideo.filter(s => new Date(s.fecha).toDateString() === today.toDateString());

  const stats = {
    totalUsuarios: usuarios.length,
    impresionHoy: todayPrint.length,
    impresionSemana: thisWeekPrint.length,
    videoHoy: todayVideo.length,
    videoSemana: thisWeekVideo.length,
    totalImpresiones: serviciosImpresion.reduce((sum, s) => sum + s.cantidad_copias, 0),
  };

  const handleExportAll = () => {
    const allData = serviciosImpresion.map(s => ({
      Fecha: s.fecha,
      Hora: s.hora,
      Usuario: s.usuario_nombre,
      Servicio: 'Impresión',
      Detalles: `${s.cantidad_copias} copias ${s.tipo_impresion}`,
      Costo: s.costo || '-'
    })).concat(serviciosVideo.map(s => ({
      Fecha: s.fecha,
      Hora: s.hora_inicio,
      Usuario: s.usuario_nombre,
      Servicio: 'Sala de Video',
      Detalles: s.proposito,
      Costo: '-'
    })));

    exportToCSV(allData, `biblioteca-servicios-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Usuarios" value={stats.totalUsuarios} color="from-blue-500 to-blue-700" />
        <StatCard icon={Printer} label="Impresiones Hoy" value={stats.impresionHoy} color="from-purple-500 to-purple-700" />
        <StatCard icon={Video} label="Video Hoy" value={stats.videoHoy} color="from-orange-500 to-orange-700" />
        <StatCard icon={TrendingUp} label="Total Copias" value={stats.totalImpresiones} color="from-green-500 to-green-700" />
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-amber-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-600" />
            Esta Semana
          </h2>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-semibold"
          >
            <Download className="w-4 h-4" />
            Exportar Todo
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
            <p className="text-purple-700 font-semibold mb-1">Impresiones esta semana</p>
            <p className="text-3xl font-bold text-purple-900">{stats.impresionSemana}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border-l-4 border-orange-500">
            <p className="text-orange-700 font-semibold mb-1">Usos de Sala Video</p>
            <p className="text-3xl font-bold text-orange-900">{stats.videoSemana}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-orange-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-600" />
          Actividad Reciente
        </h2>
        <div className="space-y-2">
          {serviciosImpresion.slice(0, 5).map((s, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-800">{s.usuario_nombre}</p>
                  <p className="text-sm text-gray-600">{s.cantidad_copias} copias - {s.tipo_impresion}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{new Date(s.fecha).toLocaleDateString('es')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-all`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">{label}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ==================== MÓDULO IMPRESIÓN ====================
function ModuloImpresion({ usuarios, servicios, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id: '',
    cantidad_copias: '',
    tipo_impresion: 'blanco_negro',
    costo: '',
    detalles: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usuario = usuarios.find(u => u.id === formData.usuario_id);
    if (!usuario) return;

    const { error } = await supabase.from('servicios_impresion').insert([{
      usuario_id: formData.usuario_id,
      usuario_nombre: usuario.nombre,
      cantidad_copias: parseInt(formData.cantidad_copias),
      tipo_impresion: formData.tipo_impresion,
      costo: formData.costo || null,
      detalles: formData.detalles || null,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0]
    }]);

    if (!error) {
      setFormData({ usuario_id: '', cantidad_copias: '', tipo_impresion: 'blanco_negro', costo: '', detalles: '' });
      setShowForm(false);
      onReload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Printer className="w-8 h-8 text-purple-600" />
          Servicio de Impresión
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all shadow-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Registrar'}
        </button>
      </div>

      {/* Quick Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-purple-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Registro Rápido</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={formData.usuario_id}
                onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>
                ))}
              </select>
              <input
                type="number"
                value={formData.cantidad_copias}
                onChange={(e) => setFormData({ ...formData, cantidad_copias: e.target.value })}
                placeholder="Cantidad de copias"
                min="1"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
              <select
                value={formData.tipo_impresion}
                onChange={(e) => setFormData({ ...formData, tipo_impresion: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="blanco_negro">Blanco y Negro</option>
                <option value="color">Color</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                placeholder="Costo (opcional)"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <input
                type="text"
                value={formData.detalles}
                onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                placeholder="Detalles (opcional)"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
            >
              Guardar Registro
            </button>
          </form>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Fecha</th>
                <th className="px-4 py-3 text-left font-bold">Usuario</th>
                <th className="px-4 py-3 text-left font-bold">Copias</th>
                <th className="px-4 py-3 text-left font-bold">Tipo</th>
                <th className="px-4 py-3 text-left font-bold">Costo</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                  <td className="px-4 py-3 text-gray-700">{new Date(s.fecha).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{s.usuario_nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{s.cantidad_copias}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.tipo_impresion === 'color' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {s.tipo_impresion === 'color' ? 'Color' : 'B/N'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.costo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== MÓDULO VIDEO ====================
function ModuloVideo({ usuarios, servicios, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id: '',
    proposito: '',
    duracion_minutos: '',
    hora_inicio: '',
    detalles: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usuario = usuarios.find(u => u.id === formData.usuario_id);
    if (!usuario) return;

    const { error } = await supabase.from('servicios_video').insert([{
      usuario_id: formData.usuario_id,
      usuario_nombre: usuario.nombre,
      proposito: formData.proposito,
      duracion_minutos: formData.duracion_minutos ? parseInt(formData.duracion_minutos) : null,
      hora_inicio: formData.hora_inicio,
      detalles: formData.detalles || null,
      fecha: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      setFormData({ usuario_id: '', proposito: '', duracion_minutos: '', hora_inicio: '', detalles: '' });
      setShowForm(false);
      onReload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Video className="w-8 h-8 text-orange-600" />
          Sala de Video
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-700 hover:to-orange-800 transform hover:scale-105 transition-all shadow-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Registrar Uso'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-orange-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Registro de Uso</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.usuario_id}
                onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                required
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>
                ))}
              </select>
              <input
                type="text"
                value={formData.proposito}
                onChange={(e) => setFormData({ ...formData, proposito: e.target.value })}
                placeholder="Propósito (ej: Clase de biología)"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                required
              />
              <input
                type="number"
                value={formData.duracion_minutos}
                onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                placeholder="Duración (minutos)"
                min="1"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg"
            >
              Guardar Registro
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Fecha</th>
                <th className="px-4 py-3 text-left font-bold">Usuario</th>
                <th className="px-4 py-3 text-left font-bold">Propósito</th>
                <th className="px-4 py-3 text-left font-bold">Hora</th>
                <th className="px-4 py-3 text-left font-bold">Duración</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-orange-50'}>
                  <td className="px-4 py-3 text-gray-700">{new Date(s.fecha).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{s.usuario_nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{s.proposito}</td>
                  <td className="px-4 py-3 text-gray-700">{s.hora_inicio}</td>
                  <td className="px-4 py-3 text-gray-700">{s.duracion_minutos ? `${s.duracion_minutos} min` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== MÓDULO LECTURA ====================
function ModuloLectura({ usuarios, actividades, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    tipo: 'taller',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    participantes: '',
    responsable: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('actividades_lectura').insert([{
      nombre_actividad: formData.nombre_actividad,
      tipo: formData.tipo,
      descripcion: formData.descripcion || null,
      fecha: formData.fecha,
      participantes: formData.participantes ? parseInt(formData.participantes) : null,
      responsable: formData.responsable || null
    }]);

    if (!error) {
      setFormData({
        nombre_actividad: '',
        tipo: 'taller',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        participantes: '',
        responsable: ''
      });
      setShowForm(false);
      onReload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-green-600" />
          Promoción de Lectura
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all shadow-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Nueva Actividad'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-green-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Registrar Actividad</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.nombre_actividad}
                onChange={(e) => setFormData({ ...formData, nombre_actividad: e.target.value })}
                placeholder="Nombre de la actividad"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
              />
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              >
                <option value="taller">Taller</option>
                <option value="club">Club de Lectura</option>
                <option value="evento">Evento</option>
                <option value="presentacion">Presentación</option>
              </select>
            </div>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la actividad"
              rows="3"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
              />
              <input
                type="number"
                value={formData.participantes}
                onChange={(e) => setFormData({ ...formData, participantes: e.target.value })}
                placeholder="N° Participantes"
                min="1"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Responsable"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              Guardar Actividad
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actividades.map(a => (
          <div key={a.id} className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-gray-800">{a.nombre_actividad}</h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                {a.tipo}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{a.descripcion}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{new Date(a.fecha).toLocaleDateString('es')}</span>
              {a.participantes && <span>{a.participantes} participantes</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== MÓDULO USUARIOS ====================
function ModuloUsuarios({ usuarios, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'docente',
    identificacion: '',
    grado: '',
    seccion: '',
    telefono: '',
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('usuarios').insert([formData]);

    if (!error) {
      setFormData({ nombre: '', tipo: 'docente', identificacion: '', grado: '', seccion: '', telefono: '', email: '' });
      setShowForm(false);
      onReload();
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const data = parseCSV(text);
    
    if (data.length === 0) {
      alert('El archivo CSV está vacío o mal formateado');
      return;
    }

    const { error } = await supabase.from('usuarios').insert(data);

    if (!error) {
      alert(`${data.length} usuarios importados exitosamente`);
      onReload();
      setShowImport(false);
    } else {
      alert('Error al importar: ' + error.message);
    }
  };

  const handleExport = () => {
    exportToCSV(usuarios, `usuarios-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          Gestión de Usuarios
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => downloadExcelTemplate('usuarios')}
            className="flex items-center gap-2 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Plantilla
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-all"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Agregar
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
          <h3 className="font-bold text-lg text-gray-800 mb-3">Importar Usuarios desde CSV</h3>
          <p className="text-sm text-gray-600 mb-4">
            El archivo debe tener las columnas: nombre, tipo, identificacion, grado, seccion, telefono, email
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="w-full"
          />
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-blue-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="docente">Docente</option>
                <option value="padre">Padre/Madre</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={formData.identificacion}
                onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                placeholder="Identificación"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <input
                type="text"
                value={formData.grado}
                onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                placeholder="Grado (si aplica)"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <input
                type="text"
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                placeholder="Sección (si aplica)"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Teléfono"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              Guardar Usuario
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Nombre</th>
                <th className="px-4 py-3 text-left font-bold">Tipo</th>
                <th className="px-4 py-3 text-left font-bold">ID</th>
                <th className="px-4 py-3 text-left font-bold">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, idx) => (
                <tr key={u.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                  <td className="px-4 py-3 font-semibold text-gray-800">{u.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.tipo === 'docente' ? 'bg-purple-100 text-purple-700' :
                      u.tipo === 'padre' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {u.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.identificacion || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{u.email || u.telefono || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
