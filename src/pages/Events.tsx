import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Clock3, MapPin, Plus, Sparkles } from 'lucide-react'
import './Events.css'

type EventCategory = 'Academic' | 'Cultural' | 'Workshop'
type CampusEvent = {
	id: number
	title: string
	category: EventCategory
	date: string
	time: string
	location: string
	description: string
	image: string
}

const eventImages: Record<EventCategory, string> = {
	Academic: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
	Cultural: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
	Workshop: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
}

const initialEvents: CampusEvent[] = [
	{ id: 1, title: 'Technical Symposium 2026', category: 'Academic', date: '2026-10-10', time: '10:00', location: 'Seminar Hall', description: 'A day of student projects, technical talks, and department showcases.', image: eventImages.Academic },
	{ id: 2, title: 'Cultural Fest', category: 'Cultural', date: '2026-10-25', time: '16:00', location: 'Main Auditorium', description: 'Performances and activities organized by the Cultural Committee.', image: eventImages.Cultural },
	{ id: 3, title: 'Cloud Computing Workshop', category: 'Workshop', date: '2026-10-18', time: '09:30', location: 'Computer Lab 2', description: 'Hands-on introduction to cloud architecture and deployment.', image: eventImages.Workshop },
]

const categories = ['All events', 'Academic', 'Cultural', 'Workshop'] as const

function displayDate(date: string) {
	return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

export default function Events({ action }: { action: (message: string) => void }) {
	const [events, setEvents] = useState(initialEvents)
	const [category, setCategory] = useState<(typeof categories)[number]>('All events')
	const [formOpen, setFormOpen] = useState(false)
	const [form, setForm] = useState({ title: '', category: 'Academic' as EventCategory, date: '', time: '', location: '', description: '' })

	const visibleEvents = useMemo(() => {
		return events
			.filter((event) => category === 'All events' || event.category === category)
			.sort((first, second) => first.date.localeCompare(second.date))
	}, [category, events])

	function addEvent(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const newEvent: CampusEvent = { ...form, id: Date.now(), image: eventImages[form.category] }
		setEvents((current) => [...current, newEvent])
		setForm({ title: '', category: 'Academic', date: '', time: '', location: '', description: '' })
		setFormOpen(false)
		action('Event added to the calendar')
	}

	return (
		<div className="inner-page events-page">
			<div className="inner-title-row">
				<div><p className="eyebrow">CAMPUS CALENDAR</p><h1>Events</h1><p>Discover upcoming academic and campus events.</p></div>
				<button className="primary-button" onClick={() => setFormOpen(true)}><Plus size={15} /> Add event</button>
			</div>

			<div className="events-page-toolbar">
				<div className="events-category-filters" role="group" aria-label="Filter events by category">
					{categories.map((item) => <button key={item} className={category === item ? 'events-filter-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
				</div>
				<span>{visibleEvents.length} events</span>
			</div>

			<div className="events-page-grid">
				{visibleEvents.map((event) => (
					<article className="events-page-card" key={event.id}>
						<div className="events-image-wrap"><img src={event.image} alt={`${event.title} event`} /><span>{event.category}</span></div>
						<div className="events-card-content">
							<h2>{event.title}</h2>
							<p className="events-card-description">{event.description}</p>
							<div className="events-card-meta"><span><CalendarDays size={13} />{displayDate(event.date)}</span><span><Clock3 size={13} />{event.time}</span><span><MapPin size={13} />{event.location}</span></div>
							<button className="events-card-action" onClick={() => action(`${event.title} selected`)}>View details <Sparkles size={13} /></button>
						</div>
					</article>
				))}
				{visibleEvents.length === 0 && <p className="events-empty">No events in this category.</p>}
			</div>

			{formOpen && (
				<div className="events-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
					<section className="events-modal" role="dialog" aria-modal="true" aria-labelledby="add-event-title">
						<div className="events-modal-heading"><div><p className="eyebrow">CAMPUS CALENDAR</p><h2 id="add-event-title">Add event</h2></div><button className="icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}>×</button></div>
						<form onSubmit={addEvent}>
							<label>Event name<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Enter event name" /></label>
							<label>Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as EventCategory }))}><option>Academic</option><option>Cultural</option><option>Workshop</option></select></label>
							<div className="events-form-row"><label>Date<input required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label><label>Time<input required type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} /></label></div>
							<label>Location<input required value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Enter venue" /></label>
							<label>Description<textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Add a short description" /></label>
							<div className="events-modal-actions"><button type="button" className="filter-button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={14} /> Add event</button></div>
						</form>
					</section>
				</div>
			)}
		</div>
	)
}
