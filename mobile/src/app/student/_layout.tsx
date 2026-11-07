import { RoleTabs } from '@/components/role-tabs';

export default function StudentLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', label: 'Home', sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
        { name: 'homework', label: 'Homework', sf: { default: 'book', selected: 'book.fill' }, md: 'menu_book' },
        { name: 'attendance', label: 'Attendance', sf: { default: 'calendar', selected: 'calendar' }, md: 'calendar_month' },
        { name: 'progress', label: 'Progress', sf: { default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }, md: 'trending_up' },
        { name: 'profile', label: 'Profile', sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' }, md: 'account_circle' },
      ]}
    />
  );
}
