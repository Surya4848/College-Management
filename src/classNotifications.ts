import { staffTimetable, type ClassSession } from './timetableData'

export type ClassNotification = {
  id: string
  classId: string
  dayIndex: number
  kind: 'upcoming' | 'starting'
  title: string
  message: string
  time: string
  unread: boolean
}

function parseStartTime(session: ClassSession, now: Date) {
  const [hours, minutes] = session.startTime.split(':').map(Number)
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function getDueClassNotifications(now: Date): ClassNotification[] {
  const dayIndex = (now.getDay() + 6) % 7
  const daySessions = staffTimetable.filter((session) => session.dayIndex === dayIndex)
  const currentMinute = Math.floor(now.getTime() / 60_000)
  const notices: ClassNotification[] = []
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  for (const session of daySessions) {
    const classStart = parseStartTime(session, now)
    const startMinute = Math.floor(classStart.getTime() / 60_000)
    const upcomingMinute = Math.floor((classStart.getTime() - 10 * 60_000) / 60_000)
    const classTime = formatTime(classStart)

    if (currentMinute === upcomingMinute) {
      notices.push({
        id: `${dateKey}-${session.id}-upcoming`,
        classId: session.id,
        dayIndex: session.dayIndex,
        kind: 'upcoming',
        title: 'Upcoming Class',
        message: `${session.subject} class starts in 10 minutes. Room: ${session.room}. Time: ${classTime}.`,
        time: `Today · ${formatTime(now)}`,
        unread: true,
      })
    }

    if (currentMinute === startMinute) {
      notices.push({
        id: `${dateKey}-${session.id}-starting`,
        classId: session.id,
        dayIndex: session.dayIndex,
        kind: 'starting',
        title: 'Class Starting Now',
        message: `${session.subject} – ${session.section}. Room: ${session.room}. Time: ${classTime}.`,
        time: `Today · ${formatTime(now)}`,
        unread: true,
      })
    }
  }

  return notices
}
