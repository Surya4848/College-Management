import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, School, ShieldCheck, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './LoginPage.css'
import { updatePageMetadata } from '../pageMetadata'

type LoginRole = 'principal' | 'hod' | 'staff' | 'student'
type AuthUser = {
  role: LoginRole
  displayName: string
  email: string
  collegeName: string
  collegeCode: string
  department?: string
  staffType?: 'in-charge' | 'staff'
}
type RoleChoice = { id: LoginRole; title: string; name: string; description: string; icon: LucideIcon }
type LoginPageProps = { onLoginSuccess: (user: AuthUser) => void }

const adminChoices: RoleChoice[] = [
  { id: 'principal', title: 'PRINCIPAL', name: 'Principal Login', description: 'College-wide management', icon: School },
  { id: 'hod', title: 'HOD', name: 'HOD Login', description: 'Department management', icon: ShieldCheck },
  { id: 'staff', title: 'STAFF', name: 'Staff Login', description: 'In-Charge or staff access', icon: UserRound },
]

const departments = ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Electrical and Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Science and Humanities']

function getDemoLoginOptions(role: LoginRole) {
  if (!import.meta.env.DEV) return []
  const sharedPassword = 'DemoPortal!2026'
  const options = {
    principal: [{ label: 'Fill demo login', email: 'principal.demo@college.test', password: sharedPassword }],
    hod: [{ label: 'Fill demo login', email: 'hod.demo@college.test', password: sharedPassword }],
    staff: [
      { label: 'Fill In-Charge demo', email: 'incharge.demo@college.test', password: sharedPassword },
      { label: 'Fill Staff demo', email: 'staff.demo@college.test', password: sharedPassword },
    ],
    student: [{ label: 'Fill demo login', email: 'student.demo@college.test', password: sharedPassword }],
  } satisfies Record<LoginRole, { label: string; email: string; password: string }[]>
  return options[role]
}

const messages: Record<string, string> = {
  INVALID_COLLEGE_CODE: 'That college code was not found. Check it with your college principal.',
  EMAIL_ALREADY_REGISTERED: 'An account with this email already exists. Sign in instead.',
  HOD_ALREADY_REGISTERED: 'An HOD account is already registered for this college. Contact the principal.',
  IN_CHARGE_ALREADY_REGISTERED: 'An In-Charge account is already registered for this department. Contact the principal.',
  INVALID_STAFF_TYPE: 'Choose In-Charge or Staff for this account.',
  INVALID_DEPARTMENT: 'The department selected for this account was not found.',
  INVALID_CREDENTIALS: 'The email, college code, or password is incorrect.',
  INVALID_REGISTRATION_DETAILS: 'Enter a valid name, email, and password (at least 8 characters).',
  INVALID_COLLEGE_NAME: 'Enter a college name between 3 and 160 characters.',
}

function errorMessage(code: unknown) {
  return typeof code === 'string' && messages[code] ? messages[code] : 'The request could not be completed. Please try again.'
}

