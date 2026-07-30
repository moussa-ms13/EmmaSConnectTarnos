import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Users,
  ChevronDown,
  Loader2,
  AlertTriangle,
  User,
  X,
  CheckCircle2,
  Key,
} from 'lucide-react';
import { signIn, submitPasswordResetRequest } from '../../services/authService';
import { useAuth } from '../../components/auth/AuthProvider';

/**
 * Login — Full-screen 100% pixel-perfect 50/50 split login page for Emmaüs Connect.
 * Left pane: Full-height static sidebar image (/login-sidebar.jpg).
 * Right pane: White background with authentication form and role selection.
 * Layout: Centered framed card with rounded-3xl and shadow-2xl.
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Password reset ticket modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError("Veuillez saisir votre adresse e-mail.");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    const { error: reqErr } = await submitPasswordResetRequest(resetEmail);
    if (reqErr) {
      setResetError("Erreur lors de l'envoi de la demande : " + reqErr.message);
    } else {
      setResetSuccess(true);
    }
    setResetLoading(false);
  };

  // Auto redirect if user is already authenticated
  React.useEffect(() => {
    if (user) {
      let targetPath = location.state?.from?.pathname;
      if (!targetPath || targetPath === '/login') {
        targetPath = '/tableau-de-bord';
      }
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.'
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Auth success → redirect cleanly to target or dashboard without manual reload
    let targetPath = location.state?.from?.pathname;
    if (!targetPath || targetPath === '/login') {
      targetPath = '/tableau-de-bord';
    }
    navigate(targetPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2 min-h-[800px]">
        {/* ═══════════════════════════════════════════════════════
            LEFT PANE — Static Sidebar Image
            ═══════════════════════════════════════════════════════ */}
        <div className="hidden lg:block w-full h-full overflow-hidden bg-[#0a1628]">
          <img
            src="/login-sidebar.jpg"
            alt="Emmaüs Connect"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT PANE — White Login Form
            ═══════════════════════════════════════════════════════ */}
        <div className="w-full bg-white flex flex-col justify-between p-8 lg:p-12">
          {/* Top right language selector */}
          <div className="flex justify-end">
            <button
              type="button"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="text-base">🇫🇷</span>
              <span>Français</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Centered Login Form Area */}
          <div className="w-full max-w-md mx-auto my-auto py-6">
            {/* Header text */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Bienvenue !
              </h2>
              <p className="text-gray-500 text-sm">
                Connectez-vous à votre espace Emmaüs Connect
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-5">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@emmaus.fr"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password link */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-remember"
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 font-medium">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSuccess(false);
                    setResetError(null);
                    setIsResetModalOpen(true);
                  }}
                  className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Solid blue submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-700/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Lock className="w-4.5 h-4.5" />
                )}
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            {/* OU Divider */}
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                OU
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <p className="text-center text-sm text-gray-500 mb-4">
              Choisissez votre espace après connexion
            </p>

            {/* Two Outlined Role Selection Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Espace Responsable */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedRole === 'admin'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 leading-tight">Espace</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Responsable</p>
                </div>
              </button>

              {/* Espace Compagnon */}
              <button
                type="button"
                onClick={() => setSelectedRole('user')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedRole === 'user'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 leading-tight">Espace</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Compagnon</p>
                </div>
              </button>
            </div>
          </div>

          {/* Security shield footer */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Shield className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 font-medium">
              Vos données sont sécurisées et confidentielles.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PASSWORD RESET REQUEST MODAL (Ticketing Workflow)
          ═══════════════════════════════════════════════════════ */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Réinitialisation de mot de passe
                </h3>
                <p className="text-xs text-gray-500">
                  Demande administrative auprès de votre communauté
                </p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Votre demande a été transmise aux administrateurs !
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Un administrateur d'Emmaüs Connect vérifiera votre compte et vous communiquera un mot de passe temporaire pour vous reconnecter.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Saisissez l'adresse e-mail associée à votre compte. Un administrateur générera un mot de passe temporaire dans la rubrique de gestion des utilisateurs.
                </p>

                {resetError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="nom.prenom@emmaus-connect.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      'Envoyer la demande'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

