import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVoteCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}

export function formatPlayerCount(current: number, max: number): string {
  return `${current}/${max} Players`;
}

export function getRegionDisplay(region: string): string {
  const regions: Record<string, string> = {
    'na': 'North America',
    'eu': 'Europe',
    'asia': 'Asia',
    'sa': 'South America',
    'oce': 'Oceania',
    'af': 'Africa',
  };
  
  return regions[region] || region;
}

export function getRegionLocation(region: string): string {
  const locations: Record<string, string> = {
    'na-east': 'North America (New York)',
    'na-central': 'North America (Chicago)',
    'na-west': 'North America (Los Angeles)',
    'na-south': 'North America (Dallas)',
    'eu-west': 'Europe (London)',
    'eu-central': 'Europe (Frankfurt)',
    'eu-north': 'Europe (Stockholm)',
    'asia-east': 'Asia (Tokyo)',
    'asia-south': 'Asia (Singapore)',
    'sa-east': 'South America (Brazil)',
    'oce': 'Oceania (Sydney)',
  };
  
  return locations[region] || getRegionDisplay(region);
}

export function generateSteamConnectLink(ip: string, port: number): string {
  return `steam://connect/${ip}:${port}`;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