async function postJson(path: string, payload: Record<string, string>) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result: unknown = await response.json()
  const data = typeof result === 'object' && result !== null
    ? result as { success?: boolean; code?: string; user?: AuthUser; collegeCode?: string }
    : {}
  if (!response.ok || data.success !== true || !data.user) throw new Error(data.code || 'REQUEST_FAILED')
  return { user: data.user, collegeCode: data.collegeCode }
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [view, setView] = useState<'home' | 'admin' | 'form'>('home')
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [collegeName, setCollegeName] = useState('')
  const [collegeCode, setCollegeCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [customDepartment, setCustomDepartment] = useState('')
  const [staffType, setStaffType] = useState<'in-charge' | 'staff'>('staff')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [registeredUser, setRegisteredUser] = useState<AuthUser | null>(null)
  const demoLoginOptions = selectedRole && !isRegistering ? getDemoLoginOptions(selectedRole) : []

  useEffect(() => {
    const title = registeredUser ? 'Account Created' : selectedRole ? `${selectedRole[0].toUpperCase()}${selectedRole.slice(1)} ${isRegistering ? 'Registration' : 'Login'}` : 'College Portal Login'
    updatePageMetadata(title, 'Secure sign-in and account registration for students, staff, department heads, and college administrators.')
  }, [isRegistering, registeredUser, selectedRole])

  function selectRole(role: LoginRole) {
    setSelectedRole(role)
    setIsRegistering(false)
    setView('form')
    setMessage('')
    setDepartment('')
    setCustomDepartment('')
    setStaffType('staff')
  }

  function back() {
    setMessage('')
    setPassword('')
    if (view === 'form' && selectedRole !== 'student') setView('admin')
    else setView('home')
    setSelectedRole(null)
    setIsRegistering(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRole || submitting) return
    const formData = new FormData(event.currentTarget)
    const selectedDepartment = department === 'Other' ? customDepartment.trim() : department
    setSubmitting(true)
    setMessage('')
    setMessageIsError(false)
    try {
      const payload: Record<string, string> = isRegistering
        ? {
            role: selectedRole,
            displayName: displayName.trim(),
            email: email.trim(),
            password,
            website: String(formData.get('website') ?? ''),
            ...(selectedRole === 'principal'
              ? { collegeName: collegeName.trim() }
              : { collegeCode: collegeCode.trim(), ...(selectedRole !== 'student' ? { department: selectedDepartment } : {}) }),
            ...(selectedRole === 'staff' ? { staffType } : {}),
          }
        : {
            role: selectedRole,
            identifier: email.trim(),
            password,
            website: String(formData.get('website') ?? ''),
          }
      const result = await postJson(isRegistering ? '/api/auth/register' : '/api/auth/login', payload)
      if (isRegistering) setRegisteredUser(result.user)
      else onLoginSuccess(result.user)
    } catch (error) {
      setMessage(error instanceof Error ? errorMessage(error.message) : 'The sign-in service is unavailable. Start the backend and try again.')
      setMessageIsError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const CollegeMark = ({ compact = false }: { compact?: boolean }) => (
    <span className={`login-college-mark${compact ? ' login-college-mark-compact' : ''}`} aria-hidden="true">
      <span className="login-mark-roof" />
      <span className="login-mark-columns"><i /><i /><i /></span>
      <span className="login-mark-base" />
    </span>
  )

  if (registeredUser) {
    return <main className="login-page registration-confirmation"><section className="login-card" aria-labelledby="registration-complete-title"><div className="login-card-heading"><CollegeMark compact /><p className="login-eyebrow">ACCOUNT CREATED</p><h1 id="registration-complete-title">Thank you, {registeredUser.displayName}</h1><p>Your account is ready. Continue to your college portal.</p></div><button className="login-submit" type="button" onClick={() => onLoginSuccess(registeredUser)}>Continue to portal</button><a className="login-confirmation-link" href="/faq">Need help? Read the portal FAQ</a></section></main>
  }

  const card = (choice: RoleChoice) => (
    <button className="role-card" key={choice.id} type="button" onClick={() => selectRole(choice.id)}>
      <span className="role-icon"><choice.icon size={25} strokeWidth={1.8} /></span>
      <span className="role-card-title">{choice.title}</span>
      <span className="role-card-name">{choice.name}</span>
      <span className="role-card-description">{choice.description}</span>
    </button>
  )

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-brand">
          <CollegeMark compact />
          <span><strong>College Management Portal</strong><small>Academic and administration workspace</small></span>
        </div>
        <span className="login-secure-label"><LockKeyhole size={14} /> Secure college access</span>
      </header>

      <main className="login-main">
        {view !== 'home' && (
          <button className="back-to-roles" type="button" onClick={back} disabled={submitting}>
            <ArrowLeft size={16} /> {view === 'form' && selectedRole !== 'student' ? 'Back to admin roles' : 'Back to login options'}
          </button>
        )}

        {view !== 'form' ? (
          <section className="role-selection" aria-labelledby="login-title">
            <div className="login-title-block">
              <CollegeMark />
              <p className="login-eyebrow">COLLEGE MANAGEMENT SYSTEM</p>
              <h1 id="login-title">{view === 'admin' ? 'Choose an admin role' : 'College management, in one place.'}</h1>
              <p className="login-intro">{view === 'admin' ? 'Select the account type you want to access.' : 'Choose how you want to sign in.'}</p>
            </div>
            <div className={`role-grid role-grid-${view}`} aria-label={view === 'admin' ? 'Choose admin role' : 'Choose login type'}>
              {view === 'admin' ? adminChoices.map(card) : (
                <>
                  <button className="role-card" type="button" onClick={() => selectRole('student')}>
                    <span className="role-icon"><GraduationCap size={25} strokeWidth={1.8} /></span>
                    <span className="role-card-title">STUDENT</span>
                    <span className="role-card-name">Student Login</span>
                    <span className="role-card-description">Student portal access</span>
                  </button>
                  <button className="role-card" type="button" onClick={() => { setView('admin'); setMessage('') }}>
                    <span className="role-icon"><ShieldCheck size={25} strokeWidth={1.8} /></span>
                    <span className="role-card-title">ADMIN</span>
                    <span className="role-card-name">Admin Login</span>
                    <span className="role-card-description">Principal, HOD, and staff login</span>
                  </button>
                </>
              )}
            </div>
            <p className="login-footer-note">{view === 'admin' ? 'First-time principal? Choose Principal, then create a college account.' : 'Your college account keeps your information connected to your role.'}</p>
          </section>
        ) : selectedRole ? (
          <section className="login-card" aria-labelledby="form-title">
            <div className="login-card-heading">
              <CollegeMark compact />
              <p className="login-eyebrow">{selectedRole === 'principal' ? 'COLLEGE SETUP' : 'COLLEGE MANAGEMENT PORTAL'}</p>
              <h1 id="form-title">{isRegistering ? selectedRole === 'principal' ? 'Create your college account' : `Create ${selectedRole === 'hod' ? 'HOD' : selectedRole === 'staff' ? staffType === 'in-charge' ? 'In-Charge' : 'Staff' : 'Student'} account` : `${selectedRole === 'principal' ? 'Principal' : selectedRole === 'hod' ? 'HOD' : selectedRole === 'staff' ? staffType === 'in-charge' ? 'In-Charge' : 'Staff' : 'Student'} Login`}</h1>
              <p>{isRegistering ? selectedRole === 'principal' ? 'Register your college and generate its private college code.' : 'Use the college code provided by your principal.' : 'Sign in with your registered college account.'}</p>
            </div>

            <form className="login-form" onSubmit={submit}>
              <div className="login-honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              {isRegistering && selectedRole === 'principal' && (
                <label className="login-field"><span>College name</span><input name="collegeName" autoComplete="organization" value={collegeName} onChange={(event) => setCollegeName(event.target.value)} placeholder="Enter the official college name" required minLength={3} maxLength={160} /></label>
              )}
              {isRegistering && selectedRole !== 'principal' && (
                <label className="login-field">
                  <span>College Code</span>
                  <input autoComplete="organization" name="collegeCode" value={collegeCode} onChange={(event) => setCollegeCode(event.target.value.toUpperCase())} placeholder="Example: SBC-12AB34CD56EF" required />
                </label>
              )}
              {isRegistering && (
                <label className="login-field"><span>Full name</span><input name="displayName" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your full name" required minLength={2} maxLength={100} /></label>
              )}
              <label className="login-field">
                <span>Email address</span>
                <input autoComplete="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@college.edu" required />
              </label>
              {isRegistering && (selectedRole === 'hod' || selectedRole === 'staff') && <>
                {selectedRole === 'staff' && <fieldset className="login-role-picker"><legend>Staff type</legend><button type="button" className={staffType === 'in-charge' ? 'login-role-selected' : ''} aria-pressed={staffType === 'in-charge'} onClick={() => setStaffType('in-charge')}>In-Charge</button><button type="button" className={staffType === 'staff' ? 'login-role-selected' : ''} aria-pressed={staffType === 'staff'} onClick={() => setStaffType('staff')}>Staff</button></fieldset>}
                <label className="login-field"><span>Department</span><select name="department" value={department} onChange={(event) => setDepartment(event.target.value)} required><option value="" disabled>Select your department</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}<option value="Other">Other department</option></select></label>
                {department === 'Other' && <label className="login-field"><span>Enter department name</span><input value={customDepartment} onChange={(event) => setCustomDepartment(event.target.value)} required minLength={2} maxLength={120} placeholder="Department name" /></label>}
              </>}
              <label className="login-field">
                <span>Password {isRegistering && <small>(at least 8 characters)</small>}</span>
                <span className="password-input-wrap">
                  <input autoComplete={isRegistering ? 'new-password' : 'current-password'} name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegistering ? 'Create a strong password' : 'Enter your password'} required minLength={isRegistering ? 8 : undefined} maxLength={128} />
                  <button className="password-visibility" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>

              {message && <p className={`login-message${messageIsError ? ' login-message-error' : ''}`} role={messageIsError ? 'alert' : 'status'}>{message}</p>}
              <button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isRegistering ? selectedRole === 'principal' ? 'Create college and account' : 'Create account' : 'Sign in'}</button>
              {demoLoginOptions.length > 0 && <div className="demo-login-options" aria-label="Development demo accounts">{demoLoginOptions.map((demo) => <button className="demo-login-button" key={demo.email} type="button" onClick={() => { setEmail(demo.email); setPassword(demo.password); setMessage('Demo credentials filled. Select Sign in to continue.'); setMessageIsError(false) }}>{demo.label}</button>)}</div>}
              {!isRegistering && <button className="forgot-link forgot-password-button" type="button" onClick={() => { setMessage('For password recovery, contact your college principal or office. Automated reset email is not configured yet.'); setMessageIsError(false) }}>Forgot password?</button>}
            </form>
            <p className="login-card-footnote">
              {selectedRole === 'principal'
                ? isRegistering ? 'Your college code is generated securely and shown after setup.' : 'Principal sign-in does not require a college code.'
                : isRegistering ? 'Accounts are securely stored by the college portal server.' : 'New to this college? '}
              {selectedRole !== 'principal' && (
                <button className="forgot-link" type="button" onClick={() => { setIsRegistering((value) => !value); setMessage(''); setPassword('') }}>
                  {isRegistering ? 'Already registered? Sign in' : 'Create account'}
                </button>
              )}
              {selectedRole === 'principal' && !isRegistering && (
                <button className="forgot-link" type="button" onClick={() => { setIsRegistering(true); setMessage('') }}>Set up a new college</button>
              )}
            </p>
          </section>
        ) : null}
      </main>

      <footer className="login-page-footer">
        <span>© {new Date().getFullYear()} College Management Portal</span>
        <span>For account assistance, contact your college office.</span>
        <nav aria-label="Information"><a href="/privacy">Privacy policy</a><a href="/faq">FAQ</a></nav>
      </footer>
    </div>
  )
}
