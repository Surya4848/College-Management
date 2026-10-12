import { useState } from 'react'
import { Bell, CalendarDays, CheckCheck, ClipboardCheck, Clock3, FileText, Megaphone } from 'lucide-react'
import type { ClassNotification } from '../classNotifications'
import './Notifications.css'

type NotificationTarget = 'Attendance' | 'Classes & Timetable' | 'Announcements' | 'Events'

const initialNotifications = [
	{ id: 1, title: 'Attendance submission closes at 5 PM', detail: 'Complete attendance for your assigned classes.', time: 'Today · 11:20 AM', icon: ClipboardCheck, unread: true, target: 'Attendance' as const },
	{ id: 2, title: 'Department meeting · 28 Sep, 10:00 AM', detail: 'Meeting room: Block A, Conference Room.', time: 'Today · 09:05 AM', icon: CalendarDays, unread: true, target: 'Classes & Timetable' as const },
	{ id: 3, title: 'New examination schedule published', detail: 'The internal examination timetable is now available.', time: 'Yesterday · 03:30 PM', icon: FileText, unread: false, target: 'Announcements' as const },
	{ id: 4, title: 'Technical Symposium event approved', detail: 'Your event is scheduled for 10 Oct 2026.', time: '24 Sep · 01:12 PM', icon: Megaphone, unread: false, target: 'Events' as const },
]

type NotificationsProps = {
	action: (message: string) => void
	goTo: (view: NotificationTarget) => void
	classNotifications: ClassNotification[]
	onOpenClassNotification: (notification: ClassNotification) => void
	onMarkAllClassNotificationsRead: () => void
}

export default function Notifications({ action, goTo, classNotifications, onOpenClassNotification, onMarkAllClassNotificationsRead }: NotificationsProps) {
	const [notifications, setNotifications] = useState(initialNotifications)
	const unreadCount = notifications.filter((item) => item.unread).length + classNotifications.filter((item) => item.unread).length

	function markAllRead() {
		setNotifications((items) => items.map((item) => ({ ...item, unread: false })))
		onMarkAllClassNotificationsRead()
		action('All notifications marked as read')
	}

	function openNotification(id: number, target: NotificationTarget) {
		setNotifications((items) => items.map((item) => item.id === id ? { ...item, unread: false } : item))
		goTo(target)
	}

	return (
		<div className="inner-page notifications-page">
			<div className="inner-title-row">
				<div><p className="eyebrow">YOUR INBOX</p><h1>Notifications</h1><p>You have {unreadCount} unread updates.</p></div>
				<button className="filter-button" onClick={markAllRead} aria-label="Mark all notifications as read"><CheckCheck size={14} /> Mark all read</button>
			</div>
			<section className="panel notifications-panel">
				<div className="panel-heading"><div className="heading-label"><Bell size={17} /><h2>Recent notifications</h2></div><span className="notification-count">{unreadCount} unread</span></div>
				<div className="notification-list">
					{classNotifications.map((item) => {
						const Icon = item.kind === 'upcoming' ? Clock3 : Bell
						return <button className={`notification-row notification-class-row ${item.unread ? 'notification-unread' : ''}`} key={item.id} onClick={() => onOpenClassNotification(item)} title="Open this class in the timetable" aria-label={`Open ${item.title}`}>
							<span className="notification-icon"><Icon size={16} /></span>
							<span className="notification-copy"><strong>{item.title}</strong><small>{item.message}</small></span>
							<time>{item.time}</time>
							{item.unread && <span className="notification-dot" aria-label="Unread notification" />}
						</button>
					})}
					{notifications.map(({ id, title, detail, time, icon: Icon, unread, target }) => (
						<button className={`notification-row ${unread ? 'notification-unread' : ''}`} key={id} onClick={() => openNotification(id, target)} title={`Open ${target}`} aria-label={`Open ${title}`}>
							<span className="notification-icon"><Icon size={16} /></span>
							<span className="notification-copy"><strong>{title}</strong><small>{detail}</small></span>
							<time>{time}</time>
							{unread && <span className="notification-dot" aria-label="Unread notification" />}
						</button>
					))}
				</div>
			</section>
		</div>
	)
}
