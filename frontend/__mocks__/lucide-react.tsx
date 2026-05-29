import React from 'react';

const createIcon = (name: string) => {
  const Icon = (props: any) => React.createElement('svg', {
    ...props,
    'data-testid': `icon-${name.toLowerCase()}`,
    'aria-hidden': 'true',
  });
  Icon.displayName = name;
  return Icon;
};

export const AlertCircle = createIcon('AlertCircle');
export const CheckCircle = createIcon('CheckCircle');
export const XCircle = createIcon('XCircle');
export const Info = createIcon('Info');
export const X = createIcon('X');
export const Menu = createIcon('Menu');
export const Bell = createIcon('Bell');
export const Search = createIcon('Search');
export const ChevronDown = createIcon('ChevronDown');
export const ChevronLeft = createIcon('ChevronLeft');
export const ChevronRight = createIcon('ChevronRight');
export const ChevronUp = createIcon('ChevronUp');
export const User = createIcon('User');
export const Settings = createIcon('Settings');
export const LogOut = createIcon('LogOut');
export const Loader2 = createIcon('Loader2');
export const Mail = createIcon('Mail');
export const Lock = createIcon('Lock');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const ArrowRight = createIcon('ArrowRight');
export const ArrowLeft = createIcon('ArrowLeft');
export const Trash2 = createIcon('Trash2');
export const Edit3 = createIcon('Edit3');
export const Plus = createIcon('Plus');
export const MoreHorizontal = createIcon('MoreHorizontal');
export const FileText = createIcon('FileText');
export const Download = createIcon('Download');
export const Upload = createIcon('Upload');
export const RefreshCw = createIcon('RefreshCw');
export const Clock = createIcon('Clock');
export const Calendar = createIcon('Calendar');
export const Tag = createIcon('Tag');
export const Filter = createIcon('Filter');
export const SortAsc = createIcon('SortAsc');
export const SortDesc = createIcon('SortDesc');
export const Home = createIcon('Home');
export const BookOpen = createIcon('BookOpen');
export const BarChart3 = createIcon('BarChart3');
export const Server = createIcon('Server');
export const Wifi = createIcon('Wifi');
export const Monitor = createIcon('Monitor');
export const HardDrive = createIcon('HardDrive');
export const Printer = createIcon('Printer');
export const Globe = createIcon('Globe');
export const Database = createIcon('Database');
export const Shield = createIcon('Shield');
export const Activity = createIcon('Activity');
export const PieChart = createIcon('PieChart');
export const TrendingUp = createIcon('TrendingUp');
export const Users = createIcon('Users');
export const Building2 = createIcon('Building2');
export const Ticket = createIcon('Ticket');
export const MessagesSquare = createIcon('MessagesSquare');
export const Paperclip = createIcon('Paperclip');
export const Image = createIcon('Image');
export const Play = createIcon('Play');
export const Pause = createIcon('Pause');
export const StopCircle = createIcon('StopCircle');
export const AlertTriangle = createIcon('AlertTriangle');
export const Check = createIcon('Check');
export const Copy = createIcon('Copy');
export const ExternalLink = createIcon('ExternalLink');
export const Maximize2 = createIcon('Maximize2');
export const Minimize2 = createIcon('Minimize2');
