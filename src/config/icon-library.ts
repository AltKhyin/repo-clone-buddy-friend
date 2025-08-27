// ABOUTME: Comprehensive icon library configuration with healthcare focus for avatar system

import {
  // General UI Icons
  User, Users, BookOpen, Home, Settings, Star, Crown, Shield,
  Award, Target, Zap, Flame, Sun, Moon, Coffee, Volume2,
  Camera, Palette, Brush, Pen, Book, Calendar, Globe,
  
  // Storage & Organization Icons
  Archive, Box, Package, Folder, Inbox,
  
  // Healthcare & Medical Icons
  Heart, Activity, HeartPulse, Hospital, Brain, Ambulance,
  Stethoscope, Pill, Plus, Thermometer, Syringe, Microscope,
  TestTube, Dna, Bandage, Eye, Cross, Clipboard,
  
  // Emergency & Safety Icons
  AlertTriangle, ShieldCheck, Phone, MapPin, Clock,
  
  // Science & Research Icons
  Atom, Beaker, Search,
  
  type LucideIcon
} from 'lucide-react';

export interface IconDefinition {
  id: string;
  name: string;
  component: LucideIcon;
  category: IconCategory;
  description: string;
  keywords: string[];
}

export type IconCategory = 
  | 'general'
  | 'storage'
  | 'healthcare' 
  | 'emergency'
  | 'science'
  | 'ui';

