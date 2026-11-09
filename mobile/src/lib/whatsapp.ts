import { Alert, Linking } from 'react-native';

import { formatSessionDate } from '@/lib/greeting';

export interface UpcomingItem {
  title: string;
  dueDate: string | null;
  instructions?: string | null;
}

function upcomingLines(items: UpcomingItem[]): string {
  return items
    .map((i) => {
      const due = i.dueDate ? ` (due ${formatSessionDate(i.dueDate)})` : '';
      const note = i.instructions?.trim() ? `   📝 ${i.instructions.trim()}\n` : '';
      return `• ${i.title}${due}\n${note}`;
    })
    .join('');
}

// Same message format as the website's HomeworkWhatsAppButton.
export function homeworkMessage(opts: {
  studentName: string;
  homeworkTitle: string;
  isCompleted?: boolean | null;
  behaviorSatisfactory?: boolean | null;
  feedback?: string | null;
  upcoming?: UpcomingItem[];
}): string {
  const { studentName, homeworkTitle, isCompleted, behaviorSatisfactory, feedback, upcoming } = opts;
  const firstName = studentName.split(' ')[0];
  const hasFeedback = isCompleted !== null && isCompleted !== undefined;

  let msg = `Assalamu Alaykum,\n\nThis is a message from the madrasa regarding ${studentName}.\n\n`;
  msg += `📖 *Homework:* ${homeworkTitle}\n`;
  if (hasFeedback) {
    msg += `✅ *Completed:* ${isCompleted ? 'Yes' : 'No'}\n`;
    if (behaviorSatisfactory !== null && behaviorSatisfactory !== undefined) {
      msg += `🌟 *Behaviour:* ${behaviorSatisfactory ? 'Satisfactory' : 'Needs improvement'}\n`;
    }
    if (feedback?.trim()) msg += `\n💬 *Teacher's feedback:*\n${feedback.trim()}\n`;
  }
  if (upcoming?.length) {
    msg += `\n━━━━━━━━━━━━━━━\n📚 *Upcoming homework for ${firstName}:*\n`;
    msg += upcomingLines(upcoming);
  }
  msg += `\nJazakAllahu Khayran.`;
  return msg;
}

/** General message to a parent listing the student's current homework. */
export function homeworkListMessage(studentName: string, items: UpcomingItem[]): string {
  const firstName = studentName.split(' ')[0];
  let msg = `Assalamu Alaykum,\n\nThis is a message from the madrasa regarding ${studentName}.\n`;
  if (items.length) {
    msg += `\n📚 *Upcoming homework for ${firstName}:*\n`;
    msg += upcomingLines(items);
  }
  msg += `\nJazakAllahu Khayran.`;
  return msg;
}

/** Opens WhatsApp with a pre-filled message to the parent. */
export async function openWhatsApp(phone: string, message = '') {
  const digits = phone.replace(/[^\d]/g, '');
  const url = `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open WhatsApp', 'Check that WhatsApp is installed on this phone.');
  }
}
