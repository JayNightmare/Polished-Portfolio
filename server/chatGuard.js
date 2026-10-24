import { randomBytes } from 'node:crypto';

// Planted in the system prompt; seeing it in a reply means the prompt leaked.
export const PROMPT_CANARY = `canary-${randomBytes(6).toString('hex')}`;

export const INPUT_REFUSAL =
    "I can only help with questions about Jay, this portfolio, his projects and his blog. I can't follow instructions that change my behavior, share my configuration, or write code.";

export const OUTPUT_REFUSAL =
    "I can't share that here. For Jay's code, you can browse his repositories on GitHub.";

const INVISIBLE_CHARS =
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/gu;

// Common Cyrillic/Greek look-alikes that survive NFKC.
const CONFUSABLES = {
    а: 'a',
    е: 'e',
    о: 'o',
    р: 'p',
    с: 'c',
    у: 'y',
    х: 'x',
    і: 'i',
    ј: 'j',
    ѕ: 's',
    ο: 'o',
    ν: 'v',
    α: 'a',
    ε: 'e',
    ι: 'i',
    κ: 'k',
    ρ: 'p',
    τ: 't',
};

const INJECTION_PHRASES = [
    /\b(ignore|disregard|forget|override|bypass|skip)\b.{0,40}\b(previous|prior|above|earlier|all|your|any|the)\b.{0,30}\b(instructions?|prompts?|rules?|guidelines?|directives?|restrictions?|constraints?|programming|polic(y|ies))\b/,
    /\b(reveal|show|print|repeat|display|output|leak|dump|tell me|give me|what (is|are|were))\b.{0,40}\b(system|initial|hidden|original|secret|internal)\b.{0,20}\b(prompt|instructions?|message|rules?|configuration|context)\b/,
    /\b(repeat|print|output)\b.{0,30}\b(text|everything|words?)\b.{0,20}\b(above|before)\b/,
    /\bwhat (were|are) (your|the) (exact )?(instructions|rules|guidelines)\b/,
    /\b(developer|debug|admin|god|sudo|dan|jailbreak(ed)?|unrestricted|unfiltered) mode\b/,
    /\bdo anything now\b/,
    /\bjail ?break/,
    /\b(you are|you're|youre) now\b/,
    /\bfrom now on,? (you|act|respond|ignore)\b/,
    /\b(pretend|act|behave|roleplay|role play) (to be|as|like)\b/,
    /\bnew (instructions?|rules?|persona|role)\s*:/,
    /^\s*(system|assistant|developer)\s*:/m,
    /\b(prompt injection|injection payload|ignore previous)\b/,
    /\bwithout (any )?(restrictions?|limits?|filters?|rules?|safety)\b/,
];

// Imperative request for code or executable content.
const CODE_REQUEST_PATTERNS = [
    /\b(write|generate|produce|compose|draft|code me)\b.{0,50}\b(code|scripts?|functions?|snippets?|program|payloads?|exploits?|regex|sql quer(y|ies)|shell commands?|bash|powershell|python|javascript|typescript|html|css|java|c\+\+|rust|golang)\b/,
    /\b(give me|provide|make me|build me)\b.{0,20}\b(a |an |some |the )?(code|scripts?|snippets?|payloads?|exploits?|shell commands?)\b/,
    /\b(prompts?|jailbreaks?)\b.{0,30}\b(inject|injection|bypass|attack)/,
    /\b(inject|injection)\b.{0,30}\b(prompts?|payloads?)/,
];

const ENCODING_REQUESTS =
    /\b(decode|decrypt|rot13|base64|hex)\b.{0,40}\b(this|following|string|message|text)\b/;

const SCRAMBLE_VERBS = [
    'ignore',
    'disregard',
    'forget',
    'override',
    'bypass',
    'reveal',
    'repeat',
    'leak',
];
const SCRAMBLE_NOUNS = [
    'instructions',
    'prompt',
    'rules',
    'guidelines',
    'restrictions',
    'directives',
    'programming',
];

function isScrambleOf(token, target) {
    if (token.length !== target.length || token.length < 4) return false;
    if (token[0] !== target[0] || token[token.length - 1] !== target[target.length - 1])
        return false;
    return [...token].sort().join('') === [...target].sort().join('');
}

export function normalizeForScreening(text) {
    const folded = String(text)
        .normalize('NFKC')
        .replace(INVISIBLE_CHARS, '')
        .toLowerCase()
        .replace(/[а-яіјѕοναειτκρ]/g, (char) => CONFUSABLES[char] ?? char);

    return folded.replace(/\s+/g, ' ').trim();
}

export function stripInvisibleChars(text) {
    return String(text).replace(INVISIBLE_CHARS, '');
}

function hasScrambledInjection(normalized) {
    const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
    const hasVerb = tokens.some((token) =>
        SCRAMBLE_VERBS.some((verb) => token === verb || isScrambleOf(token, verb))
    );
    const hasNoun = tokens.some((token) =>
        SCRAMBLE_NOUNS.some((noun) => token === noun || isScrambleOf(token, noun))
    );

    return hasVerb && hasNoun;
}

// Catches "i g n o r e" style spacing by comparing without separators.
function hasSpacedOutInjection(normalized) {
    const compact = normalized.replace(/[^a-z]/g, '');

    return [
        'ignoreallpreviousinstructions',
        'ignorepreviousinstructions',
        'ignoreyourinstructions',
        'disregardpreviousinstructions',
        'revealyoursystemprompt',
        'revealthesystemprompt',
        'systemprompt',
        'developermode',
    ].some((phrase) => compact.includes(phrase));
}

function decodeBase64Candidates(text) {
    const decoded = [];

    for (const candidate of text.match(/[A-Za-z0-9+/]{16,}={0,2}/g) ?? []) {
        try {
            const value = Buffer.from(candidate, 'base64').toString('utf8');
            if (/^[\x09\x0A\x0D\x20-\x7E]+$/.test(value)) {
                decoded.push(value);
            }
        } catch {
            // Not valid base64.
        }
    }

    for (const candidate of text.match(/\b(?:[0-9a-fA-F]{2}){12,}\b/g) ?? []) {
        const value = Buffer.from(candidate, 'hex').toString('utf8');
        if (/^[\x09\x0A\x0D\x20-\x7E]+$/.test(value)) {
            decoded.push(value);
        }
    }

    return decoded;
}

function screenNormalized(normalized) {
    if (INJECTION_PHRASES.some((pattern) => pattern.test(normalized))) {
        return 'injection-phrase';
    }
    if (hasSpacedOutInjection(normalized) || hasScrambledInjection(normalized)) {
        return 'obfuscated-injection';
    }
    if (CODE_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))) {
        return 'code-request';
    }
    if (ENCODING_REQUESTS.test(normalized)) {
        return 'encoding-request';
    }

    return null;
}

