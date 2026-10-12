import { useEffect, useMemo, useRef, useState } from 'react'
import MyProfile, { getSavedProfile, type ProfileData } from './pages/MyProfile'
import LoginPage from './pages/LoginPage'
import RoleDashboard, { type PortalRole } from './pages/RoleDashboard'
import StaffProfile, { getSavedStaffProfile, type StaffProfileData } from './pages/StaffProfile'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StaffActivity from './pages/StaffActivity'
import Sports from './pages/Sports'
import SettingsPage from './pages/Settings'
import NotificationsPage from './pages/Notifications'
import Gallery from './pages/Gallery'
import EventsPage from './pages/Events'
import ClassesTimetablePage from './pages/ClassesTimetable'
import AttendancePage from './pages/Attendance'
import AnnouncementsPage from './pages/Announcements'
import PublicPages from './pages/PublicPages'
import { updatePageMetadata } from './pageMetadata'
import { staffTimetable, weekdays } from './timetableData'
import { getDueClassNotifications, type ClassNotification } from './classNotifications'
import type { LucideIcon } from 'lucide-react'
import {
  Activity, Award, ArrowLeft, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, Clock3,
  ClipboardCheck, FileText, Image, LayoutDashboard,
  Megaphone, Menu, Search, Settings, ShieldCheck, SlidersHorizontal,
  LogOut, Sparkles, UserRound, Users, Volleyball, X,
} from 'lucide-react'

type ViewName = 'Dashboard' | 'My Profile' | 'Staff Profile' | 'Students' | 'Attendance' | 'Classes & Timetable' | 'Announcements' | 'Events' | 'Sports' | 'Gallery' | 'Notifications' | 'Staff Activity' | 'Settings'
type ViewHistoryEntry = { view: ViewName; isMainView: boolean }
type NavItem = { label: ViewName; icon: LucideIcon }
type AuthRole = 'principal' | 'hod' | 'staff' | 'student'

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'My Profile', icon: UserRound },
  { label: 'Staff Profile', icon: BriefcaseBusiness },
  { label: 'Students', icon: Users },
  { label: 'Attendance', icon: ClipboardCheck },
  { label: 'Classes & Timetable', icon: CalendarDays },
  { label: 'Announcements', icon: Megaphone },
  { label: 'Events', icon: Sparkles },
  { label: 'Sports', icon: Volleyball },
  { label: 'Gallery', icon: Image },
  { label: 'Notifications', icon: Bell },
  { label: 'Staff Activity', icon: Activity },
  { label: 'Settings', icon: Settings },
]

const announcements = [
  { title: 'Internal Examination Schedule', meta: '25 Sep 2026  ·  Examination Cell', text: 'The internal examination timetable has been published.', tone: 'coral', tag: 'High' },
  { title: 'Department Meeting', meta: '28 Sep 2026  ·  IT Department', text: 'Department meeting on 28 Sep 2026 at 10:00 AM.', tone: 'blue', tag: 'Medium' },
  { title: 'College Sports Day', meta: '30 Sep 2026  ·  Sports Cell', text: 'Sports Day will be held on 05 Oct 2026. All students are invited.', tone: 'green', tag: 'Low' },
  { title: 'Holiday Notice', meta: '02 Oct 2026  ·  Principal Office', text: 'College will remain closed on 02 Oct (Gandhi Jayanti).', tone: 'violet', tag: 'General' },
  { title: 'Workshop on Cloud Computing', meta: '18 Oct 2026  ·  CSE Department', text: 'Workshop on Cloud Computing on 18 Oct 2026.', tone: 'amber', tag: 'Medium' },
]

const activity = [
  { icon: Megaphone, text: 'Posted IT department announcement', time: '2 hours ago', tone: 'blue' },
  { icon: Check, text: 'Marked attendance for B.Tech IT · A', time: '4 hours ago', tone: 'green' },
  { icon: CalendarDays, text: 'Added Technical Symposium event', time: '1 day ago', tone: 'blue' },
  { icon: Award, text: 'Updated student achievement', time: '1 day ago', tone: 'violet' },
  { icon: Image, text: 'Viewed student profile (23IT001)', time: '2 days ago', tone: 'violet' },
]

