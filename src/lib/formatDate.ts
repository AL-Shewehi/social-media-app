import { formatDistanceToNow } from 'date-fns';
import { arEG } from 'date-fns/locale';

export function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: arEG });
  } catch (error) {
    return 'مؤخراً';
  }
}