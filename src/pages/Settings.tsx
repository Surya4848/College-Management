import { useState } from 'react'
import { Bell, CalendarClock, Check, Globe2, Mail, Save, ShieldCheck } from 'lucide-react'
import './Settings.css'

type Preferences = {
	emailAnnouncements: boolean
	attendanceReminders: boolean
	eventUpdates: boolean
	reminderTime: string
	language: string
	weekStartsOn: string
}

const defaultPreferences: Preferences = {
	emailAnnouncements: true,
	attendanceReminders: true,
	eventUpdates: false,
	reminderTime: '16:30',
	language: 'English',
	weekStartsOn: 'Monday',
}

function getSavedPreferences(): Preferences {
	try {
		const saved = window.localStorage.getItem('staff-portal-preferences')
		return saved ? { ...defaultPreferences, ...JSON.parse(saved) as Partial<Preferences> } : defaultPreferences
	} catch {
		return defaultPreferences
	}
}

function PreferenceToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
	return (
		<label className="preference-toggle-row">
			<span className="preference-toggle-copy"><strong>{title}</strong><small>{description}</small></span>
			<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
			<span className="preference-switch" aria-hidden="true" />
		</label>
	)
}

export default function Settings({ action }: { action: (message: string) => void }) {
	const [preferences, setPreferences] = useState<Preferences>(getSavedPreferences)
	const [saved, setSaved] = useState(false)

	function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		setPreferences((current) => ({ ...current, [key]: value }))
		setSaved(false)
	}

	function savePreferences(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			window.localStorage.setItem('staff-portal-preferences', JSON.stringify(preferences))
			setSaved(true)
			action('Preferences saved')
		} catch {
			action('Could not save preferences in this browser')
		}
	}

	return (
		<div className="inner-page settings-page">
			<form onSubmit={savePreferences}>
				<div className="inner-title-row">
					<div>
						<p className="eyebrow">PREFERENCES</p>
						<h1>Settings</h1>
						<p>Manage notifications and workspace preferences.</p>
					</div>
					<button className="primary-button" type="submit"><Save size={14} /> Save changes</button>
				</div>

				<div className="settings-grid">
					<section className="panel settings-section">
						<div className="settings-section-heading"><span className="settings-heading-icon settings-blue"><Bell size={17} /></span><div><h2>Notifications</h2><p>Choose which updates you receive.</p></div></div>
						<div className="settings-options">
							<PreferenceToggle title="Email announcements" description="Receive important college notices by email." checked={preferences.emailAnnouncements} onChange={(value) => update('emailAnnouncements', value)} />
							<PreferenceToggle title="Attendance reminders" description="Get a reminder before the daily attendance deadline." checked={preferences.attendanceReminders} onChange={(value) => update('attendanceReminders', value)} />
							<PreferenceToggle title="Event updates" description="Get notified when campus events are added or changed." checked={preferences.eventUpdates} onChange={(value) => update('eventUpdates', value)} />
							<label className={`settings-select-row ${!preferences.attendanceReminders ? 'settings-disabled' : ''}`}><span><strong>Reminder time</strong><small>Daily attendance reminder</small></span><select disabled={!preferences.attendanceReminders} value={preferences.reminderTime} onChange={(event) => update('reminderTime', event.target.value)}><option value="15:30">03:30 PM</option><option value="16:00">04:00 PM</option><option value="16:30">04:30 PM</option><option value="17:00">05:00 PM</option></select></label>
						</div>
					</section>

					<section className="panel settings-section">
						<div className="settings-section-heading"><span className="settings-heading-icon settings-green"><CalendarClock size={17} /></span><div><h2>Workspace preferences</h2><p>Set your regional and calendar defaults.</p></div></div>
						<div className="settings-options">
							<label className="settings-select-row"><span className="settings-label-icon"><Globe2 size={15} /><span><strong>Language</strong><small>Language used in the portal</small></span></span><select value={preferences.language} onChange={(event) => update('language', event.target.value)}><option>English</option><option>Tamil</option></select></label>
							<label className="settings-select-row"><span className="settings-label-icon"><CalendarClock size={15} /><span><strong>Week starts on</strong><small>Calendar and timetable view</small></span></span><select value={preferences.weekStartsOn} onChange={(event) => update('weekStartsOn', event.target.value)}><option>Monday</option><option>Sunday</option></select></label>
						</div>
						<div className="settings-info"><ShieldCheck size={15} /><p>Your staff account and access permissions are managed by the college administrator.</p></div>
					</section>

					<section className="panel settings-account">
						<div className="settings-section-heading"><span className="settings-heading-icon settings-amber"><Mail size={17} /></span><div><h2>Account email</h2><p>Used for staff notices and account communication.</p></div></div>
						<div className="settings-email-row"><span>arun.kumar@college.edu</span><span className="verified-email"><Check size={12} /> Verified</span></div>
					</section>
				</div>

				{saved && <p className="settings-saved-note" role="status"><Check size={14} /> Preferences saved on this device.</p>}
			</form>
		</div>
	)
}
