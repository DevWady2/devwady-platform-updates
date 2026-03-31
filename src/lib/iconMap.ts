import { Smartphone, Globe, Monitor, Layers, TrendingUp, Users, Star, Truck, GraduationCap, Building2, UtensilsCrossed, ShieldCheck, Car, Dog, Dumbbell, Home, Scissors, Wrench, WashingMachine, Server, Palette, Headphones, BookOpen, UserPlus, Code2, Search, PenTool, Hammer, TestTube, Rocket, RefreshCw, Briefcase, UsersRound, MonitorSmartphone, Brain, Lock, Apple, Trophy, type LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Smartphone, Globe, Monitor, Layers, TrendingUp, Users, Star, Truck,
  GraduationCap, Building2, UtensilsCrossed, ShieldCheck, Car, Dog,
  Dumbbell, Home, Scissors, Wrench, WashingMachine, Server, Palette,
  Headphones, BookOpen, UserPlus, Code2, Search, PenTool, Hammer,
  TestTube, Rocket, RefreshCw, Briefcase, UsersRound, MonitorSmartphone,
  Brain, Lock, Apple, Trophy,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Layers;
}

export const availableIcons = Object.keys(iconMap);
