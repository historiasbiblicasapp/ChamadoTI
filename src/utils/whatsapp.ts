/**
 * Formats a phone number for WhatsApp deep-link.
 * Removes non-numeric characters and prepends country code (55 for Brazil) if missing.
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

/**
 * Generates a free WhatsApp web/app link to send a ticket notification.
 */
export function createWhatsAppTicketLink(options: {
  phone?: string;
  ticketNumber: number | string;
  title: string;
  statusLabel?: string;
  customMessage?: string;
}): string {
  const { phone, ticketNumber, title, statusLabel, customMessage } = options;

  let message = `*HelpDesk - ChamadosTiRaitz*\n\n`;
  message += `🎫 *Chamado #${ticketNumber}*: ${title}\n`;
  if (statusLabel) {
    message += `📌 *Status*: ${statusLabel}\n`;
  }
  if (customMessage) {
    message += `\n💬 *Mensagem*: ${customMessage}\n`;
  } else {
    message += `\nOlá! Gostaria de falar sobre a atualização do seu chamado.`;
  }

  const encodedMsg = encodeURIComponent(message);
  const formattedPhone = phone ? formatPhoneNumberForWhatsApp(phone) : '';

  if (formattedPhone) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}
