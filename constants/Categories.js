export const CATEGORY_ICONS = {
  Heritage: 'business',
  Nature: 'leaf',
  Temple: 'heart',
  Beach: 'water',
  Wildlife: 'paw',
  All: 'apps',
};

export const CATEGORY_COLORS = {
  Heritage: '#C9A84C',
  Nature: '#10B981',
  Temple: '#F59E0B',
  Beach: '#3B82F6',
  Wildlife: '#8B5CF6',
  All: '#C9A84C',
};

export const CATEGORY_PLACEHOLDER_IMAGES = {
  Heritage: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=70',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=70',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=70',
  ],
  Nature: [
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=70',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=70',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=70',
  ],
  Temple: [
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=70',
    'https://images.unsplash.com/photo-1585116938581-4b3090e7a44f?w=400&q=70',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=70',
  ],
  Beach: [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=70',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=70',
  ],
  Wildlife: [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&q=70',
    'https://images.unsplash.com/photo-1535338454528-1b78bcf4e1c7?w=400&q=70',
    'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&q=70',
  ],
};

export function getPlaceImage(place, index = 0) {
  const imgs = CATEGORY_PLACEHOLDER_IMAGES[place.category] || CATEGORY_PLACEHOLDER_IMAGES.Nature;
  return imgs[index % imgs.length];
}
