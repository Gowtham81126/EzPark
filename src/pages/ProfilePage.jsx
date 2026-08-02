import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { userDatabase } from '../utils/userDatabase'

/* ── tiny icon helpers ─────────────────────────────────────────── */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.586-6.586a2 2 0 112.828 2.828L11.828 13.828A2 2 0 0110 14H8v-2a2 2 0 01.586-1.414z" />
  </svg>
)
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/* ── helpers ───────────────────────────────────────────────────── */
function InfoRow({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  )
}

function StatusBadge({ type, message }) {
  if (!message) return null
  const styles = type === 'success'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700'
  return (
    <p className={`text-sm border rounded-lg px-3 py-2 ${styles}`}>{message}</p>
  )
}

/* ── component ─────────────────────────────────────────────────── */
function ProfilePage() {
  const { currentUser, isLoggedIn } = useStore()

  const [displayUser, setDisplayUser] = useState(null)

  // ── name edit state ──
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameStatus, setNameStatus] = useState(null) // { type, message }
  const [savingName, setSavingName] = useState(false)

  // ── password edit state ──
  const [editingPassword, setEditingPassword] = useState(false)
  const [currentPasswordInput, setCurrentPasswordInput] = useState('')
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showStoredPassword, setShowStoredPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (currentUser?.id) {
        const users = await userDatabase.getUsers()
        const user = users.find(u => u.id === currentUser.id)
        setDisplayUser(user || currentUser)
      }
    }
    load()
  }, [currentUser])

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Please login to view your profile.</p>
      </div>
    )
  }

  if (!displayUser) return null

  /* ── save name ─────────────────────────────────────────────── */
  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return setNameStatus({ type: 'error', message: 'Name cannot be empty.' })
    if (trimmed.length < 2) return setNameStatus({ type: 'error', message: 'Name must be at least 2 characters.' })

    setSavingName(true)
    setNameStatus(null)
    const result = await userDatabase.updateUser(displayUser.id, { name: trimmed })
    setSavingName(false)

    if (result.success) {
      // Sync localStorage currentUser
      const updated = { ...currentUser, name: trimmed, username: trimmed }
      localStorage.setItem('currentUser', JSON.stringify(updated))
      useStore.setState({ currentUser: updated })
      setDisplayUser(result.user)
      setEditingName(false)
      setNameStatus({ type: 'success', message: 'Name updated successfully!' })
      setTimeout(() => setNameStatus(null), 3000)
    } else {
      setNameStatus({ type: 'error', message: result.error || 'Failed to update name.' })
    }
  }

  const handleCancelName = () => {
    setEditingName(false)
    setNameInput('')
    setNameStatus(null)
  }

  /* ── save password ─────────────────────────────────────────── */
  const handleSavePassword = async () => {
    setPasswordStatus(null)
    if (currentPasswordInput !== displayUser.password) {
      return setPasswordStatus({ type: 'error', message: 'Current password is incorrect.' })
    }
    if (newPasswordInput.length < 6) {
      return setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' })
    }
    if (newPasswordInput !== confirmPasswordInput) {
      return setPasswordStatus({ type: 'error', message: 'Passwords do not match.' })
    }
    if (newPasswordInput === currentPasswordInput) {
      return setPasswordStatus({ type: 'error', message: 'New password must differ from the current one.' })
    }

    setSavingPassword(true)
    const result = await userDatabase.updateUser(displayUser.id, { password: newPasswordInput })
    setSavingPassword(false)

    if (result.success) {
      const updated = { ...currentUser, password: newPasswordInput }
      localStorage.setItem('currentUser', JSON.stringify(updated))
      useStore.setState({ currentUser: updated })
      setDisplayUser(result.user)
      setEditingPassword(false)
      setCurrentPasswordInput('')
      setNewPasswordInput('')
      setConfirmPasswordInput('')
      setPasswordStatus({ type: 'success', message: 'Password changed successfully!' })
      setTimeout(() => setPasswordStatus(null), 3000)
    } else {
      setPasswordStatus({ type: 'error', message: result.error || 'Failed to change password.' })
    }
  }

  const handleCancelPassword = () => {
    setEditingPassword(false)
    setCurrentPasswordInput('')
    setNewPasswordInput('')
    setConfirmPasswordInput('')
    setPasswordStatus(null)
  }

  /* ── avatar initials ───────────────────────────────────────── */
  const initials = (displayUser.name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Header card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-inner flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{displayUser.name || 'User'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">+91 {displayUser.phoneNumber}</p>
          </div>
        </div>

        {/* ── Global status (after save) ───────────────────────── */}
        {nameStatus && !editingName && <StatusBadge type={nameStatus.type} message={nameStatus.message} />}
        {passwordStatus && !editingPassword && <StatusBadge type={passwordStatus.type} message={passwordStatus.message} />}

        {/* ── Edit Name card ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Name</h2>
            {!editingName && (
              <button
                onClick={() => { setEditingName(true); setNameInput(displayUser.name || ''); setNameStatus(null) }}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <PencilIcon /> Edit
              </button>
            )}
          </div>

          {editingName ? (
            <div className="space-y-3">
              <input
                id="profile-name-input"
                type="text"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setNameStatus(null) }}
                placeholder="Enter your name"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <StatusBadge type={nameStatus?.type} message={nameStatus?.message} />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <CheckIcon /> {savingName ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancelName}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <XIcon /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 font-medium">{displayUser.name || 'N/A'}</p>
          )}
        </div>

        {/* ── Change Password card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Password</h2>
            {!editingPassword && (
              <button
                onClick={() => { setEditingPassword(true); setPasswordStatus(null) }}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <PencilIcon /> Change
              </button>
            )}
          </div>

          {editingPassword ? (
            <div className="space-y-3">
              {/* Current password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPasswordInput}
                    onChange={e => { setCurrentPasswordInput(e.target.value); setPasswordStatus(null) }}
                    placeholder="Enter current password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={e => { setNewPasswordInput(e.target.value); setPasswordStatus(null) }}
                    placeholder="At least 6 characters"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="profile-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={e => { setConfirmPasswordInput(e.target.value); setPasswordStatus(null) }}
                    placeholder="Repeat new password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <StatusBadge type={passwordStatus?.type} message={passwordStatus?.message} />

              <div className="flex gap-2">
                <button
                  onClick={handleSavePassword}
                  disabled={savingPassword}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <CheckIcon /> {savingPassword ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancelPassword}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <XIcon /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-gray-800 font-medium tracking-widest">
                {showStoredPassword ? displayUser.password : '•'.repeat(8)}
              </p>
              <button type="button" onClick={() => setShowStoredPassword(v => !v)} className="text-gray-400 hover:text-gray-600">
                {showStoredPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          )}
        </div>

        {/* ── Read-only details card ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Phone Number">
              <p className="text-gray-800 font-medium">+91 {displayUser.phoneNumber || 'N/A'}</p>
            </InfoRow>
            <InfoRow label="Gender">
              <p className="text-gray-800 font-medium capitalize">{displayUser.gender || 'N/A'}</p>
            </InfoRow>
            <InfoRow label="Date of Birth">
              <p className="text-gray-800 font-medium">
                {displayUser.dateOfBirth
                  ? new Date(displayUser.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
            </InfoRow>
            <InfoRow label="Account Created">
              <p className="text-gray-800 font-medium">
                {displayUser.createdAt
                  ? new Date(displayUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
            </InfoRow>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              User ID: <span className="font-mono text-gray-500">{displayUser.id || 'N/A'}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProfilePage
