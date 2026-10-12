import { useEffect, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, BookOpen, CalendarDays, CheckCircle2,
  ClipboardCheck, GraduationCap, Image, LogOut, Megaphone, Menu, Settings, UserRound,
  Users, Volleyball, X,
} from 'lucide-react'
import './RoleDashboard.css'
import { updatePageMetadata } from '../pageMetadata'
import AnnouncementsPage from './Announcements'
import EventsPage from './Events'
import Dashboard from './Dashboard'
import StudentsPage from './Students'
import AttendancePage from './Attendance'
import ClassesTimetablePage from './ClassesTimetable'
import SportsPage from './Sports'
import GalleryPage from './Gallery'
import NotificationsPage from './Notifications'
import StaffActivityPage from './StaffActivity'
import SettingsPage from './Settings'
import { getSavedProfile, type ProfileData } from './MyProfile'

export type PortalRole = 'principal' | 'hod' | 'student'
type RolePage = 'Dashboard' | 'Profile' | 'Students' | 'Attendance' | 'Classes & Timetable' | 'Announcements' | 'Events' | 'Sports' | 'Gallery' | 'Notifications' | 'Staff Activity' | 'Settings'

type RoleDashboardProps = {
  role: PortalRole
  onLogout: () => Promise<void>
  account: { displayName: string; email: string; collegeName: string; collegeCode: string; department?: string }
}

const dashboardContent = {
  principal: {
    title: 'Principal dashboard',
    description: 'A college-wide view of academics, people, and campus updates.',
    greeting: 'Good morning',
    metrics: [
      { label: 'Total HODs', value: '08', icon: BookOpen, tone: 'blue' },
      { label: 'Total staff', value: '124', icon: Users, tone: 'violet' },
      { label: 'Total students', value: '2,480', icon: GraduationCap, tone: 'green' },
      { label: 'Attendance today', value: '92.4%', icon: ClipboardCheck, tone: 'amber' },
    ],
    updates: [
      ['Academic review meeting', 'Today · 11:00 AM · Board room'],
      ['Internal examination schedule published', 'Examination Cell · 25 Sep 2026'],
      ['College Sports Day preparations', 'Sports Cell · 30 Sep 2026'],
    ],
    quickLinks: ['Department overview', 'Staff directory', 'College announcements'],
  },
  hod: {
    title: 'HOD dashboard',
    description: 'Monitor your department and keep academic work moving.',
    greeting: 'Welcome back',
    metrics: [
      { label: 'Total students', value: '248', icon: GraduationCap, tone: 'blue' },
      { label: 'Total staff', value: '18', icon: Users, tone: 'violet' },
      { label: 'Attendance today', value: '93.1%', icon: ClipboardCheck, tone: 'green' },
      { label: 'Pending reviews', value: '06', icon: Activity, tone: 'amber' },
    ],
    updates: [
      ['Staff meeting', 'Today · 10:30 AM · Department office'],
      ['Approve staff leave requests', '2 requests need your review'],
      ['Internal examination schedule published', 'Examination Cell · 25 Sep 2026'],
    ],
    quickLinks: ['Department students', 'Staff directory', 'Department announcements'],
  },
  student: {
    title: 'Student dashboard',
    description: 'Your classes, attendance, and campus updates in one place.',
    greeting: 'Welcome back',
    metrics: [
      { label: 'Attendance', value: '94%', icon: ClipboardCheck, tone: 'green' },
      { label: 'Classes today', value: '05', icon: BookOpen, tone: 'blue' },
      { label: 'Upcoming events', value: '02', icon: CalendarDays, tone: 'violet' },
      { label: 'New notices', value: '03', icon: Bell, tone: 'amber' },
    ],
    updates: [
      ['Web Technology', '09:00 AM · Room B-204'],
      ['Internal examination schedule published', 'Examination Cell · 25 Sep 2026'],
      ['College Sports Day', '05 Oct 2026 · All students are invited'],
    ],
    quickLinks: ['My timetable', 'My attendance', 'Campus announcements'],
  },
} satisfies Record<PortalRole, {
  title: string
  description: string
  greeting: string
  metrics: { label: string; value: string; icon: typeof BookOpen; tone: string }[]
  updates: string[][]
  quickLinks: string[]
}>

