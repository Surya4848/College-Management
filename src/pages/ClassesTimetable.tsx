import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react'
import { weekdays, weeklyClasses } from '../timetableData'
import './ClassesTimetable.css'


function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat('en-GB', options).format(date)
}

function startOfWeek(date: Date) {
	const weekday = date.getDay() || 7
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday + 1)
}

export default function ClassesTimetable({ focusedClass }: { focusedClass?: { classId: string; dayIndex: number } | null }) {
	const [dayIndex, setDayIndex] = useState(focusedClass?.dayIndex ?? Math.max(0, Math.min(4, (new Date().getDay() || 7) - 1)))
	const [weekOffset, setWeekOffset] = useState(0)
	const [typeFilter, setTypeFilter] = useState('All types')

	const [focusId, setFocusId] = useState(focusedClass?.classId ?? '')
	const weekStart = startOfWeek(new Date())
	weekStart.setDate(weekStart.getDate() + weekOffset * 7)
	const selectedDate = new Date(weekStart)
	selectedDate.setDate(weekStart.getDate() + dayIndex)
	const weekEnd = new Date(weekStart)
	weekEnd.setDate(weekStart.getDate() + 4)

	const sessions = useMemo(() => {
		const daySessions = weeklyClasses[dayIndex] ?? []
		return daySessions.filter((session) => typeFilter === 'All types' || session.type === typeFilter)
	}, [dayIndex, typeFilter])
	const focusedSession = sessions.find((session) => session.id === focusId)

	useEffect(() => {
		if (!focusedClass) return
		setDayIndex(focusedClass.dayIndex)
		setFocusId(focusedClass.classId)
		setTypeFilter('All types')
	}, [focusedClass])

	function changeWeek(offset: number) {
		setWeekOffset((current) => current + offset)
	}

	return (
		<div className="inner-page timetable-page">
			<div className="inner-title-row">
				<div><p className="eyebrow">TEACHING SCHEDULE</p><h1>Classes &amp; Timetable</h1><p>Your assigned classes, sessions, and teaching locations.</p></div>
				<div className="timetable-week-nav"><button className="icon-button" aria-label="Previous week" onClick={() => changeWeek(-1)}><ChevronLeft size={17} /></button><span>{formatDate(weekStart, { day: '2-digit', month: 'short' })} – {formatDate(weekEnd, { day: '2-digit', month: 'short', year: 'numeric' })}</span><button className="icon-button" aria-label="Next week" onClick={() => changeWeek(1)}><ChevronRight size={17} /></button></div>
			</div>

			<section className="panel timetable-week-panel">
				<div className="timetable-day-tabs" role="tablist" aria-label="Weekday">
					{weekdays.map((day, index) => {
						const date = new Date(weekStart)
						date.setDate(weekStart.getDate() + index)
						return <button role="tab" aria-selected={dayIndex === index} className={dayIndex === index ? 'timetable-day-active' : ''} key={day} onClick={() => setDayIndex(index)}><span>{day.slice(0, 3)}</span><strong>{formatDate(date, { day: '2-digit' })}</strong></button>
					})}
				</div>

				<div className="timetable-list-heading"><div><h2>{weekdays[dayIndex]} classes</h2><p>{formatDate(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><label>Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All types</option><option>Lecture</option><option>Practical</option><option>Tutorial</option></select></label></div>

				{focusedSession && <div className="timetable-focus-note"><strong>Class notification</strong><span>{focusedSession.subject} · {focusedSession.section} · {focusedSession.room} · {focusedSession.time}</span></div>}
				{sessions.length ? <div className="timetable-session-list">{sessions.map((session) => <article className={`timetable-session ${session.id === focusId ? 'timetable-session-focused' : ''}`} key={session.id}>
					<div className="timetable-session-time"><Clock3 size={14} /><span>{session.time}</span></div>
					<div className="timetable-session-main"><div className="timetable-session-title"><h3>{session.subject}</h3><span className={`session-type type-${session.type.toLowerCase()}`}>{session.type}</span></div><div className="timetable-session-meta"><span><CalendarDays size={13} />{session.section}</span><span><MapPin size={13} />{session.room}</span></div></div>
				</article>)}</div> : <div className="timetable-empty">No classes match this day and type.</div>}
			</section>

			<div className="timetable-note"><CalendarDays size={14} /><span>Times are shown in local campus time. Contact the department office for schedule changes.</span></div>
		</div>
	)
}
