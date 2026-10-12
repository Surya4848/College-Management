import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react'
import './MyProfile.css'
import {
	BriefcaseBusiness,
	Building2,
	CalendarDays,
	Check,
	GraduationCap,
	Mail,
	MapPin,
	Pencil,
	Phone,
	Save,
	ShieldCheck,
	Minus,
	Plus,
	RotateCcw,
	RotateCw,
	Sun,
	Contrast,
	Droplets,
	Upload,
	UserRound,
	X,
} from 'lucide-react'

export type ProfileData = {
	name: string
	staffId: string
	designation: string
	department: string
	email: string
	phone: string
	office: string
	qualification: string
	joined: string
	photoUrl?: string
}

const initialProfile: ProfileData = {
	name: 'Dr. Arun Kumar',
	staffId: 'SBCIT-FAC-001',
	designation: 'Assistant Professor',
	department: 'Information Technology',
	email: 'arun.kumar@college.edu',
	phone: '+91 98765 43210',
	office: 'Block A · Room 204',
	qualification: 'Ph.D. in Computer Science',
	joined: 'June 2018',
	photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&h=240&q=85',
}

export function getSavedProfile(): ProfileData {
	try {
		const savedProfile = window.localStorage.getItem('staff-portal-profile')
		return savedProfile ? { ...initialProfile, ...JSON.parse(savedProfile) as Partial<ProfileData> } : initialProfile
	} catch {
		return initialProfile
	}
}

type ProfileFieldProps = {
	label: string
	value: string
	icon: typeof UserRound
	editing: boolean
	onChange: (value: string) => void
	type?: string
}

function ProfileField({ label, value, icon: Icon, editing, onChange, type = 'text' }: ProfileFieldProps) {
	return (
		<label className="profile-field">
			<span className="profile-field-icon"><Icon size={16} /></span>
			<span className="profile-field-content">
				<span className="profile-field-label">{label}</span>
				{editing ? (
					<input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
				) : (
					<strong>{value}</strong>
				)}
			</span>
		</label>
	)
}