const viewContent: Record<Exclude<ViewName, 'Dashboard'>, { eyebrow: string; title: string; description: string; columns: string[]; rows: string[][] }> = {
  'My Profile': { eyebrow: 'STAFF ACCOUNT', title: 'My Profile', description: 'Your staff identity and department details.', columns: ['DETAIL', 'INFORMATION'], rows: [['Full name', 'Dr. Arun Kumar'], ['Staff ID', 'SBCIT-FAC-001'], ['Designation', 'Assistant Professor'], ['Department', 'Information Technology'], ['Email', 'arun.kumar@college.edu'], ['Office', 'Block A · Room 204']] },
  'Staff Profile': { eyebrow: 'FACULTY ACCOUNT', title: 'Staff Profile', description: 'Faculty profile and role information.', columns: ['DETAIL', 'INFORMATION'], rows: [['Full name', 'Dr. Arun Kumar'], ['Staff ID', 'SBCIT-FAC-001'], ['Designation', 'Assistant Professor'], ['Department', 'Information Technology'], ['Email', 'arun.kumar@college.edu'], ['Office', 'Block A · Room 204']] },
  Students: { eyebrow: 'ACADEMIC RECORDS', title: 'Students', description: 'Browse student records in the Information Technology department.', columns: ['STUDENT', 'PROGRAM', 'YEAR', 'ATTENDANCE', 'STATUS'], rows: [['23IT001 · A. Kavya', 'B.Tech IT', 'III', '94%', 'Active'], ['23IT014 · R. Nithin', 'B.Tech IT', 'III', '88%', 'Active'], ['24IT006 · S. Harini', 'B.Tech IT', 'II', '91%', 'Active'], ['24IT021 · M. Pranav', 'B.Tech IT', 'II', '76%', 'Review'], ['25IT003 · V. Keerthana', 'B.Tech IT', 'I', '97%', 'Active']] },
  Attendance: { eyebrow: 'CLASS RECORDS', title: 'Attendance', description: 'Daily attendance overview for your assigned sections.', columns: ['DATE', 'CLASS / SECTION', 'PRESENT', 'ABSENT', 'RATE'], rows: [['26 Sep 2026', 'B.Tech IT · A', '28', '2', '93.3%'], ['26 Sep 2026', 'B.Tech IT · B', '26', '3', '89.7%'], ['25 Sep 2026', 'B.Tech IT · A', '29', '1', '96.7%'], ['25 Sep 2026', 'B.Tech IT · B', '27', '2', '93.1%']] },
  'Classes & Timetable': { eyebrow: 'TEACHING SCHEDULE', title: 'Classes & Timetable', description: 'Your teaching schedule.', columns: ['DAY', 'TIME', 'SUBJECT', 'CLASS / SECTION', 'ROOM', 'TYPE'], rows: staffTimetable.map((row) => [weekdays[row.dayIndex], row.time, row.subject, row.section, row.room, row.type]) },
  Announcements: { eyebrow: 'CAMPUS UPDATES', title: 'Announcements', description: 'Notices and updates shared with the college community.', columns: ['ANNOUNCEMENT', 'PUBLISHED', 'AUDIENCE', 'PRIORITY'], rows: announcements.map((item) => [item.title, item.meta.split('  ·  ')[0], 'College community', item.tag]) },
  Events: { eyebrow: 'CAMPUS CALENDAR', title: 'Events', description: 'Upcoming academic and campus events.', columns: ['EVENT', 'DATE', 'TIME', 'VENUE', 'ORGANIZER'], rows: [['Technical Symposium 2026', '10 Oct 2026', '10:00 AM', 'Seminar Hall', 'IT Department'], ['Cultural Fest', '25 Oct 2026', '04:00 PM', 'Main Auditorium', 'Cultural Committee'], ['Cloud Computing Workshop', '18 Oct 2026', '09:30 AM', 'Lab Complex', 'CSE Department']] },
  Sports: { eyebrow: 'CAMPUS LIFE', title: 'Department Sports', description: 'Teams, fixtures, and activities from the department.', columns: ['SPORT', 'TEAM', 'NEXT FIXTURE', 'VENUE', 'STATUS'], rows: [['Cricket', 'IT Tigers', '30 Sep · 03:00 PM', 'College Ground', 'Ready'], ['Football', 'IT United', '01 Oct · 04:00 PM', 'North Field', 'Ready'], ['Volleyball', 'IT Spikers', '03 Oct · 02:00 PM', 'Indoor Court', 'Training'], ['Badminton', 'IT Smash', '05 Oct · 10:00 AM', 'Sports Hall', 'Ready']] },
  Gallery: { eyebrow: 'CAMPUS MOMENTS', title: 'Gallery', description: 'Recent moments from department events and campus life.', columns: ['ALBUM', 'EVENT DATE', 'PHOTOS', 'ADDED BY'], rows: [['Orientation 2026', '12 Aug 2026', '24 photos', 'Student Affairs'], ['Innovation Showcase', '08 Sep 2026', '38 photos', 'IT Department'], ['Independence Day', '15 Aug 2026', '16 photos', 'College Office']] },
  Notifications: { eyebrow: 'YOUR INBOX', title: 'Notifications', description: 'Updates that may need your attention.', columns: ['NOTIFICATION', 'RECEIVED', 'CATEGORY', 'STATUS'], rows: [['Attendance submission closes at 5 PM', 'Today · 11:20 AM', 'Reminder', 'Unread'], ['Department meeting · 28 Sep, 10:00 AM', 'Today · 09:05 AM', 'Meeting', 'Unread'], ['New examination schedule published', 'Yesterday · 03:30 PM', 'Academic', 'Read'], ['Event approval confirmed: Technical Symposium', '24 Sep · 01:12 PM', 'Events', 'Read']] },
  'Staff Activity': { eyebrow: 'WORKSPACE HISTORY', title: 'Staff Activity', description: 'Recent actions across your staff workspace.', columns: ['ACTIVITY', 'WHEN', 'AREA', 'DETAIL'], rows: activity.map((item, index) => [item.text, item.time, ['Announcements', 'Attendance', 'Events', 'Achievements', 'Students'][index], 'Completed']) },
  Settings: { eyebrow: 'PREFERENCES', title: 'Settings', description: 'Manage your profile and workspace preferences.', columns: ['PREFERENCE', 'CURRENT SETTING', 'ACTION'], rows: [['Email notifications', 'Enabled', 'Manage'], ['Attendance reminders', 'Daily · 04:30 PM', 'Manage'], ['Language', 'English', 'Change'], ['Password', 'Last updated 12 Aug 2026', 'Update']] },
}

