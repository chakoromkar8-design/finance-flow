import {
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Receipt,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Laptop,
  CircleDollarSign,
} from 'lucide-react'

export const CATEGORY_ICONS = {
  Food: UtensilsCrossed,
  Shopping: ShoppingBag,
  Transport: Car,
  Bills: Receipt,
  Entertainment: Clapperboard,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Salary: Briefcase,
  Freelance: Laptop,
  Other: CircleDollarSign,
}

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CircleDollarSign
}
