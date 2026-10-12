import { useMemo, useState, type ChangeEvent } from 'react'
import { ArrowLeft, ChevronRight, Pencil, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'
import './Students.css'

type Student = {
	id: string
	name: string
	program: string
	year: string
	section: string
	attendance: number
	status: 'Active' | 'Review'
	photoUrl?: string
	email?: string
	phone?: string
}

const initialStudents: Student[] = [
	{ id: '23IT001', name: 'Surya M', program: 'B.Tech Information Technology', year: 'III', section: 'A', attendance: 87, status: 'Active', email: 'student@college.edu', phone: 'XXXXX XXXXX' },
	{ id: '23IT014', name: 'R. Nithin', program: 'B.Tech Information Technology', year: 'III', section: 'A', attendance: 88, status: 'Active' },
	{ id: '24IT006', name: 'S. Harini', program: 'B.Tech Information Technology', year: 'II', section: 'B', attendance: 91, status: 'Active' },
	{ id: '24IT021', name: 'M. Pranav', program: 'B.Tech Information Technology', year: 'II', section: 'A', attendance: 76, status: 'Review' },
	{ id: '25IT003', name: 'V. Keerthana', program: 'B.Tech Information Technology', year: 'I', section: 'A', attendance: 97, status: 'Active' },
]

function formatStudentName(name: string) {
	const leadingInitial = name.match(/^([A-Z])\.\s+(.+)$/)
	if (leadingInitial) return `${leadingInitial[2]} ${leadingInitial[1]}.`
	const trailingInitial = name.match(/^(.+)\s+([A-Z])\.?$/)
	return trailingInitial ? `${trailingInitial[1]} ${trailingInitial[2]}.` : name
}

function getStudentInitials(name: string) {
	return formatStudentName(name).replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getSavedStudents(): Student[] {
	try {
		const savedStudents = window.localStorage.getItem('staff-portal-students')
		return savedStudents ? JSON.parse(savedStudents) as Student[] : initialStudents
	} catch {
		return initialStudents
	}
}

export default function Students({ action }: { action: (message: string) => void }) {
	const [students, setStudents] = useState<Student[]>(getSavedStudents)
	const [search, setSearch] = useState('')
	const [year, setYear] = useState('All years')
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
	const [draftStudent, setDraftStudent] = useState<Student | null>(null)
	const [isAddingStudent, setIsAddingStudent] = useState(false)
	const [photoInputKey, setPhotoInputKey] = useState(0)

	const filteredStudents = useMemo(() => {
		const term = search.trim().toLowerCase()
		return students.filter((student) => {
			const matchesYear = year === 'All years' || student.year === year
			const matchesSearch = !term || `${student.id} ${student.name} ${formatStudentName(student.name)} ${student.program} ${student.section}`.toLowerCase().includes(term)
			return matchesYear && matchesSearch
		}).sort((first, second) => formatStudentName(first.name).localeCompare(formatStudentName(second.name), undefined, { sensitivity: 'base' }))
	}, [search, year])

	function openStudentProfile(student: Student) {
		setSelectedStudent(student)
		setDraftStudent(null)
	}

	function closeStudentProfile() {
		setSelectedStudent(null)
		setDraftStudent(null)
		setIsAddingStudent(false)
	}

	function saveStudentProfile() {
		if (!draftStudent) return
		const updatedStudents = isAddingStudent ? [...students, draftStudent] : students.map((student) => student.id === draftStudent.id ? draftStudent : student)
		setStudents(updatedStudents)
		setSelectedStudent(draftStudent)
		setDraftStudent(null)
		setIsAddingStudent(false)
		try {
			window.localStorage.setItem('staff-portal-students', JSON.stringify(updatedStudents))
			action(isAddingStudent ? `Student profile added for ${draftStudent.name}` : `Student profile saved for ${draftStudent.name}`)
		} catch {
			action('Profile updated for this session, but browser storage is unavailable')
		}
	}

	function startAddingStudent() {
		setSelectedStudent(null)
		setIsAddingStudent(true)
		setPhotoInputKey((key) => key + 1)
		setDraftStudent({ id: '', name: '', program: 'B.Tech Information Technology', year: 'I', section: 'A', attendance: 0, status: 'Active' })
	}

	function deleteStudent() {
		if (!selectedStudent || !window.confirm(`Delete ${formatStudentName(selectedStudent.name)}'s profile?`)) return
		const updatedStudents = students.filter((student) => student.id !== selectedStudent.id)
		setStudents(updatedStudents)
		closeStudentProfile()
		try {
			window.localStorage.setItem('staff-portal-students', JSON.stringify(updatedStudents))
			action(`Student profile deleted for ${selectedStudent.name}`)
		} catch {
			action('Profile deleted for this session, but browser storage is unavailable')
		}
	}

	function uploadStudentPhoto(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		if (!file || !draftStudent) return
		if (!file.type.startsWith('image/')) {
			action('Please choose an image file')
			return
		}
		const reader = new FileReader()
		reader.onload = () => setDraftStudent((current) => current ? { ...current, photoUrl: String(reader.result) } : current)
		reader.readAsDataURL(file)
	}

	const detailStudent = draftStudent ?? selectedStudent
	if (!detailStudent) return null

	return (
		<div className="inner-page students-page">
			<header className="student-directory-page-header">
				<div><p className="eyebrow">ALL STUDENTS</p><h1>All Students</h1><p>Students assigned to your department</p></div>
				<button className="primary-button student-add-button" onClick={startAddingStudent}><Plus size={15} /> Add student</button>
			</header>

			<section className="panel student-directory-panel" aria-label="Student directory">
				<div className="students-toolbar">
					<div className="students-search">
						<Search size={15} aria-hidden="true" />
						<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, ID, or section" aria-label="Search students" />
					</div>
					<label className="students-year-filter"><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filter students by year"><option>All years</option><option>I</option><option>II</option><option>III</option><option>IV</option></select></label>
				</div>
				<section className="student-profile-grid" aria-label="Student profiles" aria-live="polite">
					{filteredStudents.map((student) => <button className="student-profile-card btn-secondary" key={student.id} aria-label={`Open profile for ${formatStudentName(student.name)}, ${student.id}`} onClick={() => openStudentProfile(student)}>
						<span className="student-card-photo">{student.photoUrl ? <img src={student.photoUrl} alt="" loading="lazy" /> : <span className="student-card-photo-placeholder" aria-hidden="true">{getStudentInitials(student.name)}</span>}</span>
						<span className="student-card-copy"><strong>{formatStudentName(student.name)}</strong><small>{student.id}</small><small>{student.year} Year · Section {student.section} · {student.attendance}%</small></span>
						<ChevronRight size={16} aria-hidden="true" />
					</button>)}
					{filteredStudents.length === 0 && <p className="student-grid-empty">No students match these filters.</p>}
				</section>
				<div className="student-directory-footer" aria-live="polite"><span>Showing {filteredStudents.length} of {students.length} profiles</span></div>
			</section>
			{(selectedStudent || draftStudent) && <div className="student-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeStudentProfile() }}>
				<section className="student-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="student-detail-title">
					{draftStudent ? <div className="student-detail-heading"><div><p className="eyebrow">{isAddingStudent ? 'ADD STUDENT' : 'EDIT STUDENT'}</p><h2 id="student-detail-title">{formatStudentName(draftStudent.name) || 'New student'}</h2></div><button className="icon-button" aria-label="Close student details" onClick={closeStudentProfile}><X size={17} /></button></div> : <div className="student-profile-heading"><button className="student-profile-back btn-ghost" onClick={closeStudentProfile}><ArrowLeft size={15} /> Back to All Students</button><button className="icon-button" aria-label="Close student details" onClick={closeStudentProfile}><X size={17} /></button></div>}
					{draftStudent ? <div className="student-edit-fields">
						<div className="student-photo-editor"><div className="student-edit-photo">{draftStudent.photoUrl ? <img src={draftStudent.photoUrl} alt="Student profile preview" /> : getStudentInitials(draftStudent.name) || '?'}</div><label className="student-upload-button"><Upload size={14} /> Upload picture<input key={photoInputKey} type="file" accept="image/*" onChange={uploadStudentPhoto} /></label></div>
						<label>Student name<input value={draftStudent.name} onChange={(event) => setDraftStudent({ ...draftStudent, name: event.target.value })} required /></label>
						<label>Register number<input value={draftStudent.id} onChange={(event) => setDraftStudent({ ...draftStudent, id: event.target.value })} required /></label>
						<label>Program<input value={draftStudent.program} onChange={(event) => setDraftStudent({ ...draftStudent, program: event.target.value })} /></label>
						<div className="student-edit-row"><label>Year<select value={draftStudent.year} onChange={(event) => setDraftStudent({ ...draftStudent, year: event.target.value })}><option>I</option><option>II</option><option>III</option><option>IV</option></select></label><label>Section<select value={draftStudent.section} onChange={(event) => setDraftStudent({ ...draftStudent, section: event.target.value })}><option>A</option><option>B</option><option>C</option></select></label></div>
						<div className="student-edit-row"><label>Attendance (%)<input type="number" min="0" max="100" value={draftStudent.attendance} onChange={(event) => setDraftStudent({ ...draftStudent, attendance: Number(event.target.value) })} /></label><label>Status<select value={draftStudent.status} onChange={(event) => setDraftStudent({ ...draftStudent, status: event.target.value as Student['status'] })}><option>Active</option><option>Review</option></select></label></div>
						<label>Email<input type="email" value={draftStudent.email ?? ''} onChange={(event) => setDraftStudent({ ...draftStudent, email: event.target.value })} placeholder="student@college.edu" /></label>
						<label>Phone<input value={draftStudent.phone ?? ''} onChange={(event) => setDraftStudent({ ...draftStudent, phone: event.target.value })} placeholder="XXXXX XXXXX" /></label>
					</div> : <>
						<div className="student-profile-hero">
							{detailStudent.photoUrl ? <img src={detailStudent.photoUrl} alt={`${formatStudentName(detailStudent.name)} profile`} /> : <div className="student-profile-photo-placeholder" role="img" aria-label={`No profile photo available for ${formatStudentName(detailStudent.name)}`}>{getStudentInitials(detailStudent.name)}</div>}
							<h2 id="student-detail-title">{formatStudentName(detailStudent.name)}</h2>
							<span>{detailStudent.id}</span>
						</div>
						<dl className="student-profile-details">
							<div><dt>Program</dt><dd>{detailStudent.program.replace('Information Technology', 'IT')}</dd></div>
							<div><dt>Year</dt><dd>{detailStudent.year} Year</dd></div>
							<div><dt>Section</dt><dd>{detailStudent.section}</dd></div>
							<div><dt>Attendance</dt><dd>{detailStudent.attendance}%</dd></div>
							<div><dt>Status</dt><dd className={`profile-status-${detailStudent.status.toLowerCase()}`}>{detailStudent.status}</dd></div>
						</dl>
					</>}
					<div className={`student-detail-actions${draftStudent ? '' : ' student-profile-actions'}`}>{draftStudent ? <><button className="filter-button" onClick={() => { setDraftStudent(null); setIsAddingStudent(false) }}>Cancel</button><button className="primary-button" disabled={!draftStudent.name.trim() || !draftStudent.id.trim() || !draftStudent.program.trim()} onClick={saveStudentProfile}><Save size={14} /> {isAddingStudent ? 'Add Student' : 'Save Student'}</button></> : <><button className="student-delete-button" onClick={deleteStudent}><Trash2 size={14} /> Delete</button><button className="primary-button" onClick={() => { if (!selectedStudent) return; setIsAddingStudent(false); setDraftStudent({ ...selectedStudent, name: formatStudentName(selectedStudent.name) }) }}><Pencil size={14} /> Edit Student</button></>}</div>
				</section>
			</div>}
		</div>
	)
}