// Complete icon library with organized categories and metadata
export const iconLibrary: IconDefinition[] = [
  // General UI Icons
  {
    id: 'user',
    name: 'User',
    component: User,
    category: 'ui',
    description: 'Single user profile',
    keywords: ['person', 'profile', 'account', 'individual']
  },
  {
    id: 'users',
    name: 'Users',
    component: Users,
    category: 'ui',
    description: 'Multiple users or community',
    keywords: ['community', 'team', 'group', 'people']
  },
  {
    id: 'home',
    name: 'Home',
    component: Home,
    category: 'ui',
    description: 'Home or main page',
    keywords: ['house', 'main', 'start', 'homepage']
  },
  {
    id: 'bookopen',
    name: 'Book Open',
    component: BookOpen,
    category: 'ui',
    description: 'Open book or reading',
    keywords: ['read', 'study', 'learn', 'education']
  },
  {
    id: 'settings',
    name: 'Settings',
    component: Settings,
    category: 'ui',
    description: 'Configuration and preferences',
    keywords: ['config', 'preferences', 'admin', 'gear']
  },
  {
    id: 'star',
    name: 'Star',
    component: Star,
    category: 'ui',
    description: 'Rating or favorite',
    keywords: ['favorite', 'rating', 'quality', 'premium']
  },
  {
    id: 'crown',
    name: 'Crown',
    component: Crown,
    category: 'ui',
    description: 'Premium or leadership',
    keywords: ['premium', 'king', 'leader', 'royalty']
  },
  {
    id: 'shield',
    name: 'Shield',
    component: Shield,
    category: 'ui',
    description: 'Protection and security',
    keywords: ['security', 'protection', 'safety', 'guard']
  },
  {
    id: 'award',
    name: 'Award',
    component: Award,
    category: 'ui',
    description: 'Achievement or recognition',
    keywords: ['trophy', 'achievement', 'recognition', 'winner']
  },
  {
    id: 'target',
    name: 'Target',
    component: Target,
    category: 'ui',
    description: 'Goal or objective',
    keywords: ['goal', 'objective', 'aim', 'focus']
  },
  {
    id: 'zap',
    name: 'Zap',
    component: Zap,
    category: 'ui',
    description: 'Energy or power',
    keywords: ['energy', 'power', 'electric', 'fast']
  },
  {
    id: 'flame',
    name: 'Flame',
    component: Flame,
    category: 'ui',
    description: 'Fire or intensity',
    keywords: ['fire', 'hot', 'intensity', 'passion']
  },
  {
    id: 'sun',
    name: 'Sun',
    component: Sun,
    category: 'ui',
    description: 'Light or day mode',
    keywords: ['light', 'day', 'bright', 'weather']
  },
  {
    id: 'moon',
    name: 'Moon',
    component: Moon,
    category: 'ui',
    description: 'Night or dark mode',
    keywords: ['night', 'dark', 'sleep', 'evening']
  },
  {
    id: 'coffee',
    name: 'Coffee',
    component: Coffee,
    category: 'ui',
    description: 'Coffee or break time',
    keywords: ['drink', 'break', 'energy', 'morning']
  },
  {
    id: 'music',
    name: 'Music',
    component: Volume2,
    category: 'ui',
    description: 'Audio or music',
    keywords: ['sound', 'audio', 'music', 'volume']
  },
  {
    id: 'camera',
    name: 'Camera',
    component: Camera,
    category: 'ui',
    description: 'Photography or media',
    keywords: ['photo', 'image', 'media', 'picture']
  },
  {
    id: 'palette',
    name: 'Palette',
    component: Palette,
    category: 'ui',
    description: 'Design or creativity',
    keywords: ['color', 'design', 'art', 'creative']
  },
  {
    id: 'brush',
    name: 'Brush',
    component: Brush,
    category: 'ui',
    description: 'Painting or design',
    keywords: ['paint', 'art', 'design', 'creative']
  },
  {
    id: 'pen',
    name: 'Pen',
    component: Pen,
    category: 'ui',
    description: 'Writing or editing',
    keywords: ['write', 'edit', 'author', 'text']
  },
  {
    id: 'book',
    name: 'Book',
    component: Book,
    category: 'ui',
    description: 'Documentation or learning',
    keywords: ['docs', 'manual', 'guide', 'education']
  },
  {
    id: 'calendar',
    name: 'Calendar',
    component: Calendar,
    category: 'ui',
    description: 'Date or scheduling',
    keywords: ['date', 'time', 'schedule', 'appointment']
  },
  {
    id: 'globe',
    name: 'Globe',
    component: Globe,
    category: 'ui',
    description: 'Global or international',
    keywords: ['world', 'global', 'international', 'earth']
  },

  // Storage & Organization Icons
  {
    id: 'archive',
    name: 'Archive',
    component: Archive,
    category: 'storage',
    description: 'Archive or storage collection',
    keywords: ['storage', 'archive', 'collection', 'acervo', 'repository']
  },
  {
    id: 'box',
    name: 'Box',
    component: Box,
    category: 'storage',
    description: 'Box or container',
    keywords: ['box', 'container', 'storage', 'package']
  },
  {
    id: 'package',
    name: 'Package',
    component: Package,
    category: 'storage',
    description: 'Package or delivery box',
    keywords: ['package', 'delivery', 'box', 'shipping']
  },
  {
    id: 'folder',
    name: 'Folder',
    component: Folder,
    category: 'storage',
    description: 'Folder or directory',
    keywords: ['folder', 'directory', 'organize', 'files']
  },
  {
    id: 'inbox',
    name: 'Inbox',
    component: Inbox,
    category: 'storage',
    description: 'Inbox or collection tray',
    keywords: ['inbox', 'tray', 'collect', 'organize']
  },

  // Healthcare & Medical Icons
  {
    id: 'heart',
    name: 'Heart',
    component: Heart,
    category: 'healthcare',
    description: 'Heart or love',
    keywords: ['cardiology', 'love', 'health', 'vital']
  },
  {
    id: 'activity',
    name: 'Activity',
    component: Activity,
    category: 'healthcare',
    description: 'Heart rate or vital signs',
    keywords: ['heartrate', 'vital', 'monitor', 'pulse']
  },
  {
    id: 'heartpulse',
    name: 'Heart Pulse',
    component: HeartPulse,
    category: 'healthcare',
    description: 'Cardiac monitoring',
    keywords: ['cardiology', 'pulse', 'heartbeat', 'monitor']
  },
  {
    id: 'hospital',
    name: 'Hospital',
    component: Hospital,
    category: 'healthcare',
    description: 'Hospital or medical facility',
    keywords: ['clinic', 'medical', 'facility', 'care']
  },
  {
    id: 'brain',
    name: 'Brain',
    component: Brain,
    category: 'healthcare',
    description: 'Neurology or mental health',
    keywords: ['neurology', 'mind', 'psychology', 'cognitive']
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    component: Ambulance,
    category: 'healthcare',
    description: 'Emergency medical services',
    keywords: ['emergency', 'ems', 'rescue', 'transport']
  },
  {
    id: 'stethoscope',
    name: 'Stethoscope',
    component: Stethoscope,
    category: 'healthcare',
    description: 'Medical examination',
    keywords: ['doctor', 'examination', 'diagnosis', 'medical']
  },
  {
    id: 'pill',
    name: 'Pill',
    component: Pill,
    category: 'healthcare',
    description: 'Medication or pharmacy',
    keywords: ['medicine', 'drug', 'pharmacy', 'treatment']
  },
  {
    id: 'plus',
    name: 'Plus',
    component: Plus,
    category: 'healthcare',
    description: 'Medical cross or addition',
    keywords: ['medical', 'add', 'positive', 'cross']
  },
  {
    id: 'thermometer',
    name: 'Thermometer',
    component: Thermometer,
    category: 'healthcare',
    description: 'Temperature monitoring',
    keywords: ['temperature', 'fever', 'vital', 'measure']
  },
  {
    id: 'syringe',
    name: 'Syringe',
    component: Syringe,
    category: 'healthcare',
    description: 'Injection or vaccination',
    keywords: ['vaccine', 'injection', 'immunization', 'needle']
  },
  {
    id: 'microscope',
    name: 'Microscope',
    component: Microscope,
    category: 'healthcare',
    description: 'Laboratory analysis',
    keywords: ['lab', 'analysis', 'research', 'diagnostic']
  },
  {
    id: 'testtube',
    name: 'Test Tube',
    component: TestTube,
    category: 'healthcare',
    description: 'Laboratory testing',
    keywords: ['lab', 'test', 'sample', 'analysis']
  },
  {
    id: 'dna',
    name: 'DNA',
    component: Dna,
    category: 'healthcare',
    description: 'Genetics or molecular biology',
    keywords: ['genetics', 'molecular', 'biology', 'genome']
  },
  {
    id: 'bandage',
    name: 'Bandage',
    component: Bandage,
    category: 'healthcare',
    description: 'First aid or wound care',
    keywords: ['firstaid', 'wound', 'care', 'injury']
  },
  {
    id: 'eye',
    name: 'Eye',
    component: Eye,
    category: 'healthcare',
    description: 'Vision or ophthalmology',
    keywords: ['vision', 'sight', 'ophthalmology', 'see']
  },
  {
    id: 'cross',
    name: 'Cross',
    component: Cross,
    category: 'healthcare',
    description: 'Medical symbol or healthcare',
    keywords: ['medical', 'healthcare', 'hospital', 'aid']
  },
  {
    id: 'clipboard',
    name: 'Clipboard',
    component: Clipboard,
    category: 'healthcare',
    description: 'Medical records or documentation',
    keywords: ['records', 'chart', 'document', 'patient']
  },

  // Emergency & Safety Icons
  {
    id: 'alerttriangle',
    name: 'Alert Triangle',
    component: AlertTriangle,
    category: 'emergency',
    description: 'Warning or alert',
    keywords: ['warning', 'danger', 'alert', 'caution']
  },
  {
    id: 'shieldcheck',
    name: 'Shield Check',
    component: ShieldCheck,
    category: 'emergency',
    description: 'Verified security',
    keywords: ['verified', 'secure', 'safe', 'protected']
  },
  {
    id: 'phone',
    name: 'Phone',
    component: Phone,
    category: 'emergency',
    description: 'Emergency contact',
    keywords: ['call', 'emergency', 'contact', 'communication']
  },
  {
    id: 'mappin',
    name: 'Map Pin',
    component: MapPin,
    category: 'emergency',
    description: 'Location or emergency services',
    keywords: ['location', 'gps', 'address', 'place']
  },
  {
    id: 'clock',
    name: 'Clock',
    component: Clock,
    category: 'emergency',
    description: 'Time or scheduling',
    keywords: ['time', 'schedule', 'appointment', 'urgent']
  },

  // Science & Research Icons
  {
    id: 'atom',
    name: 'Atom',
    component: Atom,
    category: 'science',
    description: 'Science or physics',
    keywords: ['science', 'physics', 'research', 'molecular']
  },
  {
    id: 'beaker',
    name: 'Beaker',
    component: Beaker,
    category: 'science',
    description: 'Laboratory work',
    keywords: ['lab', 'chemistry', 'experiment', 'analysis']
  },
  {
    id: 'search',
    name: 'Search',
    component: Search,
    category: 'science',
    description: 'Research or investigation',
    keywords: ['research', 'find', 'investigate', 'study']
  },
  {
    id: 'archive',
    name: 'Archive',
    component: Archive,
    category: 'science',
    description: 'Data storage or research archives',
    keywords: ['data', 'storage', 'research', 'repository']
  }
];

