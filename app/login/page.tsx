'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login, sendPasswordRecovery } from './actions'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryMsg, setRecoveryMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isRecoveryPending, startRecoveryTransition] = useTransition()

  // ── Login ────────────────────────────────────────────────────────────────
  function handleLogin(formData: FormData) {
    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setErrorMsg(result.error)
        setTimeout(() => setErrorMsg(null), 3000)
      } else {
        setSuccessMsg('Iniciando sesión...')
      }
    })
  }

  // ── Recovery ─────────────────────────────────────────────────────────────
  function handleRecovery(formData: FormData) {
    setRecoveryMsg(null)
    startRecoveryTransition(async () => {
      const result = await sendPasswordRecovery(formData)
      if (result?.error) {
        setRecoveryMsg({ type: 'error', text: result.error })
      } else if (result?.success) {
        setRecoveryMsg({ type: 'success', text: result.success })
        setTimeout(() => {
          setShowRecovery(false)
          setRecoveryMsg(null)
        }, 3000)
      }
    })
  }

  return (
    <>

      {/* ── Fondo animado ── */}
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a257c 0%, #1e3a8a 50%, #0a257c 100%)',
        }}
      >
        {/* Orbes de fondo */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full -top-[100px] -right-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(253,136,57,0.15) 0%, transparent 70%)',
            animation: 'pulse-orb 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full -bottom-[100px] -left-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(253,136,57,0.10) 0%, transparent 70%)',
            animation: 'pulse-orb 10s ease-in-out 2s infinite',
          }}
        />

        {/* ── Tarjeta de login ── */}
        <div
          className="relative bg-white w-full mx-4 rounded-3xl z-10"
          style={{
            maxWidth: 450,
            padding: '50px 40px',
            boxShadow: '0 30px 90px rgba(0,0,0,0.4)',
            animation: 'slideIn 0.6s ease-out',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-10" style={{ animation: 'fadeIn 0.8s ease-out 0.2s both' }}>
            <Image
              src="/images/mav_logo.png"
              alt="Logo MAV"
              width={180}
              height={80}
              className="mx-auto mb-5 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              priority
            />
            <h1
              className="text-4xl md:text-5xl font-black mb-3 tracking-tighter leading-none"
              style={{
                color: '#0a257c',
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(to bottom, #0a257c, #1e3b8e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                paddingBottom: '4px'
              }}
            >
              CENTRAL MAV
            </h1>
            <p className="text-[14px]" style={{ color: '#64748b' }}>
              Seguimiento de Personal
            </p>
          </div>

          {/* Mensajes de estado */}
          {errorMsg && (
            <div
              className="rounded-lg px-4 py-3 text-sm mb-5"
              style={{
                background: '#fef2f2',
                borderLeft: '4px solid #ef4444',
                color: '#b91c1c',
                animation: 'shake 0.5s ease',
              }}
            >
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div
              className="rounded-lg px-4 py-3 text-sm mb-5"
              style={{
                background: '#f0fdf4',
                borderLeft: '4px solid #22c55e',
                color: '#166534',
                animation: 'fadeIn 0.5s ease',
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Formulario */}
          <form action={handleLogin} style={{ animation: 'fadeIn 0.8s ease-out 0.4s both' }}>
            {/* Email */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block mb-2 text-[14px] font-semibold"
                style={{ color: '#0f172a' }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                autoComplete="username"
                className="w-full px-[18px] py-[14px] rounded-xl text-[15px] transition-all duration-300 outline-none"
                style={{
                  border: '2px solid #e2e8f0',
                  background: '#f8fafc',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#fd8839'
                  e.target.style.background = 'white'
                  e.target.style.boxShadow = '0 0 0 4px rgba(253,136,57,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.background = '#f8fafc'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Contraseña */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block mb-2 text-[14px] font-semibold"
                style={{ color: '#0f172a' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  required
                  autoComplete="current-password"
                  className="w-full px-[18px] py-[14px] pr-12 rounded-xl text-[15px] transition-all duration-300 outline-none"
                  style={{
                    border: '2px solid #e2e8f0',
                    background: '#f8fafc',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#fd8839'
                    e.target.style.background = 'white'
                    e.target.style.boxShadow = '0 0 0 4px rgba(253,136,57,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.background = '#f8fafc'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                  style={{ color: '#64748b' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#0a257c' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Opciones */}
            <div className="flex justify-between items-center mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: '#64748b' }}>
                <input
                  type="checkbox"
                  name="remember"
                  className="w-[18px] h-[18px] cursor-pointer"
                  style={{ accentColor: '#fd8839' }}
                />
                Recordarme
              </label>
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="font-semibold transition-colors duration-300"
                style={{ color: '#fd8839', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ea580c' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fd8839' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[16px] font-bold text-white transition-all duration-300 disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #fd8839 0%, #ea580c 100%)',
                boxShadow: '0 8px 24px rgba(253,136,57,0.3)',
                letterSpacing: '1px',
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isPending) {
                  ; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                    ; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(253,136,57,0.4)'
                }
              }}
              onMouseLeave={(e) => {
                ; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                  ; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(253,136,57,0.3)'
              }}
            >
              {isPending ? <Loader2 size={20} className="animate-spin" /> : null}
              {isPending ? 'INICIANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center mt-8 text-[13px]" style={{ color: '#94a3b8' }}>
            © 2026 MAV. Todos los derechos reservados.
          </p>
        </div>

        {/* ── Modal recuperar contraseña ── */}
        {showRecovery && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.7)', animation: 'fadeIn 0.3s ease' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowRecovery(false); setRecoveryMsg(null) } }}
          >
            <div
              className="bg-white rounded-2xl w-[90%] p-10"
              style={{ maxWidth: 450, boxShadow: '0 30px 90px rgba(0,0,0,0.5)', animation: 'slideIn 0.4s ease-out' }}
            >
              <h2
                className="text-2xl font-bold mb-3 tracking-tight"
                style={{ color: '#0a257c', fontFamily: 'var(--font-heading)' }}
              >
                Recuperar Contraseña
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: '#64748b' }}>
                Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
              </p>

              {recoveryMsg && (
                <div
                  className="rounded-lg px-4 py-3 text-sm mb-4"
                  style={{
                    background: recoveryMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderLeft: `4px solid ${recoveryMsg.type === 'error' ? '#ef4444' : '#22c55e'}`,
                    color: recoveryMsg.type === 'error' ? '#b91c1c' : '#166534',
                  }}
                >
                  {recoveryMsg.text}
                </div>
              )}

              <form action={handleRecovery}>
                <div className="mb-6">
                  <label
                    htmlFor="recovery-email"
                    className="block mb-2 text-[14px] font-semibold"
                    style={{ color: '#0f172a' }}
                  >
                    Correo Electrónico
                  </label>
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    placeholder="tu@correo.com"
                    required
                    className="w-full px-[18px] py-[14px] rounded-xl text-[15px] outline-none transition-all duration-300"
                    style={{ border: '2px solid #e2e8f0', background: '#f8fafc' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fd8839'
                      e.target.style.background = 'white'
                      e.target.style.boxShadow = '0 0 0 4px rgba(253,136,57,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.background = '#f8fafc'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowRecovery(false); setRecoveryMsg(null) }}
                    className="flex-1 py-[14px] rounded-xl text-[15px] font-semibold transition-all duration-300"
                    style={{ background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isRecoveryPending}
                    className="flex-1 flex items-center justify-center gap-2 py-[14px] rounded-xl text-[15px] font-semibold text-white transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #fd8839 0%, #ea580c 100%)',
                      boxShadow: '0 4px 12px rgba(253,136,57,0.3)',
                      border: 'none',
                      cursor: isRecoveryPending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isRecoveryPending ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isRecoveryPending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Animaciones CSS */}
        <style>{`
          @keyframes pulse-orb {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.2); opacity: 0.5; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
        `}</style>
      </div>
    </>
  )
}
