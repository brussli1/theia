import {
  Award,
  BadgeCheck,
  Clock,
  CreditCard,
  Eye,
  Globe,
  GraduationCap,
  Handshake,
  Headset,
  Microscope,
  Package,
  ShieldCheck,
  Stethoscope,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  truck: Truck,
  wrench: Wrench,
  award: Award,
  headset: Headset,
  'graduation-cap': GraduationCap,
  'credit-card': CreditCard,
  eye: Eye,
  microscope: Microscope,
  stethoscope: Stethoscope,
  clock: Clock,
  globe: Globe,
  package: Package,
  'badge-check': BadgeCheck,
  handshake: Handshake,
}

/** Renders one of the icons editors can pick in the admin (see ICON_OPTIONS). */
export function NamedIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && icons[name]) || BadgeCheck
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />
}
