import { useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, CalendarDays, Megaphone, Plus, Search, X } from 'lucide-react'
import './Announcements.css'

type AnnouncementCategory = 'Academic' | 'Department' | 'Events' | 'General'
type Announcement = {
	id: number
	title: string
	message: string
	category: AnnouncementCategory
	audience: string
	priority: 'High' | 'Normal'
	date: string
}

const initialAnnouncements: Announcement[] = [
	{ id: 1, title: 'Internal Examination Schedule', message: 'The internal examination timetable has been published. Please review the schedule and inform your assigned sections.', category: 'Academic', audience: 'All students', priority: 'High', date: '25 Sep 2026' },
	{ id: 2, title: 'Department Meeting', message: 'The department meeting will be held on 28 September at 10:00 AM in the conference room.', category: 'Department', audience: 'IT Department', priority: 'Normal', date: '24 Sep 2026' },
	{ id: 3, title: 'College Sports Day', message: 'Sports Day will be held on 05 October. Students can register with their department coordinators.', category: 'Events', audience: 'All students', priority: 'Normal', date: '23 Sep 2026' },
	{ id: 4, title: 'Holiday Notice', message: 'The college will remain closed on 02 October on account of Gandhi Jayanti.', category: 'General', audience: 'College community', priority: 'Normal', date: '22 Sep 2026' },
]

const filters = ['All notices', 'Academic', 'Department', 'Events', 'General'] as const

export default function Announcements({ action }: { action: (message: string) => void }) {
	const [announcements, setAnnouncements] = useState(initialAnnouncements)
	const [filter, setFilter] = useState<(typeof filters)[number]>('All notices')
	const [search, setSearch] = useState('')
	const [composeOpen, setComposeOpen] = useState(false)
	const [draft, setDraft] = useState({ title: '', message: '', category: 'Academic' as AnnouncementCategory, audience: 'All students', priority: 'Normal' as 'High' | 'Normal' })

	const visibleAnnouncements = useMemo(() => {
		const term = search.trim().toLowerCase()
		return announcements.filter((item) => {
			const matchesFilter = filter === 'All notices' || item.category === filter
			const matchesSearch = !term || `${item.title} ${item.message} ${item.audience}`.toLowerCase().includes(term)
			return matchesFilter && matchesSearch
		})
	}, [announcements, filter, search])

	function publishAnnouncement(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const newAnnouncement: Announcement = {
			...draft,
			id: Date.now(),
			date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
		}
		setAnnouncements((current) => [newAnnouncement, ...current])
		setDraft({ title: '', message: '', category: 'Academic', audience: 'All students', priority: 'Normal' })
		setComposeOpen(false)
		action('Announcement published')
	}

	return (
		<div className="inner-page announcements-page">
			<div className="inner-title-row">
				<div><p className="eyebrow">CAMPUS UPDATES</p><h1>Announcements</h1><p>Notices shared with your department and college community.</p></div>
				<button className="primary-button" onClick={() => setComposeOpen(true)}><Plus size={15} /> New announcement</button>
			</div>

			<section className="panel announcements-page-panel">
				<div className="announcements-toolbar">
					<div className="announcements-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements" aria-label="Search announcements" /></div>
					<div className="announcement-filters" role="group" aria-label="Filter announcements">
						{filters.map((item) => <button key={item} className={filter === item ? 'announcement-filter-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
					</div>
				</div>
				<div className="announcement-page-list">
					{visibleAnnouncements.map((item) => (
						<article className="announcement-page-item" key={item.id}>
							<span className={`announcement-page-icon category-${item.category.toLowerCase()}`}><Megaphone size={16} /></span>
							<div className="announcement-page-copy"><div className="announcement-page-title"><h2>{item.title}</h2><span className={`announcement-priority ${item.priority === 'High' ? 'priority-high' : ''}`}>{item.priority === 'High' && <AlertCircle size={11} />}{item.priority}</span></div><p>{item.message}</p><div className="announcement-page-meta"><span>{item.category}</span><span>{item.audience}</span><span><CalendarDays size={12} />{item.date}</span></div></div>
						</article>
					))}
					{visibleAnnouncements.length === 0 && <p className="announcement-empty">No announcements match your search.</p>}
				</div>
				<div className="announcement-page-footer">Showing {visibleAnnouncements.length} of {announcements.length} notices</div>
			</section>

			{composeOpen && (
				<div className="announcement-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposeOpen(false) }}>
					<section className="announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-modal-title">
						<div className="announcement-modal-heading"><div><p className="eyebrow">CAMPUS UPDATES</p><h2 id="announcement-modal-title">New announcement</h2></div><button className="icon-button" aria-label="Close form" onClick={() => setComposeOpen(false)}><X size={17} /></button></div>
						<form onSubmit={publishAnnouncement}>
							<label>Title<input required maxLength={100} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Announcement title" /></label>
							<label>Message<textarea required rows={4} value={draft.message} onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))} placeholder="Write your announcement" /></label>
							<div className="announcement-form-row"><label>Category<select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as AnnouncementCategory }))}>{filters.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>Audience<select value={draft.audience} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))}><option>All students</option><option>IT Department</option><option>Teaching staff</option><option>College community</option></select></label></div>
							<label>Priority<select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as 'High' | 'Normal' }))}><option>Normal</option><option>High</option></select></label>
							<div className="announcement-modal-actions"><button type="button" className="filter-button" onClick={() => setComposeOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Megaphone size={14} /> Publish</button></div>
						</form>
					</section>
				</div>
			)}
		</div>
	)
}
