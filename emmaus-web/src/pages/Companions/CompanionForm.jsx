import React, { useState, useEffect } from 'react';
import {
  X, User, Mail, Phone, Save, Loader2, ShieldCheck, ChevronDown,
  MapPin, Calendar, Droplets, Stethoscope, AlertCircle, Activity,
  Briefcase, Camera, Upload, Lock,
} from 'lucide-react';
import { fetchRoles, uploadAvatar } from '../../services/companionService';

/**
 * Role label mapping — French display names for system roles.
 */
const ROLE_LABELS = {
  admin: 'Administrateur',
  user: 'Utilisateur',
  read: 'Lecteur',
};

/**
 * Gender options for the dropdown.
 */
const GENDER_OPTIONS = [
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' },
  { value: 'Autre', label: 'Autre' },
];

/**
 * Reusable input field with icon. Defined OUTSIDE functional components to prevent remounting on typing.
 * Supports date picker open on click.
 */
const InputField = ({ id, name, label, icon: Icon, type = 'text', required, placeholder, value, onChange, half, min, max }) => {
  const handleDateClick = (e) => {
    if (type === 'date' && 'showPicker' in e.target) {
      try {
        e.target.showPicker();
      } catch {
        // Ignore fallback if showPicker not available
      }
    }
  };

  return (
    <div className={half ? '' : 'col-span-2'}>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onClick={handleDateClick}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white cursor-pointer"
        />
      </div>
    </div>
  );
};

/**
 * CompanionForm — Modal form for creating or editing a companion.
 * Organized into sections: Personal Info, Contact, Medical.
 * @param {{ companion?: object, onSave: function, onClose: function }} props
 */
