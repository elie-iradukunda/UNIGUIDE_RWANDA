const fallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="10" fill="#f1f5f9"/>
  <path d="M25 34l23-12 23 12v28L48 74 25 62V34z" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linejoin="round"/>
  <path d="M25 34l23 12 23-12M48 46v28" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const equipmentFallbackImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;

export const handleImageError = (event) => {
  if (event.currentTarget.src !== equipmentFallbackImage) {
    event.currentTarget.src = equipmentFallbackImage;
  }
};