export default function MyProfile({ action, profile: sharedProfile, onProfileChange }: { action: (message: string) => void; profile: ProfileData; onProfileChange: (profile: ProfileData) => void }) {
	const [profile, setProfile] = useState<ProfileData>(sharedProfile)
	const [draft, setDraft] = useState<ProfileData>(sharedProfile)
	const [editing, setEditing] = useState(false)
	const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
	const [photoZoom, setPhotoZoom] = useState(1)
	const [photoRotation, setPhotoRotation] = useState(0)
	const [photoBrightness, setPhotoBrightness] = useState(100)
	const [photoContrast, setPhotoContrast] = useState(100)
	const [photoSaturation, setPhotoSaturation] = useState(100)
	const [photoCrop, setPhotoCrop] = useState(false)
	const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 })
	const [dragStart, setDragStart] = useState<{ x: number; y: number; originX: number; originY: number } | null>(null)
	const photoStageRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		document.body.classList.toggle('photo-viewer-open', photoViewerOpen)
		return () => document.body.classList.remove('photo-viewer-open')
	}, [photoViewerOpen])

	function startEditing() {
		setDraft(profile)
		setEditing(true)
	}

	function cancelEditing() {
		setDraft(profile)
		setEditing(false)
	}

	function updateField(field: keyof ProfileData, value: string) {
		setDraft((current) => ({ ...current, [field]: value }))
	}

	function saveProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setProfile(draft)
		setEditing(false)
		onProfileChange(draft)
		try {
			window.localStorage.setItem('staff-portal-profile', JSON.stringify(draft))
			action('Profile details saved')
		} catch {
			action('Profile updated for this session, but browser storage is unavailable')
		}
	}

	function uploadProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith('image/')) {
			action('Please choose an image file')
			return
		}
		const reader = new FileReader()
		reader.onload = () => setDraft((current) => ({ ...current, photoUrl: String(reader.result) }))
		reader.readAsDataURL(file)
	}

	function openPhotoViewer() {
		setPhotoViewerOpen(true)
		setPhotoZoom(1)
		setPhotoRotation(0)
		setPhotoBrightness(100)
		setPhotoContrast(100)
		setPhotoSaturation(100)
		setPhotoCrop(false)
		setPhotoPosition({ x: 0, y: 0 })
	}

	function resetPhotoEdits() {
		setPhotoZoom(1)
		setPhotoRotation(0)
		setPhotoBrightness(100)
		setPhotoContrast(100)
		setPhotoSaturation(100)
		setPhotoCrop(false)
		setPhotoPosition({ x: 0, y: 0 })
	}

	function handlePhotoPointerDown(event: PointerEvent<HTMLDivElement>) {
		event.currentTarget.setPointerCapture(event.pointerId)
		setDragStart({ x: event.clientX, y: event.clientY, originX: photoPosition.x, originY: photoPosition.y })
	}

	function handlePhotoPointerMove(event: PointerEvent<HTMLDivElement>) {
		if (!dragStart) return
		setPhotoPosition({ x: dragStart.originX + event.clientX - dragStart.x, y: dragStart.originY + event.clientY - dragStart.y })
	}

	function savePhotoEdits() {
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.onload = () => {
			const canvas = document.createElement('canvas')
			const size = 800
			canvas.width = size
			canvas.height = size
			const context = canvas.getContext('2d')
			if (!context) return
			context.filter = `brightness(${photoBrightness}%) contrast(${photoContrast}%) saturate(${photoSaturation}%)`
			context.translate(size / 2 + photoPosition.x, size / 2 + photoPosition.y)
			context.rotate((photoRotation * Math.PI) / 180)
			const scale = photoZoom * Math.max(size / image.width, size / image.height)
			context.drawImage(image, -(image.width * scale) / 2, -(image.height * scale) / 2, image.width * scale, image.height * scale)
				const updatedProfile = { ...(draft || profile), photoUrl: canvas.toDataURL('image/jpeg', .88) }
			setProfile(updatedProfile)
			setDraft(updatedProfile)
			onProfileChange(updatedProfile)
			setPhotoViewerOpen(false)
			action('Profile picture updated')
		}
		image.onerror = () => action('This picture could not be edited')
		image.src = draft?.photoUrl || profile.photoUrl || initialProfile.photoUrl || ''
	}

	return (
		<div className="inner-page profile-page">
			<div className="inner-title-row">
				<div>
					<p className="eyebrow">STAFF ACCOUNT</p>
					<h1>My Profile</h1>
					<p>Manage your staff identity and department information.</p>
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
						{editing ? <div className="profile-avatar-edit-actions"><button className="profile-avatar-view-button" type="button" onClick={openPhotoViewer} aria-label="Open profile picture editor"><img className="profile-avatar" src={draft.photoUrl || initialProfile.photoUrl || ''} alt={`${draft.name} profile picture`} /></button></div> : <button className="profile-avatar-view-button" type="button" onClick={openPhotoViewer} aria-label={`Open ${profile.name} profile picture`}><img className="profile-avatar" src={profile.photoUrl || initialProfile.photoUrl || ''} alt={profile.name} /></button>}
					</div>
					<div className="profile-identity-copy">
						<span className="profile-status"><span /> Active staff</span>
						<h2>{editing ? draft.name : profile.name}</h2>
						<p>{editing ? draft.designation : profile.designation}</p>
						<div className="profile-identity-meta">
							<span><Building2 size={14} /> {profile.department}</span>
							<span><ShieldCheck size={14} /> Staff ID: {profile.staffId}</span>
						</div>
					</div>
					<div className="profile-identity-mark"><GraduationCap size={24} /><span>College Management Portal</span></div>
				</section>

				<div className="profile-details-grid">
					<section className="panel profile-details-panel">
						<div className="profile-section-heading">
							<span><BriefcaseBusiness size={17} /></span>
							<div><h2>Professional information</h2><p>Your role and academic details</p></div>
						</div>
						<div className="profile-fields">
							<ProfileField label="Full name" value={editing ? draft.name : profile.name} icon={UserRound} editing={editing} onChange={(value) => updateField('name', value)} />
							<ProfileField label="Designation" value={editing ? draft.designation : profile.designation} icon={BriefcaseBusiness} editing={editing} onChange={(value) => updateField('designation', value)} />
							<ProfileField label="Department" value={editing ? draft.department : profile.department} icon={Building2} editing={editing} onChange={(value) => updateField('department', value)} />
							<ProfileField label="Qualification" value={editing ? draft.qualification : profile.qualification} icon={GraduationCap} editing={editing} onChange={(value) => updateField('qualification', value)} />
							<ProfileField label="Date joined" value={editing ? draft.joined : profile.joined} icon={CalendarDays} editing={editing} onChange={(value) => updateField('joined', value)} />
						</div>
					</section>

					<section className="panel profile-details-panel">
						<div className="profile-section-heading">
							<span><Mail size={17} /></span>
							<div><h2>Contact information</h2><p>How colleagues can reach you</p></div>
						</div>
						<div className="profile-fields">
							<ProfileField label="Work email" value={editing ? draft.email : profile.email} icon={Mail} editing={editing} onChange={(value) => updateField('email', value)} type="email" />
							<ProfileField label="Phone number" value={editing ? draft.phone : profile.phone} icon={Phone} editing={editing} onChange={(value) => updateField('phone', value)} type="tel" />
							<ProfileField label="Office location" value={editing ? draft.office : profile.office} icon={MapPin} editing={editing} onChange={(value) => updateField('office', value)} />
							<div className="profile-field profile-staff-id">
								<span className="profile-field-icon"><ShieldCheck size={16} /></span>
								<span className="profile-field-content"><span className="profile-field-label">Staff ID</span><strong>{profile.staffId}</strong></span>
							</div>
						</div>
					</section>
				</div>

				{editing && (
					<div className="profile-form-actions">
						<button className="filter-button" type="button" onClick={cancelEditing}><X size={14} /> Cancel</button>
						<button className="primary-button" type="submit"><Save size={14} /> Save changes</button>
					</div>
				)}
			</form>

			{!editing && <div className="profile-update-note"><Check size={14} /><span>Your profile information is managed by the college administration.</span></div>}
			{photoViewerOpen && <div className="profile-photo-viewer" role="dialog" aria-modal="true" aria-labelledby="photo-viewer-title">
				<header className="profile-photo-viewer-header"><button className="icon-button" type="button" aria-label="Close photo viewer" onClick={() => setPhotoViewerOpen(false)}><X size={20} /></button><h2 id="photo-viewer-title">Staff photo</h2><div className="profile-photo-viewer-actions"><button className="photo-edit-action" type="button" onClick={() => setEditing(true)}><Pencil size={14} /> Edit Photo</button><button className="icon-button" type="button" aria-label="Save edited photo" onClick={savePhotoEdits}><Check size={20} /></button></div></header>
				<div ref={photoStageRef} className={`profile-photo-stage${photoCrop ? ' photo-crop-mode' : ''}`} onPointerDown={handlePhotoPointerDown} onPointerMove={handlePhotoPointerMove} onPointerUp={() => setDragStart(null)} onPointerCancel={() => setDragStart(null)}>
					<img src={draft?.photoUrl || profile.photoUrl || initialProfile.photoUrl || ''} alt="Staff photo preview" style={{ transform: `translate(${photoPosition.x}px, ${photoPosition.y}px) rotate(${photoRotation}deg) scale(${photoZoom})`, filter: `brightness(${photoBrightness}%) contrast(${photoContrast}%) saturate(${photoSaturation}%)` }} draggable="false" />
				</div>
				<div className="profile-photo-controls">
					<div className="photo-control-row"><button type="button" className="photo-tool" onClick={() => setPhotoZoom((value) => Math.max(.5, value - .1))}><Minus size={15} /> Zoom out</button><span>{Math.round(photoZoom * 100)}%</span><button type="button" className="photo-tool" onClick={() => setPhotoZoom((value) => Math.min(3, value + .1))}><Plus size={15} /> Zoom in</button></div>
					<div className="photo-tool-grid"><button type="button" className="photo-tool" onClick={() => setPhotoCrop((value) => !value)}><span className="photo-tool-label">Crop</span><span>{photoCrop ? 'On' : 'Off'}</span></button><button type="button" className="photo-tool" onClick={() => setPhotoRotation((value) => value - 90)}><RotateCcw size={15} /> Rotate left</button><button type="button" className="photo-tool" onClick={() => setPhotoRotation((value) => value + 90)}><RotateCw size={15} /> Rotate right</button><button type="button" className="photo-tool" onClick={resetPhotoEdits}><RotateCcw size={15} /> Reset</button><label className="photo-tool photo-upload-tool"><Upload size={15} /> Upload picture<input type="file" accept="image/*" onChange={uploadProfilePhoto} /></label></div>
					<label className="photo-slider"><Sun size={15} /> Brightness<input type="range" min="50" max="150" value={photoBrightness} onChange={(event) => setPhotoBrightness(Number(event.target.value))} /><output>{photoBrightness}%</output></label>
					<label className="photo-slider"><Contrast size={15} /> Contrast<input type="range" min="50" max="150" value={photoContrast} onChange={(event) => setPhotoContrast(Number(event.target.value))} /><output>{photoContrast}%</output></label>
					<label className="photo-slider"><Droplets size={15} /> Saturation<input type="range" min="0" max="200" value={photoSaturation} onChange={(event) => setPhotoSaturation(Number(event.target.value))} /><output>{photoSaturation}%</output></label>
				</div>
			</div>}
		</div>
	)
}
