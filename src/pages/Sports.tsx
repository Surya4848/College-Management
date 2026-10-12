import { useState, type FormEvent } from 'react'
import {
	CalendarDays,
	Clock3,
	MapPin,
	Plus,
	Trophy,
	Users,
	Volleyball,
	X,
} from 'lucide-react'
import './Sports.css'

type Fixture = {
	id: string
	sport: string
	home: string
	opponent: string
	date: string
	time: string
	venue: string
	status: 'Scheduled' | 'Training'
}

const teams = [
	{ name: 'Cricket', team: 'IT Tigers', members: 15, coach: 'P. Saravanan', color: 'green' },
	{ name: 'Football', team: 'IT United', members: 18, coach: 'R. Prakash', color: 'blue' },
	{ name: 'Volleyball', team: 'IT Spikers', members: 12, coach: 'S. Meena', color: 'amber' },
	{ name: 'Badminton', team: 'IT Smash', members: 8, coach: 'K. Anand', color: 'coral' },
]

const initialFixtures: Fixture[] = [
	{ id: 'fixture-1', sport: 'Cricket', home: 'IT Tigers', opponent: 'CS Department', date: '2026-09-30', time: '03:00 PM', venue: 'College Ground', status: 'Scheduled' },
	{ id: 'fixture-2', sport: 'Football', home: 'IT United', opponent: 'ECE Department', date: '2026-10-01', time: '04:00 PM', venue: 'North Field', status: 'Scheduled' },
	{ id: 'fixture-3', sport: 'Volleyball', home: 'IT Spikers', opponent: 'CS Department', date: '2026-10-03', time: '02:00 PM', venue: 'Indoor Court', status: 'Training' },
	{ id: 'fixture-4', sport: 'Badminton', home: 'IT Smash', opponent: 'EEE Department', date: '2026-10-05', time: '10:00 AM', venue: 'Sports Hall', status: 'Scheduled' },
]

const emptyFixture = {
	sport: 'Cricket',
	opponent: '',
	date: '',
	time: '',
	venue: '',
}

export default function Sports({ action }: { action: (message: string) => void }) {
	const [fixtures, setFixtures] = useState(initialFixtures)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [form, setForm] = useState(emptyFixture)

	function addFixture(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const team = teams.find((item) => item.name === form.sport)
		if (!team) return

		setFixtures((current) => [...current, {
			id: `fixture-${Date.now()}`,
			sport: form.sport,
			home: team.team,
			opponent: form.opponent.trim(),
			date: form.date,
			time: form.time,
			venue: form.venue.trim(),
			status: 'Scheduled' as const,
		}].sort((first, second) => first.date.localeCompare(second.date)))
		setForm(emptyFixture)
		setDialogOpen(false)
		action('Sports fixture added')
	}

	return (
		<div className="inner-page sports-page">
			<div className="inner-title-row">
				<div>
					<p className="eyebrow">CAMPUS LIFE</p>
					<h1>Department Sports</h1>
					<p>Manage department teams and upcoming fixtures.</p>
				</div>
				<button className="primary-button" onClick={() => setDialogOpen(true)}><Plus size={15} /> Add fixture</button>
			</div>

			<div className="sports-summary">
				<section><span className="sports-summary-icon summary-sports-blue"><Users size={17} /></span><div><strong>{teams.length}</strong><small>Department teams</small></div></section>
				<section><span className="sports-summary-icon summary-sports-green"><CalendarDays size={17} /></span><div><strong>{fixtures.length}</strong><small>Upcoming fixtures</small></div></section>
				<section><span className="sports-summary-icon summary-sports-amber"><Trophy size={17} /></span><div><strong>53</strong><small>Active athletes</small></div></section>
			</div>

			<section className="sports-section">
				<div className="sports-section-heading"><div><h2>Department teams</h2><p>Registered teams and coordinators</p></div><span>{teams.length} teams</span></div>
				<div className="sports-team-grid">
					{teams.map((team) => (
						<article className="sports-team" key={team.name}>
							<div className={`sports-team-mark team-${team.color}`}><Volleyball size={19} /></div>
							<div className="sports-team-details"><h3>{team.name}</h3><strong>{team.team}</strong><p>{team.members} athletes · Coach {team.coach}</p></div>
							<span className="team-active">Active</span>
						</article>
					))}
				</div>
			</section>

			<section className="panel sports-fixtures-panel">
				<div className="panel-heading"><div className="heading-label"><CalendarDays size={17} /><h2>Upcoming fixtures</h2></div><span className="fixture-count">{fixtures.length} scheduled</span></div>
				<div className="sports-fixture-list">
					{fixtures.map((fixture) => (
						<article className="sports-fixture" key={fixture.id}>
							<div className="fixture-date"><strong>{new Date(`${fixture.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(`${fixture.date}T12:00:00`))}</span></div>
							<div className="fixture-main"><div className="fixture-title"><h3>{fixture.home}</h3><span>vs</span><h3>{fixture.opponent}</h3><small>{fixture.sport}</small></div><div className="fixture-meta"><span><Clock3 size={13} />{fixture.time}</span><span><MapPin size={13} />{fixture.venue}</span></div></div>
							<span className={`fixture-status ${fixture.status === 'Training' ? 'fixture-training' : ''}`}>{fixture.status}</span>
						</article>
					))}
				</div>
			</section>

			{dialogOpen && (
				<div className="sports-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false) }}>
					<section className="sports-dialog" role="dialog" aria-modal="true" aria-labelledby="fixture-dialog-title">
						<div className="sports-dialog-heading"><div><p className="eyebrow">DEPARTMENT SPORTS</p><h2 id="fixture-dialog-title">Add fixture</h2></div><button className="icon-button" aria-label="Close dialog" onClick={() => setDialogOpen(false)}><X size={17} /></button></div>
						<form onSubmit={addFixture}>
							<label>Sport<select value={form.sport} onChange={(event) => setForm((current) => ({ ...current, sport: event.target.value }))}>{teams.map((team) => <option key={team.name}>{team.name}</option>)}</select></label>
							<label>Opponent<input required value={form.opponent} onChange={(event) => setForm((current) => ({ ...current, opponent: event.target.value }))} placeholder="e.g. CS Department" /></label>
							<div className="sports-form-row"><label>Date<input required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label><label>Time<input required type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} /></label></div>
							<label>Venue<input required value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} placeholder="Enter venue" /></label>
							<div className="sports-dialog-actions"><button type="button" className="filter-button" onClick={() => setDialogOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={14} /> Add fixture</button></div>
						</form>
					</section>
				</div>
			)}
		</div>
	)
}
