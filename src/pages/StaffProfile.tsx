import { useState } from 'react'
import './MyProfile.css'
import {
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from 'lucide-react'

export type StaffProfileData = {
  name: string
  staffId: string
  department: string
  designation: string
  qualification: string
  email: string
  phone: string
  office: string
  photoUrl?: string
  status: string
}

const initialStaffProfile: StaffProfileData = {
  name: 'Dr. Arun Kumar',
  staffId: 'SBCIT-FAC-001',
  department: 'Information Technology',
  designation: 'Assistant Professor',
  qualification: 'Ph.D. in Computer Science',
  email: 'arun.kumar@college.edu',
  phone: '+91 98765 43210',
  office: 'Block A · Room 204',
  photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&h=240&q=85',
  status: 'Active',
}

export function getSavedStaffProfile(): StaffProfileData {
  try {
    const savedProfile = window.localStorage.getItem('staff-profile')
    return savedProfile ? { ...initialStaffProfile, ...JSON.parse(savedProfile) as Partial<StaffProfileData> } : initialStaffProfile
  } catch {
    return initialStaffProfile
  }
}

type StaffFieldProps = {
  label: string
  value: string
  icon: typeof UserRound
  editing: boolean
  onChange: (value: string) => void
}

function StaffField({ label, value, icon: Icon, editing, onChange }: StaffFieldProps) {
  return (
    <label className="profile-field">
      <span className="profile-field-icon"><Icon size={16} /></span>
      <span className="profile-field-content">
        <span className="profile-field-label">{label}</span>
        {editing ? (
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <strong>{value}</strong>
        )}
      </span>
    </label>
  )
}

export default function StaffProfile({ action, profile, onProfileChange, staffType }: { action: (message: string) => void; profile: StaffProfileData; onProfileChange: (profile: StaffProfileData) => void; staffType: 'in-charge' | 'staff' }) {
  const [draft, setDraft] = useState<StaffProfileData>(profile)
  const [editing, setEditing] = useState(false)
  const roleTitle = staffType === 'in-charge' ? 'In-Charge' : 'Staff'

  function startEditing() {
    setDraft(profile)
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(profile)
    setEditing(false)
  }

  function updateField(field: keyof StaffProfileData, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onProfileChange(draft)
    setEditing(false)
    try {
      window.localStorage.setItem('staff-profile', JSON.stringify(draft))
      action('Staff profile saved')
    } catch {
      action('Staff profile updated for this session')
    }
  }

  return (
    <div className="inner-page profile-page">
      <div className="inner-title-row">
        <div>
          <p className="eyebrow">{roleTitle.toUpperCase()} ACCOUNT</p>
          <h1>{roleTitle} Profile</h1>
          <p>View and maintain your {roleTitle.toLowerCase()} identity and department details.</p>
        </div>
        {!editing && (
          <button className="primary-button" onClick={startEditing}>
            <Pencil size={14} /> Edit profile
          </button>
        )}
      </div>

      <form onSubmit={saveProfile}>
        <section className="profile-identity panel">
          <div className="profile-avatar-wrap">
            <img className="profile-avatar" src={draft.photoUrl || profile.photoUrl || initialStaffProfile.photoUrl} alt="Staff profile" />
          </div>
          <div className="profile-identity-copy">
            <span className="profile-status"><span />{draft.status}</span>
            <h2>{draft.name}</h2>
            <p>{draft.designation} · {draft.department}</p>
            <div className="profile-identity-meta">
              <span><BriefcaseBusiness size={12} />{draft.staffId}</span>
              <span><GraduationCap size={12} />{draft.qualification}</span>
            </div>
          </div>
            <div className="profile-identity-mark">
              <Check size={14} /> {roleTitle}
          </div>
        </section>

        <div className="profile-details-grid">
          <section className="panel profile-details-panel">
            <div className="profile-section-heading">
              <span><UserRound size={15} /></span>
              <div>
                <h2>Faculty Identity</h2>
                <p>Personal and assignment details</p>
              </div>
            </div>
            <div className="profile-fields">
              <StaffField label="Full name" value={draft.name} icon={UserRound} editing={editing} onChange={(value) => updateField('name', value)} />
              <StaffField label="Staff ID" value={draft.staffId} icon={BriefcaseBusiness} editing={editing} onChange={(value) => updateField('staffId', value)} />
              <StaffField label="Department" value={draft.department} icon={BriefcaseBusiness} editing={editing} onChange={(value) => updateField('department', value)} />
              <StaffField label="Designation" value={draft.designation} icon={Check} editing={editing} onChange={(value) => updateField('designation', value)} />
              <StaffField label="Qualification" value={draft.qualification} icon={GraduationCap} editing={editing} onChange={(value) => updateField('qualification', value)} />
              <StaffField label="Status" value={draft.status} icon={Check} editing={editing} onChange={(value) => updateField('status', value)} />
            </div>
          </section>

          <section className="panel profile-details-panel">
            <div className="profile-section-heading">
              <span><Mail size={15} /></span>
              <div>
                <h2>Contact Details</h2>
                <p>Faculty communication information</p>
              </div>
            </div>
            <div className="profile-fields">
              <StaffField label="Email" value={draft.email} icon={Mail} editing={editing} onChange={(value) => updateField('email', value)} />
              <StaffField label="Phone" value={draft.phone} icon={Phone} editing={editing} onChange={(value) => updateField('phone', value)} />
              <StaffField label="Office" value={draft.office} icon={MapPin} editing={editing} onChange={(value) => updateField('office', value)} />
              <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
                <span className="profile-field-icon"><BriefcaseBusiness size={16} /></span>
                <span className="profile-field-content">
                  <span className="profile-field-label">Access</span>
                  <strong>{roleTitle} role · {draft.department || 'Department not selected'}</strong>
                </span>
              </div>
            </div>
          </section>
        </div>

        {editing && (
          <div className="profile-form-actions">
            <button type="button" className="filter-button" onClick={cancelEditing}><X size={14} /> Cancel</button>
            <button type="submit" className="primary-button"><Save size={14} /> Save changes</button>
          </div>
        )}
      </form>
    </div>
  )
}