function getSavedClassNotifications(): ClassNotification[] {
  try {
    const saved = window.localStorage.getItem('staff-portal-class-notifications')
    return saved ? JSON.parse(saved) as ClassNotification[] : []
  } catch {
    return []
  }
}

export function PortalApp({ onLogout, account }: { onLogout: () => Promise<void>; account: { displayName: string; email: string; collegeName: string; department?: string; staffType?: 'in-charge' | 'staff' } }) {
  const [currentView, setCurrentView] = useState<ViewName>('Dashboard')
  const [viewHistory, setViewHistory] = useState<ViewHistoryEntry[]>([])
  const [isMainView, setIsMainView] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [classNotifications, setClassNotifications] = useState<ClassNotification[]>(getSavedClassNotifications)
  const [focusedClass, setFocusedClass] = useState<{ classId: string; dayIndex: number } | null>(null)
  const [search, setSearch] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [notice, setNotice] = useState('')
  const [staffProfile, setStaffProfile] = useState<ProfileData>(() => ({ ...getSavedProfile(), name: account.displayName, email: account.email, department: account.department || '', designation: account.staffType === 'in-charge' ? 'In-Charge' : 'Staff', staffId: '' }))
  const [staffRoleProfile, setStaffRoleProfile] = useState<StaffProfileData>(() => ({ ...getSavedStaffProfile(), name: account.displayName, email: account.email, department: account.department || '', designation: account.staffType === 'in-charge' ? 'In-Charge' : 'Staff', staffId: '' }))
  const sentClassNotificationIds = useRef(new Set(classNotifications.map((item) => item.id)))

  useEffect(() => {
    const descriptions: Record<ViewName, string> = {
      Dashboard: 'Staff dashboard with student, attendance, timetable, event, and department updates.',
      'My Profile': 'View and update your staff account and contact details.',
      'Staff Profile': 'View your faculty profile and role information.',
      Students: 'Browse assigned student profiles, academic details, and attendance.',
      Attendance: 'Record and review attendance for assigned classes.',
      'Classes & Timetable': 'View staff class schedules, sections, rooms, and times.',
      Announcements: 'Read and publish college and department announcements.',
      Events: 'Browse and manage upcoming campus events.',
      Sports: 'View department sports teams and upcoming fixtures.',
      Gallery: 'Browse campus, academic, and event photos.',
      Notifications: 'View staff account, timetable, and college notifications.',
      'Staff Activity': 'Review recent activity across your staff workspace.',
      Settings: 'Manage staff portal notification and workspace preferences.',
    }
    const dashboardTitle = account.staffType === 'in-charge' ? 'In-Charge Dashboard' : 'Staff Dashboard'
    const pageTitle = currentView === 'Dashboard' ? dashboardTitle : currentView === 'Staff Profile' && account.staffType === 'in-charge' ? 'In-Charge Profile' : currentView
    const pageDescription = currentView === 'Staff Profile' && account.staffType === 'in-charge'
      ? 'View and maintain your In-Charge identity, department assignment, and contact details.'
      : descriptions[currentView]
    updatePageMetadata(pageTitle, pageDescription)
  }, [account.staffType, currentView])

  useEffect(() => {
    function checkClassSchedule() {
      const dueNotifications = getDueClassNotifications(new Date())
      const newNotifications = dueNotifications.filter((item) => !sentClassNotificationIds.current.has(item.id))
      if (!newNotifications.length) return

      newNotifications.forEach((item) => sentClassNotificationIds.current.add(item.id))
      setClassNotifications((current) => {
        const updated = [...newNotifications, ...current].slice(0, 50)
        try {
          window.localStorage.setItem('staff-portal-class-notifications', JSON.stringify(updated))
        } catch {
          // The notification remains available for this app session.
        }
        return updated
      })
      setNotice(newNotifications[0].title)
      window.setTimeout(() => setNotice(''), 3500)
    }

    checkClassSchedule()
    const timer = window.setInterval(checkClassSchedule, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    return [
      ...navigation.filter((item) => item.label.toLowerCase().includes(term)).map((item) => ({ label: item.label, detail: 'Portal page', view: item.label })),
      ...announcements.filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(term)).map((item) => ({ label: item.title, detail: 'Announcement', view: 'Announcements' as ViewName })),
      ...staffTimetable.filter((item) => `${item.subject} ${item.section}`.toLowerCase().includes(term)).map((item) => ({ label: item.subject, detail: `${weekdays[item.dayIndex]} · ${item.time} · ${item.section}`, view: 'Classes & Timetable' as ViewName })),
    ].slice(0, 5)
  }, [search])

  function goTo(view: ViewName, mainView = false) {
    const nextIsMainView = view === 'Dashboard' || mainView
    if (view !== currentView || nextIsMainView !== isMainView) {
      setViewHistory((history) => [...history, { view: currentView, isMainView }])
      setCurrentView(view)
    }
    setIsMainView(nextIsMainView)
    setSidebarOpen(false)
    setSidebarCollapsed(false)
    if (view !== 'Classes & Timetable') setFocusedClass(null)
    setShowSearchResults(false)
    setNotice('')
  }

  function markClassNotificationRead(id: string) {
    const updated = classNotifications.map((item) => item.id === id ? { ...item, unread: false } : item)
    setClassNotifications(updated)
    try {
      window.localStorage.setItem('staff-portal-class-notifications', JSON.stringify(updated))
    } catch {
      action('Notification marked read for this session')
    }
  }

  function openClassNotification(item: ClassNotification) {
    markClassNotificationRead(item.id)
    setFocusedClass({ classId: item.classId, dayIndex: item.dayIndex })
    goTo('Classes & Timetable')
  }

  function markAllClassNotificationsRead() {
    const updated = classNotifications.map((item) => ({ ...item, unread: false }))
    setClassNotifications(updated)
    try {
      window.localStorage.setItem('staff-portal-class-notifications', JSON.stringify(updated))
    } catch {
      action('Notifications marked read for this session')
    }
  }

  function goBack() {
    const previousEntry = viewHistory[viewHistory.length - 1]
    if (!previousEntry) {
      setCurrentView('Dashboard')
      setIsMainView(true)
      setSidebarCollapsed(false)
      setFocusedClass(null)
      return
    }
    setViewHistory((history) => history.slice(0, -1))
    setCurrentView(previousEntry.view)
    setIsMainView(previousEntry.isMainView)
    setSidebarCollapsed(false)
    setSidebarOpen(false)
    setShowSearchResults(false)
    setNotice('')
  }

  function action(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  return (
    <div className="app-shell">
      {isMainView && sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      {isMainView && <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="brand-block">
          <div className="college-mark"><span className="mark-roof" /><span className="mark-columns"><i /><i /><i /></span><span className="mark-base" /></div>
          <div className="brand-name">College Management<span>Academic and administration portal</span></div>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></button>
        </div>
        <nav className="side-nav" aria-label="Staff portal pages">
          {navigation.map(({ label, icon: Icon }) => {
            const visibleLabel = label === 'Staff Profile' && account.staffType === 'in-charge' ? 'In-Charge Profile' : label
            return <button key={label} className={`nav-link ${currentView === label ? 'nav-active' : ''}`} aria-current={currentView === label ? 'page' : undefined} onClick={() => goTo(label, true)}>
              <Icon size={17} strokeWidth={1.8} /><span>{visibleLabel}</span>
              {label === 'Notifications' && <span className="nav-badge">{2 + classNotifications.filter((item) => item.unread).length}</span>}
            </button>
          })}
        </nav>
        <div className="sidebar-campus" />
        <div className="sidebar-motto"><span>Knowledge</span><i /><span>Discipline</span><i /><span>Progress</span></div>
      </aside>}

      <div className={`workspace ${sidebarCollapsed ? 'workspace-sidebar-collapsed' : ''} ${isMainView ? '' : 'workspace-detail'}`}>
        <header className="topbar">
          {isMainView ? <button className="mobile-menu icon-button" aria-label="Menu" title="Menu" onClick={() => {
            if (window.matchMedia('(max-width: 800px)').matches) setSidebarOpen(true)
            else setSidebarCollapsed((collapsed) => !collapsed)
          }}><Menu size={20} /></button> : <button className="back-nav-button icon-button" aria-label="Back" title="Back" onClick={goBack}><ArrowLeft size={18} /></button>}
          {isMainView && <div className="topbar-spacer" />}
          {isMainView && currentView !== 'Students' && <div className="search-wrap">
            <Search className="search-icon" size={15} />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setShowSearchResults(true) }} onFocus={() => search && setShowSearchResults(true)} onKeyDown={(event) => { if (event.key === 'Escape') setShowSearchResults(false) }} placeholder="Search students, events, announcements..." aria-label="Search portal" />
            {showSearchResults && search && <div className="search-results">{searchResults.length ? searchResults.map((result, index) => <button key={`${result.label}-${index}`} onClick={() => { goTo(result.view); setSearch('') }}><span>{result.label}</span><small>{result.detail}</small></button>) : <p>No matching records</p>}</div>}
          </div>}
          {isMainView && <><button className="top-notice icon-button" aria-label="Open notifications" onClick={() => goTo('Notifications', true)}><Bell size={18} /><b>{2 + classNotifications.filter((item) => item.unread).length}</b></button>
          <button className="user-menu" onClick={() => goTo('Staff Profile')}><img src={staffProfile.photoUrl} alt={staffProfile.name} /><span><strong>{staffProfile.name}</strong><small>{account.staffType === 'in-charge' ? 'In-Charge' : 'Staff'} · {staffProfile.department}</small></span><ChevronDown size={14} /></button>
          <button className="btn-ghost" aria-label="Sign out" title="Sign out" onClick={() => { void onLogout().catch(() => action('Unable to sign out right now. Please try again.')) }}><LogOut size={16} /></button></>}
        </header>

        <main className="main-content" onClick={() => showSearchResults && setShowSearchResults(false)}>
          {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
          {currentView === 'Dashboard' ? <Dashboard goTo={(view) => goTo(view === 'Profile' ? 'Staff Profile' : view as ViewName)} staffProfile={staffProfile} staffType={account.staffType || 'staff'} /> : currentView === 'My Profile' ? <MyProfile action={action} profile={staffProfile} onProfileChange={setStaffProfile} /> : currentView === 'Staff Profile' ? <StaffProfile action={action} profile={staffRoleProfile} onProfileChange={setStaffRoleProfile} staffType={account.staffType || 'staff'} /> : currentView === 'Students' ? <Students action={action} /> : currentView === 'Staff Activity' ? <StaffActivity action={action} /> : currentView === 'Sports' ? <Sports action={action} /> : currentView === 'Settings' ? <SettingsPage action={action} /> : currentView === 'Notifications' ? <NotificationsPage action={action} goTo={goTo} classNotifications={classNotifications} onOpenClassNotification={openClassNotification} onMarkAllClassNotificationsRead={markAllClassNotificationsRead} /> : currentView === 'Gallery' ? <Gallery /> : currentView === 'Events' ? <EventsPage action={action} /> : currentView === 'Classes & Timetable' ? <ClassesTimetablePage focusedClass={focusedClass} /> : currentView === 'Attendance' ? <AttendancePage action={action} /> : currentView === 'Announcements' ? <AnnouncementsPage action={action} /> : <InnerPage view={currentView} goTo={goTo} action={action} />}
        </main>
      </div>
    </div>
  )
}

function PanelHeading({ icon: Icon, title, actionLabel, onAction }: { icon: LucideIcon; title: string; actionLabel?: string; onAction?: () => void }) {
  return <div className="panel-heading"><div className="heading-label"><Icon size={17} strokeWidth={2.2} /><h2>{title}</h2></div>{actionLabel && <button className="text-action" onClick={onAction}>{actionLabel}<ChevronRight size={13} /></button>}</div>
}

function InnerPage({ view, goTo, action }: { view: Exclude<ViewName, 'Dashboard'>; goTo: (view: ViewName) => void; action: (message: string) => void }) {
  const content = viewContent[view]
  const Icon = navigation.find((item) => item.label === view)?.icon ?? FileText
  return <div className="inner-page"><div className="inner-title-row"><div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.description}</p></div><button className="primary-button" onClick={() => action(view === 'Settings' ? 'Preferences saved' : `New ${view === 'Students' ? 'student record' : view.toLowerCase().replace(' & timetable', '')} started`)}><span>+</span>{view === 'Settings' ? 'Save preferences' : `Add ${view === 'Students' ? 'Student' : view === 'Announcements' ? 'Announcement' : view === 'Events' ? 'Event' : view === 'Gallery' ? 'Album' : 'New'}`}</button></div>
    <section className="panel records-panel"><div className="records-toolbar"><div className="records-count"><span className="records-icon"><Icon size={17} /></span><strong>{view === 'Students' ? '62 students' : `${content.rows.length} records`}</strong><span>· Updated just now</span></div><button className="filter-button" onClick={() => action('Filters opened')}><SlidersHorizontal size={15} />Filter</button></div><div className="table-scroll"><table className="records-table"><thead><tr>{content.columns.map((column) => <th key={column}>{column}</th>)}<th aria-label="Actions" /></tr></thead><tbody>{content.rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((value, index) => <td className={index === 0 ? 'strong-cell' : ''} key={`${value}-${index}`}>{value}</td>)}<td><button className="row-action" aria-label={`Open ${row[0]}`} onClick={() => action(`${row[0]} opened`)}><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing 1–{content.rows.length} of {view === 'Students' ? '62' : content.rows.length}</span><div><button aria-label="Previous page" disabled>‹</button><button className="page-current">1</button><button onClick={() => action('Next page')}>2</button><button aria-label="Next page" onClick={() => action('Next page')}>›</button></div></div></section>
    <div className="page-lower-grid"><section className="panel lower-panel"><PanelHeading icon={Clock3} title="Recent updates" /><div className="lower-items"><p><span className="lower-dot dot-green" />Records synced with the college portal <small>Today · 10:42 AM</small></p><p><span className="lower-dot dot-blue" />Department details verified <small>Yesterday · 04:18 PM</small></p><p><span className="lower-dot dot-amber" />New items are ready for review <small>25 Sep 2026</small></p></div></section><section className="panel lower-panel"><PanelHeading icon={ShieldCheck} title="Department overview" /><div className="overview-stats"><div><strong>62</strong><span>Assigned students</span></div><div><strong>8</strong><span>Teaching staff</span></div><div><strong>4</strong><span>Active sections</span></div></div><button className="text-action lower-action" onClick={() => goTo('Dashboard')}>Back to dashboard <ChevronRight size={13} /></button></section></div>
  </div>
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const roleFromPath: AuthRole | null = path === '/principal' ? 'principal' : path === '/hod' ? 'hod' : path === '/staff' ? 'staff' : path === '/student' ? 'student' : null
  const [session, setSession] = useState<{
    role: AuthRole
    displayName: string
    email: string
    collegeName: string
    collegeCode: string
    department?: string
    staffType?: 'in-charge' | 'staff'
  } | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    fetch('/api/auth/session', { credentials: 'include' })
      .then(async (response) => response.ok ? await response.json() : null)
      .then((result) => {
        if (!active) return
        const user = result?.user
        if (user && ['principal', 'hod', 'staff', 'student'].includes(user.role)) {
          setSession(user)
        } else {
          setSession(null)
        }
      })
      .catch((error) => {
        console.error('Unable to restore the portal session:', error)
        if (active) setSession(null)
      })
    return () => { active = false }
  }, [])

  if (path === '/privacy') return <PublicPages page="privacy" />
  if (path === '/faq') return <PublicPages page="faq" />
  if (!['/', '/principal', '/hod', '/staff', '/student'].includes(path)) return <PublicPages page="not-found" />

  const onLoginSuccess = (user: NonNullable<typeof session>) => {
    setSession(user)
    window.location.assign(user.role === 'staff' ? '/staff' : `/${user.role}`)
  }

  const onLogout = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    if (!response.ok) throw new Error('The sign-out request failed.')
    setSession(null)
    window.location.assign('/')
  }

  if (!roleFromPath) {
    if (session) {
      window.location.replace(session.role === 'staff' ? '/staff' : `/${session.role}`)
      return null
    }
    return <LoginPage onLoginSuccess={onLoginSuccess} />
  }

  if (session === undefined) {
    return <div className="auth-loading" role="status">Checking your secure college session…</div>
  }
  if (!session || session.role !== roleFromPath) {
    window.location.replace('/')
    return null
  }
  if (roleFromPath === 'staff') return <PortalApp onLogout={onLogout} account={session} />
  return <RoleDashboard role={roleFromPath as PortalRole} onLogout={onLogout} account={session} />
}
