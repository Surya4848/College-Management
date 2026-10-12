export type ClassType = 'Lecture' | 'Practical' | 'Tutorial'

export type ClassSession = {
  id: string
  dayIndex: number
  time: string
  startTime: string
  endTime: string
  subject: string
  section: string
  room: string
  type: ClassType
}

export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

export const weeklyClasses: ClassSession[][] = [
  [
    { id: 'mon-cloud', dayIndex: 0, time: '09:00 AM – 10:00 AM', startTime: '09:00', endTime: '10:00', subject: 'Cloud Computing', section: 'B.Tech IT · A', room: 'IT-204', type: 'Lecture' },
    { id: 'mon-devops', dayIndex: 0, time: '10:15 AM – 11:15 AM', startTime: '10:15', endTime: '11:15', subject: 'DevOps', section: 'B.Tech IT · A', room: 'Lab-2', type: 'Practical' },
    { id: 'mon-project-mentoring', dayIndex: 0, time: '01:30 PM – 02:30 PM', startTime: '13:30', endTime: '14:30', subject: 'Project Mentoring', section: 'B.Tech IT · III Year', room: 'Block A · 204', type: 'Tutorial' },
  ],
  [
    { id: 'tue-cybersecurity', dayIndex: 1, time: '09:30 AM – 10:30 AM', startTime: '09:30', endTime: '10:30', subject: 'Cybersecurity', section: 'B.Tech IT · B', room: 'IT-301', type: 'Lecture' },
    { id: 'tue-web-security', dayIndex: 1, time: '11:00 AM – 12:00 PM', startTime: '11:00', endTime: '12:00', subject: 'Web Security', section: 'B.Tech IT · A', room: 'IT-204', type: 'Lecture' },
  ],
  [
    { id: 'wed-cloud', dayIndex: 2, time: '10:00 AM – 11:00 AM', startTime: '10:00', endTime: '11:00', subject: 'Cloud Computing', section: 'B.Tech IT · B', room: 'IT-301', type: 'Lecture' },
    { id: 'wed-devops-lab', dayIndex: 2, time: '11:15 AM – 12:15 PM', startTime: '11:15', endTime: '12:15', subject: 'DevOps Lab', section: 'B.Tech IT · A', room: 'Lab-2', type: 'Practical' },
    { id: 'wed-consultation', dayIndex: 2, time: '02:00 PM – 03:00 PM', startTime: '14:00', endTime: '15:00', subject: 'Student Consultation', section: 'Open hours', room: 'Block A · 204', type: 'Tutorial' },
  ],
  [
    { id: 'thu-web-security', dayIndex: 3, time: '09:00 AM – 10:00 AM', startTime: '09:00', endTime: '10:00', subject: 'Web Security', section: 'B.Tech IT · B', room: 'IT-301', type: 'Lecture' },
    { id: 'thu-cyber-lab', dayIndex: 3, time: '10:15 AM – 11:15 AM', startTime: '10:15', endTime: '11:15', subject: 'Cybersecurity Lab', section: 'B.Tech IT · A', room: 'Lab-1', type: 'Practical' },
  ],
  [
    { id: 'fri-cloud', dayIndex: 4, time: '09:00 AM – 10:00 AM', startTime: '09:00', endTime: '10:00', subject: 'Cloud Computing', section: 'B.Tech IT · A', room: 'IT-204', type: 'Lecture' },
    { id: 'fri-devops', dayIndex: 4, time: '10:15 AM – 11:15 AM', startTime: '10:15', endTime: '11:15', subject: 'DevOps', section: 'B.Tech IT · A', room: 'Lab-2', type: 'Practical' },
    { id: 'fri-cybersecurity', dayIndex: 4, time: '11:30 AM – 12:30 PM', startTime: '11:30', endTime: '12:30', subject: 'Cybersecurity', section: 'B.Tech IT · B', room: 'IT-301', type: 'Lecture' },
    { id: 'fri-web-security', dayIndex: 4, time: '02:00 PM – 03:00 PM', startTime: '14:00', endTime: '15:00', subject: 'Web Security', section: 'B.Tech IT · A', room: 'IT-204', type: 'Lecture' },
    { id: 'fri-project-review', dayIndex: 4, time: '03:15 PM – 04:00 PM', startTime: '15:15', endTime: '16:00', subject: 'Project Review', section: 'B.Tech IT · III Year', room: 'Seminar Hall', type: 'Tutorial' },
  ],
]

export const staffTimetable = weeklyClasses.flat()
