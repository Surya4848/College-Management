import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Image, X } from 'lucide-react'
import './Gallery.css'

type GalleryCategory = 'All photos' | 'Campus' | 'Events' | 'Sports' | 'Academics'

type GalleryPhoto = {
	id: number
	title: string
	category: Exclude<GalleryCategory, 'All photos'>
	date: string
	image: string
	alt: string
}

const categories: GalleryCategory[] = ['All photos', 'Campus', 'Events', 'Sports', 'Academics']

const photos: GalleryPhoto[] = [
	{ id: 1, title: 'Innovation Showcase', category: 'Academics', date: '08 Sep 2026', image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=85', alt: 'Students attending a campus presentation' },
	{ id: 2, title: 'Cultural Fest', category: 'Events', date: '25 Aug 2026', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85', alt: 'Crowd enjoying a live campus event' },
	{ id: 3, title: 'College Campus', category: 'Campus', date: '18 Aug 2026', image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=85', alt: 'College buildings across a green campus' },
	{ id: 4, title: 'Department Cricket', category: 'Sports', date: '12 Aug 2026', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=85', alt: 'Cricket match on a grass field' },
	{ id: 5, title: 'New Student Orientation', category: 'Events', date: '10 Aug 2026', image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=85', alt: 'Students gathered for an orientation event' },
	{ id: 6, title: 'Computer Science Lab', category: 'Academics', date: '04 Aug 2026', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85', alt: 'Students working together at computers' },
	{ id: 7, title: 'Campus Green', category: 'Campus', date: '29 Jul 2026', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85', alt: 'Bright learning space with students' },
	{ id: 8, title: 'Volleyball Practice', category: 'Sports', date: '24 Jul 2026', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=85', alt: 'Volleyball players practicing on court' },
]

export default function Gallery() {
	const [category, setCategory] = useState<GalleryCategory>('All photos')
	const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)

	const visiblePhotos = useMemo(
		() => category === 'All photos' ? photos : photos.filter((photo) => photo.category === category),
		[category],
	)

	function movePhoto(direction: number) {
		if (!selectedPhoto) return
		const currentIndex = visiblePhotos.findIndex((photo) => photo.id === selectedPhoto.id)
		const nextIndex = (currentIndex + direction + visiblePhotos.length) % visiblePhotos.length
		setSelectedPhoto(visiblePhotos[nextIndex])
	}

	return (
		<div className="inner-page gallery-page">
			<div className="inner-title-row">
				<div><p className="eyebrow">CAMPUS MOMENTS</p><h1>Gallery</h1><p>Photos from campus, department events, and student life.</p></div>
				<span className="gallery-total"><Image size={15} /> {visiblePhotos.length} photos</span>
			</div>

			<div className="gallery-filters" role="group" aria-label="Filter gallery photos">
				{categories.map((item) => <button key={item} className={category === item ? 'gallery-filter-active' : ''} onClick={() => { setCategory(item); setSelectedPhoto(null) }}>{item}</button>)}
			</div>

			<div className="gallery-grid">
				{visiblePhotos.map((photo) => (
					<button className="gallery-photo" key={photo.id} onClick={() => setSelectedPhoto(photo)} aria-label={`Preview ${photo.title}`}>
						<img src={photo.image} alt={photo.alt} loading="lazy" />
						<span className="gallery-photo-info"><span><strong>{photo.title}</strong><small><CalendarDays size={12} /> {photo.date}</small></span><span className="gallery-category">{photo.category}</span></span>
					</button>
				))}
			</div>

			{selectedPhoto && (
				<div className="gallery-lightbox" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPhoto(null) }}>
					<section className="gallery-lightbox-content" role="dialog" aria-modal="true" aria-label={selectedPhoto.title}>
						<button className="gallery-close icon-button" aria-label="Close preview" onClick={() => setSelectedPhoto(null)}><X size={19} /></button>
						<button className="gallery-previous icon-button" aria-label="Previous photo" onClick={() => movePhoto(-1)}><ChevronLeft size={21} /></button>
						<img src={selectedPhoto.image} alt={selectedPhoto.alt} />
						<button className="gallery-next icon-button" aria-label="Next photo" onClick={() => movePhoto(1)}><ChevronRight size={21} /></button>
						<div className="gallery-lightbox-caption"><strong>{selectedPhoto.title}</strong><span>{selectedPhoto.category} · {selectedPhoto.date}</span></div>
					</section>
				</div>
			)}
		</div>
	)
}
