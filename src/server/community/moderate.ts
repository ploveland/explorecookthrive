import { COMMENT_MAX_LENGTH, cleanComment } from "./policy";

const LINK_PATTERN =
  /https?:\/\/|\bwww\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\bt\.me\/|\bdiscord\.gg\/|\bbit\.ly\/|\btinyurl\.com\b/i;

const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{8,}\d)/;

const SPAM_PHRASE_PATTERN =
  /\b(click here|buy now|work from home|make money|limited offer|dm me|whatsapp|telegram|onlyfans|viagra|cialis|crypto|bitcoin|\bnft\b|casino|lottery|porn|xxx)\b/i;

const ABUSE_PATTERN = new RegExp(
  `\\b(${[
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "bastard",
    "dick",
    "pussy",
    "cunt",
    "nigger",
    "nigga",
    "faggot",
    "retard",
    "tranny",
  ].join("|")})\\b`,
  "i",
);

export const COMMENT_REJECTED_MESSAGE =
  "Keep the note about cooking this dish. We do not publish links, ads, or abusive language.";

export function moderateComment(
  raw: string | null | undefined,
): { ok: true; comment: string | null } | { ok: false } {
  const comment = cleanComment(raw);
  if (!comment) return { ok: true, comment: null };
  if (comment.length > COMMENT_MAX_LENGTH) return { ok: false };
  if (LINK_PATTERN.test(comment) || PHONE_PATTERN.test(comment)) return { ok: false };
  if (SPAM_PHRASE_PATTERN.test(comment) || ABUSE_PATTERN.test(comment)) return { ok: false };
  if (/(.)\1{7,}/.test(comment)) return { ok: false };
  const letters = comment.replace(/[^\p{L}]+/gu, "");
  if (comment.length >= 20 && letters.length / comment.length < 0.4) return { ok: false };
  return { ok: true, comment };
}
