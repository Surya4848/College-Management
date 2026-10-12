import { useEffect, useState } from 'react'
import './PrivacyConsent.css'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const consentKey = 'portal-analytics-consent'

type PageViewDetail = { title?: string; path?: string }

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function startAnalytics() {
  if (!measurementId || window.gtag) return
  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.append(script)
}

function sendPageView(detail: PageViewDetail = {}) {
  window.gtag?.('event', 'page_view', {
    page_title: detail.title ?? document.title,
    page_location: window.location.href,
    page_path: detail.path ?? window.location.pathname,
  })
}

export default function PrivacyConsent() {
  const [choice, setChoice] = useState(() => {
    try { return window.localStorage.getItem(consentKey) } catch { return null }
  })

  useEffect(() => {
    if (!measurementId || choice !== 'accepted') return
    startAnalytics()
    sendPageView()
    const handlePageView = (event: Event) => sendPageView((event as CustomEvent<PageViewDetail>).detail)
    window.addEventListener('portal:pageview', handlePageView)
    return () => window.removeEventListener('portal:pageview', handlePageView)
  }, [choice])

  if (!measurementId || choice) return null

  function saveChoice(nextChoice: 'accepted' | 'declined') {
    try { window.localStorage.setItem(consentKey, nextChoice) } catch { /* Keep the choice for this page session. */ }
    setChoice(nextChoice)
  }

  return <aside className="privacy-consent" aria-label="Analytics privacy choice"><div><strong>Optional analytics</strong><p>Allow anonymous usage measurement to help improve the portal. Analytics stay off unless you accept. <a href="/privacy">Privacy details</a></p></div><div className="privacy-consent-actions"><button type="button" className="consent-decline" onClick={() => saveChoice('declined')}>Decline</button><button type="button" className="consent-accept" onClick={() => saveChoice('accepted')}>Accept analytics</button></div></aside>
}
