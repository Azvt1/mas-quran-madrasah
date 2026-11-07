import { RoleTabs } from '@/components/role-tabs';

export default function TeacherLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', label: 'Home', sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
        { name: 'students', label: 'Students', sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group' },
        { name: 'attendance', label: 'Attendance', sf: { default: 'checklist', selected: 'checklist' }, md: 'event_available' },
        { name: 'homework', label: 'Homework', sf: { default: 'book', selected: 'book.fill' }, md: 'menu_book' },
        { name: 'profile', label: 'Profile', sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' }, md: 'account_circle' },
      ]}
    />
  );
}