const sharedNotices = [
  { title: 'Internal examination schedule', detail: 'Check the published timetable and exam instructions.' },
  { title: 'Department meeting', detail: 'Meeting details are available from your department.' },
  { title: 'College Sports Day', detail: 'Registration and event updates are available now.' },
]

const sharedEvents = [
  { title: 'Technical Symposium', date: '10 Oct', place: 'Seminar Hall' },
  { title: 'Cultural Fest', date: '25 Oct', place: 'Main Auditorium' },
]

const departmentSports = ['Cricket', 'Football', 'Volleyball', 'Badminton']

export default function RoleDashboard({ role, onLogout, account }: RoleDashboardProps) {
  const [logoutError, setLogoutError] = useState('')
  const [currentPage, setCurrentPage] = useState<RolePage>('Dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const content = dashboardContent[role]
  const displayRole = role === 'principal' ? 'Principal' : role === 'hod' ? 'Head of Department' : 'Student'
  const accountProfile: ProfileData = {
    ...getSavedProfile(),
    name: account.displayName,
    staffId: '',
    designation: 'Head of Department',
    department: account.department ?? '',
    email: account.email,
    phone: '',
    office: '',
    qualification: '',
    joined: '',
    photoUrl: '',
  }
  const menuItems = role === 'hod' ? [
    ['Dashboard', Activity], ['Profile', UserRound], ['Students', GraduationCap],
    ['Attendance', ClipboardCheck], ['Classes & Timetable', BookOpen], ['Announcements', Megaphone],
    ['Events', CalendarDays], ['Sports', Volleyball], ['Gallery', Image],
    ['Notifications', Bell], ['Staff Activity', Users], ['Settings', Settings],
  ] as const : [
    ['Dashboard', Activity], ['Profile', UserRound], ['Announcements', Megaphone], ['Events', CalendarDays],
  ] as const

  useEffect(() => {
    const pageTitle = currentPage === 'Dashboard' ? content.title : currentPage === 'Profile' ? `${displayRole} Profile` : currentPage
    const pageDescription = currentPage === 'Events' ? 'Browse upcoming campus events.' : currentPage === 'Announcements' ? 'Read college and department announcements.' : currentPage === 'Profile' ? `View your ${displayRole.toLowerCase()} account profile.` : content.description
    updatePageMetadata(pageTitle, pageDescription)
  }, [content.description, content.title, currentPage, displayRole])

  function selectPage(page: RolePage) {
    setCurrentPage(page)
    setMenuOpen(false)
    setActionMessage('')
  }

  async function handleLogout() {
    setLogoutError('')
    try {
      await onLogout()
    } catch {
      setLogoutError('Unable to sign out right now. Please try again.')
    }
  }

  return (
    <div className="role-dashboard">
      <header className="role-dashboard-header">
        <button className="role-menu-button" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}<span>Menu</span></button>
        <a className="role-dashboard-brand" href="/" aria-label="College portal home">
          <span className="role-dashboard-mark"><GraduationCap size={22} /></span>
          <span><strong>College Management Portal</strong><small>{account.collegeName || 'Academic and administration workspace'}</small></span>
        </a>
        <div className="role-dashboard-account">
          <span className="role-account-label">{displayRole}</span>
          <button className="role-profile-button" onClick={() => selectPage('Profile')}><UserRound size={16} /><span>Profile</span></button>
          <button className="role-logout" type="button" onClick={handleLogout}><LogOut size={15} /> Sign out</button>
        </div>
      </header>

      {menuOpen && <><button className="role-menu-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} /><nav className="role-menu-drawer" aria-label="Portal menu">{menuItems.map(([label, Icon]) => <button key={label} className={currentPage === label ? 'role-menu-active' : ''} aria-current={currentPage === label ? 'page' : undefined} onClick={() => selectPage(label)}><Icon size={17} />{label}</button>)}</nav></>}

      {currentPage === 'Dashboard' && role === 'hod' ? <main className="role-dashboard-main role-hod-dashboard"><Dashboard goTo={(view) => selectPage(view === 'My Profile' || view === 'Staff Profile' ? 'Profile' : view)} staffProfile={accountProfile} staffType="staff" mode="hod" /></main> : currentPage === 'Dashboard' ? <main className="role-dashboard-main">
        <section className="role-welcome">
          <div>
            <p className="role-eyebrow">COLLEGE MANAGEMENT SYSTEM</p>
            <h1>{content.greeting}, {account.displayName}</h1>
            <p>{account.collegeName} · {account.department || content.description}</p>
          </div>
          <div className="role-dashboard-date"><CalendarDays size={17} />{new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div>
        </section>

        {logoutError && <p className="role-dashboard-error" role="alert">{logoutError}</p>}
        {role === 'principal' && (
          <section className="college-code-card" aria-label="Your college code">
            <div><span className="role-panel-kicker">SHARE WITH YOUR COLLEGE COMMUNITY</span><h2>College access code</h2><p>HODs, staff, and students need this code when creating their accounts.</p></div>
            <strong>{account.collegeCode}</strong>
          </section>
        )}

        <section className="role-metrics" aria-label={`${displayRole} overview`}>
          {content.metrics.map(({ label, value, icon: Icon, tone }) => (
            <article className="role-metric-card" key={label}>
              <span className={`role-metric-icon tone-${tone}`}><Icon size={19} /></span>
              <div><span>{label}</span><strong>{value}</strong></div>
            </article>
          ))}
        </section>

        <div className="role-dashboard-columns">
          <section className="role-panel role-updates-panel">
            <div className="role-panel-heading"><div><span className="role-panel-kicker">STAY INFORMED</span><h2>Today and updates</h2></div><Megaphone size={19} /></div>
            <div className="role-update-list">
              {content.updates.map(([title, detail]) => (
                <article className="role-update" key={title}>
                  <span className="role-update-check"><CheckCircle2 size={16} /></span>
                  <div><strong>{title}</strong><p>{detail}</p></div>
                  <ArrowUpRight size={15} />
                </article>
              ))}
            </div>
          </section>

          <section className="role-panel role-quick-panel">
            <div className="role-panel-heading"><div><span className="role-panel-kicker">YOUR WORKSPACE</span><h2>Quick access</h2></div><ArrowUpRight size={18} /></div>
            <div className="role-workspace-list">
              {content.quickLinks.map((link) => <button key={link} onClick={() => selectPage(link.toLowerCase().includes('announcement') ? 'Announcements' : link.toLowerCase().includes('event') ? 'Events' : 'Profile')}>{link}<ArrowUpRight size={13} /></button>)}
            </div>
            <div className="role-common-links" aria-label="Shared college pages"><button onClick={() => selectPage('Announcements')}><Megaphone size={14} /> Announcements</button><button onClick={() => selectPage('Events')}><CalendarDays size={14} /> Events</button><button onClick={() => selectPage('Profile')}><UserRound size={14} /> My Profile</button></div>
            <p className="role-panel-note">Workspace areas available for your account.</p>
          </section>
        </div>

        <div className="role-dashboard-feature-grid">
          <section className="role-panel"><div className="role-panel-heading"><div><span className="role-panel-kicker">TODAY</span><h2>{role === 'student' ? 'My classes' : role === 'hod' ? 'Department schedule' : 'Academic schedule'}</h2></div><BookOpen size={18} /></div><div className="role-feature-list">{content.updates.slice(0, 3).map(([title, detail]) => <article key={title}><strong>{title}</strong><p>{detail}</p></article>)}</div></section>
          <section className="role-panel"><div className="role-panel-heading"><div><span className="role-panel-kicker">CAMPUS UPDATES</span><h2>Announcements</h2></div><button className="role-feature-action" onClick={() => selectPage('Announcements')}>View all <ArrowUpRight size={13} /></button></div><div className="role-feature-list">{sharedNotices.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div></section>
          <section className="role-panel"><div className="role-panel-heading"><div><span className="role-panel-kicker">CAMPUS CALENDAR</span><h2>Upcoming events</h2></div><button className="role-feature-action" onClick={() => selectPage('Events')}>View all <ArrowUpRight size={13} /></button></div><div className="role-feature-list">{sharedEvents.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.date} · {item.place}</p></article>)}</div></section>
          <section className="role-panel"><div className="role-panel-heading"><div><span className="role-panel-kicker">CAMPUS LIFE</span><h2>Sports</h2></div><Activity size={18} /></div><div className="role-sports-list">{departmentSports.map((sport) => <span key={sport}>{sport}</span>)}</div></section>
        </div>

        <footer className="role-dashboard-footer">© {new Date().getFullYear()} College Management Portal</footer>
      </main> : currentPage === 'Profile' ? <main className="role-dashboard-main">
        <button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to {displayRole} dashboard</button>
        <section className="role-profile-panel">
          <div className="role-profile-heading"><span className="role-profile-avatar" aria-hidden="true">{account.displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><p className="role-eyebrow">{displayRole.toUpperCase()} PROFILE</p><h1>{account.displayName}</h1><p>{account.department || account.collegeName}</p></div></div>
          <div className="role-profile-sections">
            <section><h2><UserRound size={16} /> Account information</h2><div className="role-profile-details"><div><span>Full name</span><strong>{account.displayName}</strong></div><div><span>Role</span><strong>{displayRole}</strong></div><div><span>Email</span><strong>{account.email}</strong></div></div></section>
            <section><h2><BookOpen size={16} /> Organization</h2><div className="role-profile-details"><div><span>College</span><strong>{account.collegeName}</strong></div>{account.department && <div><span>Department</span><strong>{account.department}</strong></div>}{role === 'principal' && <div><span>College access code</span><strong>{account.collegeCode}</strong></div>}</div></section>
          </div>
        </section>
      </main> : currentPage === 'Students' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><StudentsPage action={setActionMessage} /></main>
        : currentPage === 'Attendance' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><AttendancePage action={setActionMessage} /></main>
          : currentPage === 'Classes & Timetable' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><ClassesTimetablePage /></main>
            : currentPage === 'Sports' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><SportsPage action={setActionMessage} /></main>
              : currentPage === 'Gallery' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><GalleryPage /></main>
                : currentPage === 'Notifications' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><NotificationsPage action={setActionMessage} goTo={selectPage} classNotifications={[]} onOpenClassNotification={() => selectPage('Classes & Timetable')} onMarkAllClassNotificationsRead={() => {}} /></main>
                  : currentPage === 'Staff Activity' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><StaffActivityPage action={setActionMessage} /></main>
                    : currentPage === 'Settings' ? <main className="role-dashboard-main role-common-main"><button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to dashboard</button><SettingsPage action={setActionMessage} /></main>
                      : <main className="role-dashboard-main role-common-main">
        <button className="role-common-back" onClick={() => selectPage('Dashboard')}><ArrowLeft size={16} /> Back to {displayRole} dashboard</button>
        {actionMessage && <p className="role-dashboard-error" role="status">{actionMessage}</p>}
        {currentPage === 'Announcements' ? <AnnouncementsPage action={setActionMessage} /> : <EventsPage action={setActionMessage} />}
      </main>}
    </div>
  )
}
