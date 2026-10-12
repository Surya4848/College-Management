import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
	Activity,
	Award,
	CalendarDays,
	Check,
	ClipboardCheck,
	Download,
	FileText,
	Image,
	Megaphone,
	Search,
	Users,
} from 'lucide-react'
import './StaffActivity.css'

type ActivityArea = 'Attendance' | 'Announcements' | 'Events' | 'Achievements' | 'Students'
type Period = 'Today' | 'This week' | 'Earlier'

type ActivityEntry = {
	title: string
	detail: string
	area: ActivityArea
	time: string
	period: Period
	icon: LucideIcon
	tone: string
}

const activities: ActivityEntry[] = [
	{ title: 'Marked attendance for B.Tech IT · A', detail: '55 of 62 students marked present for the morning session.', area: 'Attendance', time: 'Today · 11:42 AM', period: 'Today', icon: ClipboardCheck, tone: 'green' },
	{ title: 'Posted IT department announcement', detail: 'Internal Examination Schedule shared with assigned sections.', area: 'Announcements', time: 'Today · 09:05 AM', period: 'Today', icon: Megaphone, tone: 'blue' },
	{ title: 'Added Technical Symposium event', detail: 'Technical Symposium 2026 · Seminar Hall · 10 Oct 2026.', area: 'Events', time: 'Yesterday · 03:18 PM', period: 'This week', icon: CalendarDays, tone: 'amber' },
	{ title: 'Updated student achievement', detail: 'Added inter-college badminton recognition for S. Harini.', area: 'Achievements', time: '24 Sep · 01:40 PM', period: 'This week', icon: Award, tone: 'violet' },
	{ title: 'Viewed student profile', detail: 'Student record 23IT001 · A. Kavya.', area: 'Students', time: '24 Sep · 10:22 AM', period: 'This week', icon: Users, tone: 'teal' },
	{ title: 'Reviewed Innovation Showcase album', detail: 'Gallery album · 38 photos · IT Department.', area: 'Events', time: '22 Sep · 04:12 PM', period: 'Earlier', icon: Image, tone: 'coral' },
	{ title: 'Confirmed attendance submission', detail: 'B.Tech IT · B · afternoon session.', area: 'Attendance', time: '21 Sep · 02:58 PM', period: 'Earlier', icon: Check, tone: 'green' },
]

export default function StaffActivity({ action }: { action: (message: string) => void }) {
	const [search, setSearch] = useState('')
	const [area, setArea] = useState('All areas')
	const [period, setPeriod] = useState('All activity')

	const filteredActivities = useMemo(() => {
		const term = search.trim().toLowerCase()
		return activities.filter((item) => {
			const matchesArea = area === 'All areas' || item.area === area
			const matchesPeriod = period === 'All activity' || item.period === period
			const matchesSearch = !term || `${item.title} ${item.detail} ${item.area}`.toLowerCase().includes(term)
			return matchesArea && matchesPeriod && matchesSearch
		})
	}, [area, period, search])

	return (
		<div className="inner-page staff-activity-page">
			<div className="inner-title-row">
				<div>
					<p className="eyebrow">Workspace history</p>
					<h1>Staff Activity</h1>
					<p>A record of recent actions across your staff workspace.</p>
				</div>
				<button className="primary-button" onClick={() => action('Activity export started')}><Download size={14} /> Export activity</button>
			</div>

			<div className="activity-summary">
				<section><span className="activity-summary-icon activity-summary-blue"><Activity size={17} /></span><div><strong>18</strong><small>Actions this week</small></div></section>
				<section><span className="activity-summary-icon activity-summary-green"><ClipboardCheck size={17} /></span><div><strong>8</strong><small>Attendance updates</small></div></section>
				<section><span className="activity-summary-icon activity-summary-amber"><FileText size={17} /></span><div><strong>4</strong><small>Content published</small></div></section>
			</div>

			<section className="panel staff-activity-panel">
				<div className="staff-activity-toolbar">
					<div className="staff-activity-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" aria-label="Search activity" /></div>
					<div className="activity-filters">
						<label><span>Area</span><select value={area} onChange={(event) => setArea(event.target.value)} aria-label="Filter by area"><option>All areas</option><option>Attendance</option><option>Announcements</option><option>Events</option><option>Achievements</option><option>Students</option></select></label>
						<label><span>Period</span><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Filter by period"><option>All activity</option><option>Today</option><option>This week</option><option>Earlier</option></select></label>
					</div>
				</div>

				<div className="staff-activity-list" aria-live="polite">
					{filteredActivities.map(({ title, detail, area: entryArea, time, icon: Icon, tone }) => (
						<article className="staff-activity-entry" key={`${title}-${time}`}>
							<span className={`staff-activity-icon activity-tone-${tone}`}><Icon size={16} /></span>
							<div className="staff-activity-copy"><div className="staff-activity-title"><h2>{title}</h2><span>{entryArea}</span></div><p>{detail}</p></div>
							<time>{time}</time>
						</article>
					))}
					{filteredActivities.length === 0 && <p className="staff-activity-empty">No activity matches these filters.</p>}
				</div>
				<div className="staff-activity-footer"><span>Showing {filteredActivities.length} of {activities.length} recent actions</span><button className="btn-ghost" onClick={() => action('You are viewing the latest activity')}>Latest activity</button></div>
			</section>
		</div>
	)
}
