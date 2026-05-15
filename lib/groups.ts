export type GroupMemberInput = {
  name: string;
  phone: string; // E.164
};

export type CreateGroupInput = {
  orderId: string;
  organizerBuyerId: string;
  members: GroupMemberInput[];
};

/**
 * Validate a phone number in E.164 format (e.g. +18681234567).
 * Must start with +, followed by 7–15 digits.
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Build the WhatsApp invite text an organizer sends to their crew.
 * Kept short and Trini-friendly so it reads naturally when copy-pasted or sent.
 */
export function buildGroupInviteMessage(
  groupId: string,
  eventTitle: string,
  organizerName: string,
  siteUrl: string,
): string {
  const joinUrl = `${siteUrl}/groups/${groupId}/join`;
  return `Yo! ${organizerName} wants you to lock in for ${eventTitle}. Pay your share here: ${joinUrl} — WeFetePass`;
}
