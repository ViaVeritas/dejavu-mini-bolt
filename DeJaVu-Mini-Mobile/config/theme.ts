export interface ColorPalette {
  bg: string;
  card: string;
  cardRaised?: string;
  cardSoft?: string;
  surface?: string;
  text: string;
  muted: string;
  border: string;
  progressTrack?: string;
  accent: string;
  inactive: string;
  btnText?: string;
}

export const lightTheme: ColorPalette = {
  bg: '#f5f5f5',
  card: '#fff',
  cardRaised: '#fff',
  cardSoft: '#f8f9fa',
  surface: '#e9ecef',
  text: '#000',
  muted: '#666',
  border: '#e0e0e0',
  progressTrack: '#e9ecef',
  accent: '#8B5CF6',
  inactive: '#ccc',
  btnText: '#fff'
};

export const darkTheme: ColorPalette = {
  bg: '#1F2937',
  card: '#374151',
  cardRaised: '#1F2937',
  cardSoft: '#111827',
  surface: '#111827',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  border: '#4B5563',
  progressTrack: '#374151',
  accent: '#8B5CF6',
  inactive: '#4B5563',
  btnText: '#fff'
};

export const getThemeColors = (isDarkMode: boolean): ColorPalette => {
  return isDarkMode ? darkTheme : lightTheme;
};