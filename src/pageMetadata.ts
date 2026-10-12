const collegeName = 'College Management Portal'
const defaultDescription = 'Secure college portal for staff, students, and administrators.'
const socialImage = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&h=630&q=85'

function setMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    const [key, content] = attribute.split('=')
    element.setAttribute(key, content.replace(/"/g, ''))
    document.head.append(element)
  }
  element.content = value
}

export function updatePageMetadata(title: string, description = defaultDescription) {
  const fullTitle = title ? `${title} | ${collegeName}` : `${collegeName} Portal`
  document.title = fullTitle
  setMeta('meta[name="description"]', 'name="description"', description)
  setMeta('meta[property="og:title"]', 'property="og:title"', fullTitle)
  setMeta('meta[property="og:description"]', 'property="og:description"', description)
  setMeta('meta[property="og:type"]', 'property="og:type"', 'website')
  setMeta('meta[property="og:url"]', 'property="og:url"', window.location.href)
  setMeta('meta[property="og:image"]', 'property="og:image"', socialImage)
  setMeta('meta[property="og:image:alt"]', 'property="og:image:alt"', 'College campus')
  setMeta('meta[name="twitter:card"]', 'name="twitter:card"', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'name="twitter:title"', fullTitle)
  setMeta('meta[name="twitter:description"]', 'name="twitter:description"', description)
  setMeta('meta[name="twitter:image"]', 'name="twitter:image"', socialImage)
  window.dispatchEvent(new CustomEvent('portal:pageview', { detail: { title: fullTitle, path: window.location.pathname } }))
}

export { defaultDescription }
