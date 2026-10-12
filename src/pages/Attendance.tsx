import { useMemo, useState } from 'react'
import { Check, CheckCheck, ClipboardCheck, Search, Save, X } from 'lucide-react'
import './Attendance.css'

type AttendanceStatus = 'Unmarked' | 'Present' | 'Absent'
type StudentAttendance = { id: string; name: string; section: 'A' | 'B'; status: AttendanceStatus }

const initialRoster: StudentAttendance[] = [
	{ id: '23IT001', name: 'A. Kavya', section: 'A', status: 'Unmarked' },
	{ id: '23IT014', name: 'R. Nithin', section: 'A', status: 'Unmarked' },
	{ id: '23IT019', name: 'P. Sanjay', section: 'A', status: 'Unmarked' },
	{ id: '23IT027', name: 'D. Nivetha', section: 'A', status: 'Unmarked' },
	{ id: '23IT008', name: 'M. Dharun', section: 'B', status: 'Unmarked' },
	{ id: '23IT031', name: 'K. Yazhini', section: 'B', status: 'Unmarked' },
	{ id: '23IT036', name: 'V. Karthik', section: 'B', status: 'Unmarked' },
	{ id: '23IT044', name: 'S. Priya', section: 'B', status: 'Unmarked' },
]

export default function Attendance({ action }: { action: (message: string) => void }) {
	const [roster, setRoster] = useState(initialRoster)
	const [section, setSection] = useState('All sections')
	const [search, setSearch] = useState('')
	const [date, setDate] = useState('2026-09-26')
	const [saved, setSaved] = useState(false)

	const visibleRoster = useMemo(() => {
		const term = search.trim().toLowerCase()
		return roster.filter((student) => {
			const matchesSection = section === 'All sections' || student.section === section
			const matchesSearch = !term || `${student.id} ${student.name}`.toLowerCase().includes(term)
			return matchesSection && matchesSearch
		})
	}, [roster, search, section])

	const presentCount = visibleRoster.filter((student) => student.status === 'Present').length
	const absentCount = visibleRoster.filter((student) => student.status === 'Absent').length
	const unmarkedCount = visibleRoster.filter((student) => student.status === 'Unmarked').length

	function setStudentStatus(id: string, status: AttendanceStatus) {
		setRoster((current) => current.map((student) => student.id === id ? { ...student, status } : student))
		setSaved(false)
	}

	function markAllPresent() {
		const visibleIds = new Set(visibleRoster.map((student) => student.id))
		setRoster((current) => current.map((student) => visibleIds.has(student.id) ? { ...student, status: 'Present' } : student))
		setSaved(false)
	}

	function clearVisible() {
		const visibleIds = new Set(visibleRoster.map((student) => student.id))
		setRoster((current) => current.map((student) => visibleIds.has(student.id) ? { ...student, status: 'Unmarked' } : student))
		setSaved(false)
	}

	function saveAttendance() {
		setSaved(true)
		action('Attendance saved for the selected date')
	}

	return (
		<div className="inner-page attendance-page">
			<div className="inner-title-row">
				<div><p className="eyebrow">CLASS RECORDS</p><h1>Attendance</h1><p>Record attendance for your assigned students.</p></div>
				<button className="primary-button" onClick={saveAttendance}><Save size={14} /> Save attendance</button>
			</div>

			<div className="attendance-summary">
				<section><span className="attendance-summary-mark mark-present"><Check size={16} /></span><div><strong>{presentCount}</strong><small>Present</small></div></section>
				<section><span className="attendance-summary-mark mark-absent"><X size={16} /></span><div><strong>{absentCount}</strong><small>Absent</small></div></section>
				<section><span className="attendance-summary-mark mark-unmarked"><ClipboardCheck size={16} /></span><div><strong>{unmarkedCount}</strong><small>Unmarked</small></div></section>
			</div>

			<section className="panel attendance-panel">
				<div className="attendance-toolbar">
					<div className="attendance-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or student ID" aria-label="Search students" /></div>
					<div className="attendance-filters"><label>Date<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSaved(false) }} /></label><label>Section<select value={section} onChange={(event) => setSection(event.target.value)}><option>All sections</option><option value="A">Section A</option><option value="B">Section B</option></select></label></div>
				</div>
				<div className="attendance-action-row"><span>{visibleRoster.length} students</span><div><button onClick={markAllPresent}><CheckCheck size={13} /> Mark all present</button><button onClick={clearVisible}><X size={13} /> Clear</button></div></div>
				<div className="table-scroll"><table className="records-table attendance-table"><thead><tr><th>STUDENT</th><th>SECTION</th><th>ATTENDANCE STATUS</th></tr></thead><tbody>
					{visibleRoster.map((student) => <tr key={student.id}><td><div className="attendance-student"><strong>{student.name}</strong><small>{student.id}</small></div></td><td>B.Tech IT · {student.section}</td><td><div className="attendance-status-actions"><button className={student.status === 'Present' ? 'status-selected status-present' : ''} onClick={() => setStudentStatus(student.id, 'Present')} aria-pressed={student.status === 'Present'}><Check size={13} /> Present</button><button className={student.status === 'Absent' ? 'status-selected status-absent' : ''} onClick={() => setStudentStatus(student.id, 'Absent')} aria-pressed={student.status === 'Absent'}><X size={13} /> Absent</button><span className={`attendance-current current-${student.status.toLowerCase()}`}>{student.status}</span></div></td></tr>)}
					{visibleRoster.length === 0 && <tr><td className="attendance-empty" colSpan={3}>No students match your search.</td></tr>}
				</tbody></table></div>
				<div className="attendance-footer"><span>{saved ? 'Attendance saved' : `Attendance for ${date}`}</span><span>{presentCount + absentCount} of {visibleRoster.length} marked</span></div>
			</section>
			{saved && <p className="attendance-saved-note" role="status"><Check size={14} /> Attendance saved for this session.</p>}
		</div>
	)
}
