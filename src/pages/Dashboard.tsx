import type { LucideIcon } from 'lucide-react'
import { weeklyClasses } from '../timetableData'
import type { ProfileData } from './MyProfile'
import {
	Award,
	Bell,
	CalendarDays,
	Check,
	ChevronRight,
	Clock3,
	Cloud,
	FileText,
	Grid2X2,
	Image,
	Info,
	MapPin,
	Megaphone,
	Sprout,
	Trophy,
	UserRound,
	Users,
	Volleyball,
	Zap,
} from 'lucide-react'

type DashboardView =
	| 'Dashboard'
	| 'Profile'
	| 'My Profile'
	| 'Staff Profile'
	| 'Students'
	| 'Attendance'
	| 'Classes & Timetable'
	| 'Announcements'
	| 'Events'
	| 'Sports'
	| 'Staff Activity'
	| 'Settings'

type DashboardProps = {
	goTo: (view: DashboardView) => void
	staffProfile: ProfileData
	staffType: 'in-charge' | 'staff'
	mode?: 'staff' | 'hod'
}

const announcements = [
	{ title: 'Internal Examination Schedule', meta: '25 Sep 2026 · Examination Cell', text: 'The internal examination timetable has been published.', tone: 'coral', priority: 'High' },
	{ title: 'Department Meeting', meta: '28 Sep 2026 · IT Department', text: 'Department meeting on 28 Sep 2026 at 10:00 AM.', tone: 'blue', priority: 'Medium' },
	{ title: 'College Sports Day', meta: '30 Sep 2026 · Sports Cell', text: 'Sports Day will be held on 05 Oct 2026. All students are invited.', tone: 'green', priority: 'Low' },
	{ title: 'Holiday Notice', meta: '02 Oct 2026 · Principal Office', text: 'College will remain closed on 02 Oct (Gandhi Jayanti).', tone: 'violet', priority: 'General' },
]

const activities = [
	{ icon: Megaphone, text: 'Posted IT department announcement', time: '2 hours ago', tone: 'blue' },
	{ icon: Check, text: 'Marked attendance for B.Tech IT · A', time: '4 hours ago', tone: 'green' },
	{ icon: CalendarDays, text: 'Added Technical Symposium event', time: '1 day ago', tone: 'blue' },
	{ icon: Award, text: 'Updated student achievement', time: '1 day ago', tone: 'violet' },
	{ icon: Image, text: 'Viewed student profile (23IT001)', time: '2 days ago', tone: 'violet' },
]