export function screenUserInput(text) {
    const raw = String(text);

    if (/```|~~~|<\s*\/?\s*(script|iframe|img|svg|style|system)\b/i.test(raw)) {
        return { blocked: true, reason: 'code-or-markup' };
    }

    const normalized = normalizeForScreening(raw);
    const direct = screenNormalized(normalized);
    if (direct) {
        return { blocked: true, reason: direct };
    }

    for (const decoded of decodeBase64Candidates(raw)) {
        if (screenNormalized(normalizeForScreening(decoded))) {
            return { blocked: true, reason: 'encoded-injection' };
        }
    }

    return { blocked: false, reason: null };
}

function isAllowedUrl(href, allowedHosts) {
    if (href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) {
        return !href.startsWith('//');
    }

    try {
        const url = new URL(href);
        return (
            (url.protocol === 'https:' || url.protocol === 'http:') &&
            allowedHosts.has(url.hostname.replace(/^www\./, ''))
        );
    } catch {
        return false;
    }
}

/** Treats model output as untrusted: returns a safe string for rendering. */
export function sanitizeAssistantOutput(text, { allowedHosts, systemPrompt }) {
    if (typeof text !== 'string') {
        return text;
    }

    if (text.includes(PROMPT_CANARY)) {
        return OUTPUT_REFUSAL;
    }

    // Leaked prompt text: refuse if a long verbatim chunk of the instructions appears.
    const normalized = normalizeForScreening(text);
    if (
        systemPrompt &&
        (normalized.includes('you are the ai inside jay') ||
            normalized.includes('security rules') ||
            normalized.includes('untrusted data'))
    ) {
        return OUTPUT_REFUSAL;
    }

    if (/```|~~~|^( {4}|\t)\S/m.test(text)) {
        return OUTPUT_REFUSAL;
    }

    return text
        .replace(/<[^>]*>/g, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) =>
            isAllowedUrl(href, allowedHosts) ? match : label
        )
        .replace(/(?<!\]\()\bhttps?:\/\/[^\s)<]+/g, (url) =>
            isAllowedUrl(url, allowedHosts) ? url : ''
        )
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}
