import {
  Home,
  ShoppingCart,
  Trophy,
  Flower2,
  Recycle,
  Moon,
  Coins,
  Users,
  Wrench,
  Snowflake,
  Zap,
  Scissors,
  ChefHat,
  GraduationCap,
  Car,
  Palette,
  Code2,
  Camera,
  Sparkles,
  Building2,
  type LucideIcon,
} from 'lucide-react'

// Maps a string key to a lucide icon — used so data files never embed emoji.
export const iconRegistry: Record<string, LucideIcon> = {
  home: Home,
  cart: ShoppingCart,
  trophy: Trophy,
  flower: Flower2,
  recycle: Recycle,
  moon: Moon,
  coins: Coins,
  users: Users,
  // skill categories
  tukang: Wrench,
  ac: Snowflake,
  listrik: Zap,
  penjahit: Scissors,
  catering: ChefHat,
  guru: GraduationCap,
  driver: Car,
  desainer: Palette,
  programmer: Code2,
  fotografer: Camera,
  makeup: Sparkles,
  building: Building2,
}

export function getIcon(key: string): LucideIcon {
  return iconRegistry[key] ?? Users
}