const events = [
	{ name: 'Technical Symposium 2026', date: '10 Oct 2026', time: '10:00 AM', place: 'Seminar Hall', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=480&q=80' },
	{ name: 'Cultural Fest', date: '25 Oct 2026', time: '04:00 PM', place: 'Main Auditorium', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=480&q=80' },
]

function PanelHeading({ icon: Icon, title, actionLabel, onAction }: { icon: LucideIcon; title: string; actionLabel?: string; onAction?: () => void }) {
	return (
		<div className="panel-heading">
			<div className="heading-label"><Icon size={17} strokeWidth={2.2} /><h2>{title}</h2></div>
			{actionLabel && <button className="text-action" onClick={onAction}>{actionLabel}<ChevronRight size={13} /></button>}
		</div>
	)
}

function StaffCard({ goTo, staffProfile, mode = 'staff' }: Pick<DashboardProps, 'goTo' | 'staffProfile' | 'mode'>) {
	return (
		<button className="staff-card" onClick={() => goTo(mode === 'hod' ? 'Profile' : 'My Profile')}>
			{staffProfile.photoUrl ? <img src={staffProfile.photoUrl} alt={staffProfile.name} /> : <span className="staff-card-initials" aria-hidden="true">{staffProfile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>}
			<div className="staff-details">
				<div className="staff-name-line"><strong>{staffProfile.name}</strong><span>{staffProfile.designation}</span></div>
				{staffProfile.staffId && <p><UserRound size={13} /><span>Staff ID</span><b>{staffProfile.staffId}</b></p>}
				{staffProfile.department && <p><Users size={13} /><span>Department</span><b>{staffProfile.department}</b></p>}
				{staffProfile.email && <p><FileText size={13} /><span>Email</span><b>{staffProfile.email}</b></p>}
				{staffProfile.phone && <p><Info size={13} /><span>Phone</span><b>{staffProfile.phone}</b></p>}
				{staffProfile.office && <p><MapPin size={13} /><span>Office</span><b>{staffProfile.office}</b></p>}
			</div>
		</button>
	)
}

export default function Dashboard({ goTo, staffProfile, staffType, mode = 'staff' }: DashboardProps) {
	const now = new Date()
	const todayIndex = (now.getDay() + 6) % 7
	const todayClasses = weeklyClasses[todayIndex] ?? []
	const nowMinutes = now.getHours() * 60 + now.getMinutes()
	const completedClasses = todayClasses.filter((session) => {
		const [hours, minutes] = session.endTime.split(':').map(Number)
		return hours * 60 + minutes <= nowMinutes
	}).length
	const upcomingClasses = Array.from({ length: 8 }, (_, dayOffset) => {
		const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset)
		const dayIndex = (date.getDay() + 6) % 7
		return (weeklyClasses[dayIndex] ?? []).map((session) => ({ date, session }))
	}).flat().filter(({ date, session }) => {
		const [hours, minutes] = session.startTime.split(':').map(Number)
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes) > now
	}).sort((first, second) => {
		const [firstHours, firstMinutes] = first.session.startTime.split(':').map(Number)
		const [secondHours, secondMinutes] = second.session.startTime.split(':').map(Number)
		const firstStart = new Date(first.date.getFullYear(), first.date.getMonth(), first.date.getDate(), firstHours, firstMinutes)
		const secondStart = new Date(second.date.getFullYear(), second.date.getMonth(), second.date.getDate(), secondHours, secondMinutes)
		return firstStart.getTime() - secondStart.getTime()
	}).slice(0, 3)
	const formattedToday = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
	const weekdayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(now)

	return (
		<>
			<div className="welcome-row">
				<div>
					<p className="eyebrow">{formattedToday.toUpperCase()}</p>
					<h1>Welcome back, <strong>{staffProfile.name}</strong></h1>
					<p className="welcome-subtitle">{staffType === 'in-charge' ? 'In-Charge overview for your department.' : 'Your classes, students, and campus updates for today.'}</p>
				</div>
				<div className="date-chip"><CalendarDays size={16} /><span><strong>{formattedToday}</strong><small>{weekdayLabel}</small></span></div>
			</div>

			<div className="overview-grid">
				<button className="metric-card metric-blue metric-link" onClick={() => goTo('Students')} aria-label="Open assigned students roster"><div className="metric-icon"><Users size={21} /></div><div><span className="metric-label">Total Students <small>{mode === 'hod' ? '(Department)' : '(Assigned)'}</small></span><strong className="metric-number">{mode === 'hod' ? '248' : '62'}</strong><span className="metric-action">View Students <ChevronRight size={13} /></span></div></button>
				{mode === 'hod' ? <button className="metric-card metric-green metric-link" onClick={() => goTo('Staff Activity')} aria-label="Open department staff"><div className="metric-icon"><Users size={21} /></div><div><span className="metric-label">Total Staff</span><strong className="metric-number">18</strong><span className="metric-foot">Assigned to department</span><span className="metric-action">View Staff <ChevronRight size={13} /></span></div></button> : <button className="metric-card metric-green metric-link" onClick={() => goTo('Attendance')} aria-label="Open attendance"><div className="metric-icon"><Check size={21} /></div><div><span className="metric-label">Present Today</span><strong className="metric-number">55</strong><span className="metric-foot">88.7% Attendance</span><span className="metric-action">View Attendance <ChevronRight size={13} /></span></div></button>}
				<section className="metric-card metric-amber"><div className="metric-icon"><CalendarDays size={21} /></div><div><span className="metric-label">Today’s Classes</span><strong className="metric-number">{todayClasses.length}</strong><span className="metric-foot">{completedClasses} Completed | {todayClasses.length - completedClasses} Upcoming</span><button onClick={() => goTo('Classes & Timetable')}>View Timetable <ChevronRight size={13} /></button></div></section>
				<section className="metric-card metric-violet"><div className="metric-icon"><Cloud size={21} /></div><div><span className="metric-label">Upcoming Events</span><strong className="metric-number">2</strong><span className="metric-foot">Next: Technical Symposium</span><button onClick={() => goTo('Events')}>View Events <ChevronRight size={13} /></button></div></section>
				<StaffCard goTo={goTo} staffProfile={staffProfile} mode={mode} />
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-col col-main">
					<section className="panel timetable-panel">
						<PanelHeading icon={CalendarDays} title="Staff Timetable" actionLabel="View Full Timetable" onAction={() => goTo('Classes & Timetable')} />
						<div className="table-scroll"><table><thead><tr><th>Time</th><th>Subject</th><th>Class / Section</th><th>Room</th><th>Type</th></tr></thead><tbody>{todayClasses.length ? todayClasses.map((row) => <tr key={row.id}><td><span className={`time-pill ${row.type === 'Practical' ? 'time-green' : row.subject === 'Web Security' ? 'time-coral' : ''}`}>{row.time}</span></td><td className="strong-cell">{row.subject}</td><td><span className="section-square" />{row.section}</td><td>{row.room}</td><td><span className={`type-pill ${row.type === 'Practical' ? 'type-practical' : ''}`}>{row.type}</span></td></tr>) : <tr><td colSpan={5}>No classes scheduled today.</td></tr>}</tbody></table></div>
						<div className="subsection-heading"><h3>Upcoming Classes</h3><button className="text-action" onClick={() => goTo('Classes & Timetable')}>View All <ChevronRight size={13} /></button></div>
						<div className="table-scroll upcoming-table"><table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Class / Section</th><th>Room</th></tr></thead><tbody>{upcomingClasses.map(({ date, session }) => <tr key={`${date.toISOString()}-${session.id}`}><td>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)}</td><td>{session.time}</td><td className="strong-cell">{session.subject}</td><td>{session.section}</td><td>{session.room}</td></tr>)}</tbody></table></div>
					</section>
					<section className="panel events-panel"><PanelHeading icon={CalendarDays} title="Today’s Events" actionLabel="View All" onAction={() => goTo('Events')} /><div className="event-cards">{events.map((event) => <article className="event-card" key={event.name}><img src={event.image} alt={`${event.name} event`} /><div className="event-info"><h3>{event.name}</h3><p><CalendarDays size={12} />{event.date}<span>·</span><Clock3 size={12} />{event.time}</p><p><MapPin size={12} />{event.place}</p><span className="event-organizer">Organized by: {event.name.startsWith('Technical') ? 'IT Department' : 'Cultural Committee'}</span><button onClick={() => goTo('Events')}>View Details <ChevronRight size={13} /></button></div></article>)}</div></section>
				</div>

				<div className="dashboard-col col-mid">
					<section className="panel announcements-panel"><PanelHeading icon={Megaphone} title="College Announcements" actionLabel="View All" onAction={() => goTo('Announcements')} /><div className="announcement-list">{announcements.map((item) => <article className="announcement" key={item.title}><div className={`announcement-icon tone-${item.tone}`}><FileText size={16} /></div><div className="announcement-body"><div className="announcement-title-row"><h3>{item.title}</h3><span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span></div><span className="announcement-meta">{item.meta}</span><p>{item.text}</p></div></article>)}</div></section>
					<section className="panel sports-panel"><PanelHeading icon={Trophy} title="Department Sports" actionLabel="View All" onAction={() => goTo('Sports')} /><div className="sport-grid">{[{ name: 'Cricket', icon: Sprout, color: 'green' }, { name: 'Football', icon: Volleyball, color: 'teal' }, { name: 'Volleyball', icon: Volleyball, color: 'blue' }, { name: 'Badminton', icon: Zap, color: 'violet' }].map(({ name, icon: Icon, color }) => <button className="sport-item" key={name} onClick={() => goTo('Sports')}><span className={`sport-icon sport-${color}`}><Icon size={17} /></span><strong>{name}</strong><small>Team</small></button>)}</div><div className="match-label">Upcoming Match</div><div className="match-row"><CalendarDays size={15} /><div><strong>IT Department vs CS Department</strong><small>30 Sep 2026 · 04:00 PM · College Ground</small></div></div><button className="match-link" onClick={() => goTo('Sports')}>View Details</button></section>
				</div>

				<div className="dashboard-col col-side">
					<section className="panel quick-panel"><PanelHeading icon={Grid2X2} title="Quick Links" /><div className="quick-grid">{[{ label: 'Add Attendance', icon: Check, view: 'Attendance' as const }, { label: 'Add Event', icon: CalendarDays, view: 'Events' as const }, { label: 'Mark Attendance', icon: Bell, view: 'Attendance' as const }, { label: 'View Students', icon: Users, view: 'Students' as const }, { label: 'Class Timetable', icon: CalendarDays, view: 'Classes & Timetable' as const }, { label: 'Department Info', icon: FileText, view: 'My Profile' as const }].map(({ label, icon: Icon, view }) => <button key={label} onClick={() => goTo(view)}><Icon size={15} /><span>{label}</span></button>)}</div></section>
					<section className="panel activity-panel"><PanelHeading icon={Clock3} title="Recent Activity" actionLabel="View All" onAction={() => goTo('Staff Activity')} /><div className="activity-list">{activities.map(({ icon: Icon, text, time, tone }) => <button className="activity-item" key={text} onClick={() => goTo('Staff Activity')}><span className={`activity-icon activity-${tone}`}><Icon size={13} /></span><span><strong>{text}</strong><small>{time}</small></span></button>)}</div></section>
					<section className="quote-panel"><div className="quote-mark"><span /><span /><span /></div><blockquote>“Education is not the learning of facts, but the training of the mind to think.”</blockquote><span className="quote-author">— Albert Einstein</span></section>
				</div>
			</div>
		</>
	)
}