// Helper functions for icon management
export const getIconById = (id: string): IconDefinition | undefined => {
  return iconLibrary.find(icon => icon.id === id);
};

export const getIconsByCategory = (category: IconCategory): IconDefinition[] => {
  return iconLibrary.filter(icon => icon.category === category);
};

export const searchIcons = (query: string): IconDefinition[] => {
  const lowercaseQuery = query.toLowerCase();
  return iconLibrary.filter(icon => 
    icon.name.toLowerCase().includes(lowercaseQuery) ||
    icon.description.toLowerCase().includes(lowercaseQuery) ||
    icon.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
  );
};

export const getIconComponent = (iconId: string): LucideIcon => {
  const icon = getIconById(iconId);
  return icon?.component || User;
};

// Icon categories with metadata
export const iconCategories: Record<IconCategory, { name: string; description: string }> = {
  general: {
    name: 'General',
    description: 'Common UI and interface icons'
  },
  storage: {
    name: 'Storage',
    description: 'Storage and organization icons'
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Medical and healthcare-related icons'
  },
  emergency: {
    name: 'Emergency',
    description: 'Emergency and safety icons'
  },
  science: {
    name: 'Science',
    description: 'Scientific and research icons'
  },
  ui: {
    name: 'Interface',
    description: 'User interface and navigation icons'
  }
};