function CompanionForm({ companion, initialData, onSave, onSuccess, onClose }) {
  const targetData = companion || initialData || null;
  const isEditing = Boolean(targetData);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    role: 'Viewer',
    role_id: '',
    profession: '',
    avatar_url: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [medicalData, setMedicalData] = useState({
    blood_type: '',
    doctor_name: '',
    allergies: '',
    pathologies: '',
  });

  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);

  // Load available roles from the database
  useEffect(() => {
    async function loadRoles() {
      setLoadingRoles(true);
      const { data, error: rolesError } = await fetchRoles();
      if (rolesError) {
        console.error('Failed to load roles:', rolesError.message);
      } else {
        setRoles(data || []);
      }
      setLoadingRoles(false);
    }
    loadRoles();
  }, []);

  // Populate form when editing an existing companion
  useEffect(() => {
    if (targetData) {
      setFormData({
        first_name: targetData.first_name || '',
        last_name: targetData.last_name || '',
        gender: targetData.gender || '',
        date_of_birth: targetData.date_of_birth ? targetData.date_of_birth.split('T')[0] : '',
        email: targetData.email || '',
        password: '',
        phone: targetData.phone || '',
        address: targetData.address || '',
        postal_code: targetData.postal_code || '',
        city: targetData.city || '',
        role: targetData.role || targetData.roles?.name || 'Viewer',
        role_id: targetData.role_id || '',
        profession: targetData.profession || '',
        avatar_url: targetData.avatar_url || '',
      });
      setAvatarPreview(targetData.avatar_url || '');

      // Populate medical data if available
      const med = targetData.medical_record || targetData.medical || {};
      setMedicalData({
        blood_type: med.blood_type || '',
        doctor_name: med.doctor_name || '',
        allergies: med.allergies || '',
        pathologies: Array.isArray(med.pathologiesList)
          ? med.pathologiesList.join(', ')
          : med.pathologies || '',
      });
    }
  }, [targetData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicalChange = (e) => {
    const { name, value } = e.target;
    setMedicalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let uploadedUrl = formData.avatar_url;
      if (avatarFile) {
        const { url, error: uploadErr } = await uploadAvatar(avatarFile);
        if (uploadErr) {
          throw new Error('Erreur lors du téléversement de l\'avatar : ' + uploadErr.message);
        }
        uploadedUrl = url;
      }

      const payload = { ...formData, avatar_url: uploadedUrl };
      if (!payload.role_id) delete payload.role_id;
      if (!payload.password) delete payload.password;

      // Attach medical data as a nested object
      payload.medical = { ...medicalData };

      if (onSave) {
        await onSave(payload);
      } else if (onSuccess) {
        await onSuccess(payload);
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* ───── Header ───── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Modifier le compagnon' : 'Ajouter un compagnon'}
              </h3>
              <p className="text-xs text-gray-500">
                Renseignez les informations et identifiants de connexion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ───── Form Body ───── */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* ════════════ Section: Identité & Auth ════════════ */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Identité & Rôle (Authentification)
            </h4>

            {/* Avatar upload */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="relative group">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <label
                  htmlFor="cf-avatar"
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  <Upload className="w-5 h-5" />
                </label>
                <input
                  id="cf-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Photo de profil</p>
                <p className="text-xs text-gray-400">PNG, JPG ou WEBP (max 2 Mo)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <InputField id="cf-firstname" name="first_name" label="Prénom" icon={User} placeholder="Jean" value={formData.first_name} onChange={handleChange} required half />

              {/* Last Name */}
              <InputField id="cf-lastname" name="last_name" label="Nom" icon={User} placeholder="Dupont" value={formData.last_name} onChange={handleChange} required half />

              {/* Gender select */}
              <div className="col-span-1">
                <label htmlFor="cf-gender" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Genre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="cf-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  >
                    <option value="">Sélectionner</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date of birth */}
              <InputField id="cf-dob" name="date_of_birth" label="Date de naissance" icon={Calendar} type="date" placeholder="" value={formData.date_of_birth} onChange={handleChange} half />

              {/* Profession */}
              <InputField id="cf-profession" name="profession" label="Profession" icon={Briefcase} placeholder="Menuisier, Cuisinier, Chauffeur..." value={formData.profession} onChange={handleChange} half />

              {/* Email */}
              <InputField
                id="cf-email"
                name="email"
                label="E-mail (Identifiant de connexion)"
                icon={Mail}
                type="email"
                placeholder="jean.dupont@email.fr"
                value={formData.email}
                onChange={handleChange}
                required
                half
              />

              {/* Password */}
              <InputField
                id="cf-password"
                name="password"
                label={isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                icon={Lock}
                type="password"
                placeholder={isEditing ? "Laisser vide pour ne pas changer" : "••••••••"}
                value={formData.password}
                onChange={handleChange}
                required={!isEditing}
                half
              />

              {/* Role select */}
              <div className="col-span-2">
                <label htmlFor="cf-role" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Rôle d'accès <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="cf-role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none appearance-none cursor-pointer transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                    required
                  >
                    <option value="Admin">Admin — Contrôle total (Voir, Ajouter, Modifier, Supprimer)</option>
                    <option value="Editor">Editor / Manager — Voir, Ajouter et Modifier (Pas de suppression)</option>
                    <option value="Viewer">Viewer — Lecture seule (Accès en consultation)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ════════════ Section: Contact ════════════ */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" />
              Contact
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField id="cf-email" name="email" label="Adresse e-mail" icon={Mail} type="email" placeholder="exemple@email.com" value={formData.email} onChange={handleChange} />
              <InputField id="cf-phone" name="phone" label="Téléphone" icon={Phone} type="tel" placeholder="+33 6 12 34 56 78" value={formData.phone} onChange={handleChange} half />
              <InputField id="cf-city" name="city" label="Ville" icon={MapPin} placeholder="Tarnos" value={formData.city} onChange={handleChange} half />
              <InputField id="cf-address" name="address" label="Adresse" icon={MapPin} placeholder="12 rue des Lilas" value={formData.address} onChange={handleChange} />
              <InputField id="cf-postal" name="postal_code" label="Code postal" icon={MapPin} placeholder="40220" value={formData.postal_code} onChange={handleChange} half />
            </div>
          </div>

          {/* ════════════ Section: Médical ════════════ */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5" />
              Informations médicales
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField id="cf-blood" name="blood_type" label="Groupe sanguin" icon={Droplets} placeholder="A+, O-, AB+..." value={medicalData.blood_type} onChange={handleMedicalChange} half />
              <InputField id="cf-doctor" name="doctor_name" label="Médecin traitant" icon={Stethoscope} placeholder="Dr. Martin" value={medicalData.doctor_name} onChange={handleMedicalChange} half />

              {/* Allergies textarea */}
              <div className="col-span-2">
                <label htmlFor="cf-allergies" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Allergies
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="cf-allergies"
                    name="allergies"
                    value={medicalData.allergies}
                    onChange={handleMedicalChange}
                    placeholder="Pénicilline, Arachides..."
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Pathologies textarea */}
              <div className="col-span-2">
                <label htmlFor="cf-pathologies" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pathologies
                </label>
                <div className="relative">
                  <Activity className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="cf-pathologies"
                    name="pathologies"
                    value={medicalData.pathologies}
                    onChange={handleMedicalChange}
                    placeholder="Diabète type 2, Hypertension..."
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ───── Action buttons ───── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || loadingRoles}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanionForm;
