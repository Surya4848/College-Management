import { useEffect } from 'react'
import { updatePageMetadata } from '../pageMetadata'
import './PublicPages.css'

type PublicPageKind = 'privacy' | 'faq' | 'not-found'

const descriptions: Record<PublicPageKind, string> = {
  privacy: 'Learn how the college portal uses account information, browser storage, and optional analytics.',
  faq: 'Answers about signing in, college codes, portal access, and account help.',
  'not-found': 'The requested college portal page could not be found.',
}

const titles: Record<PublicPageKind, string> = {
  privacy: 'Privacy Policy',
  faq: 'Frequently Asked Questions',
  'not-found': 'Page Not Found',
}

export default function PublicPages({ page }: { page: PublicPageKind }) {
  useEffect(() => updatePageMetadata(titles[page], descriptions[page]), [page])

  if (page === 'not-found') {
    return <main className="public-page public-not-found"><p className="public-eyebrow">404 · PAGE NOT FOUND</p><h1>This page isn’t available</h1><p>Check the address, or return to the college portal to continue.</p><a className="public-primary-link" href="/">Go to portal</a><a className="public-secondary-link" href="/faq">Visit the help page</a></main>
  }

  if (page === 'faq') {
    return <main className="public-page">
      <header className="public-page-header"><a href="/">College Management Portal</a><nav aria-label="Public pages"><a href="/privacy">Privacy</a><a href="/faq" aria-current="page">FAQ</a></nav></header>
      <section className="public-page-intro"><p className="public-eyebrow">PORTAL HELP</p><h1>Frequently Asked Questions</h1><p>Quick answers for students, staff, HODs, and administrators using the college portal.</p></section>
      <section className="public-faq-list" aria-label="Frequently asked questions">
        <details><summary>How do I sign in?</summary><p>Choose your account type on the portal login page and enter the email and password registered with your college.</p></details>
        <details><summary>Where can I get my college code?</summary><p>Ask your college principal or office for the code. Do not share it outside your college community.</p></details>
        <details><summary>Why can’t I access a staff or student page?</summary><p>Pages require an authenticated account with the appropriate role. If your access is incorrect, contact your department or college office.</p></details>
        <details><summary>Who can help with account problems?</summary><p>Contact your college office or the administrator responsible for your account. Never send your password by email or message.</p></details>
        <details><summary>Does the portal work on mobile?</summary><p>Yes. The navigation opens as a menu drawer on smaller screens, and the portal pages adapt to mobile layouts.</p></details>
      </section>
      <footer className="public-page-footer"><a href="/">Portal home</a><a href="/privacy">Privacy policy</a></footer>
    </main>
  }

  return <main className="public-page">
    <header className="public-page-header"><a href="/">College Management Portal</a><nav aria-label="Public pages"><a href="/privacy" aria-current="page">Privacy</a><a href="/faq">FAQ</a></nav></header>
    <section className="public-page-intro"><p className="public-eyebrow">COLLEGE PORTAL</p><h1>Privacy Policy</h1><p>What information the portal handles and how it is used.</p></section>
    <article className="public-policy">
      <p className="public-policy-updated">Last updated: 12 October 2026</p>
      <h2>Information handled by the portal</h2><p>When an account is created or used, the portal processes account details such as name, email address, role, department, and college association. Staff and student profile details entered in the portal are used to provide the relevant academic and administrative features.</p>
      <h2>How information is used</h2><p>Information is used to authenticate accounts, display role-appropriate portal pages, manage academic records, and operate college services. Account passwords are stored as password hashes by the portal server, not as readable passwords.</p>
      <h2>Browser storage and cookies</h2><p>The portal uses an HTTP-only session cookie for sign-in. Some preferences, profile edits, and notification state may be stored in this browser’s local storage. Clearing browser storage may remove those locally saved preferences or edits.</p>
      <h2>Optional analytics</h2><p>Analytics are disabled unless the college configures an analytics measurement ID and you choose to allow analytics. You can change your choice by clearing this site’s local storage and revisiting the portal.</p>
      <h2>Sharing, retention, and your choices</h2><p>Portal account and academic information is intended for authorized college use. You may contact your college office to request access to or correction of account details, or to ask whether information can be removed. Requests may be subject to academic-record retention requirements and college policy. Do not enter sensitive information into a browser that you do not control.</p>
      <h2>Questions</h2><p>For privacy questions or account-data requests, contact your college office or the administrator responsible for the portal.</p>
    </article>
    <footer className="public-page-footer"><a href="/">Portal home</a><a href="/faq">Frequently asked questions</a></footer>
  </main>
}
