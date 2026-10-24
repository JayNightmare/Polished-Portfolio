import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MarkdownIt from 'markdown-it';
import { Bot, Lightbulb, Orbit, RotateCcw, Send, Sparkles, Volume2, Waves } from 'lucide-react';

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { useReducedMotionSetting } from './hooks/useReducedMotionSetting';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
}

interface HeroAIChatProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiBase: string;
}

const INTRO_MESSAGE_ID = 'intro-message';

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: INTRO_MESSAGE_ID,
        role: 'assistant',
        content:
            'Ask me about Jay, this portfolio, featured work, open source repos, published blog posts, or anything else you want to chat about.',
    },
];

const STARTER_PROMPT_GROUPS = [
    {
        title: 'About Jay',
        icon: Lightbulb,
        prompts: [
            'What kind of developer is Jay?',
            'What experience does Jay have in AI and research projects?',
        ],
    },
    {
        title: 'Projects',
        icon: Orbit,
        prompts: [
            'What kinds of projects has Jay worked on?',
            'Tell me about Jay’s open source work and portfolio projects.',
        ],
    },
    {
        title: 'Blog',
        icon: Waves,
        prompts: [
            'What recent blog posts are on the site?',
            'Which topics does Jay write about in the blog?',
        ],
    },
];

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
});

// html is disabled, and markdown-it rejects javascript:/data: links by default.
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true }).disable('image');

const defaultLinkOpen =
    markdown.renderer.rules.link_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet('href') ?? '';

    if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
        token.attrSet('target', '_blank');
        token.attrSet('rel', 'noreferrer noopener');
    }

    return defaultLinkOpen(tokens, idx, options, env, self);
};

function AssistantMarkdown({ content }: { content: string }) {
    const html = useMemo(() => markdown.render(content), [content]);

    return <div className="chat-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

function stripMarkdownForSpeech(text: string) {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/[*_`>]/g, '')
        .trim();
}

export function HeroAIChat({ open, onOpenChange, apiBase }: HeroAIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [readAloudEnabled, setReadAloudEnabled] = useState(false);
    const [voicePendingId, setVoicePendingId] = useState<string | null>(null);
    const [cachedAudioIds, setCachedAudioIds] = useState<Set<string>>(new Set());
    const [voiceStatusMessage, setVoiceStatusMessage] = useState<string | null>(null);
    const [reducedMotion, setReducedMotion] = useReducedMotionSetting();
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
    const activeRequestRef = useRef<AbortController | null>(null);
    const speechRequestRef = useRef<AbortController | null>(null);
    const speechAudioRef = useRef<HTMLAudioElement | null>(null);
    const speechAudioUrlRef = useRef<string | null>(null);
    const audioCacheRef = useRef<Map<string, Blob>>(new Map());
    const voiceEnabledRef = useRef(false);

    const stopSpeech = useCallback(() => {
        speechRequestRef.current?.abort();
        speechRequestRef.current = null;

        const audio = speechAudioRef.current;
        if (audio) {
            audio.onended = null;
            audio.onerror = null;
            audio.pause();
            audio.src = '';
            speechAudioRef.current = null;
        }

        if (speechAudioUrlRef.current) {
            URL.revokeObjectURL(speechAudioUrlRef.current);
            speechAudioUrlRef.current = null;
        }

        setVoicePendingId(null);
    }, []);

    useEffect(() => {
        return () => {
            activeRequestRef.current?.abort();
            speechRequestRef.current?.abort();
            speechAudioRef.current?.pause();
            if (speechAudioUrlRef.current) {
                URL.revokeObjectURL(speechAudioUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (open) {
            return;
        }

        activeRequestRef.current?.abort();
        activeRequestRef.current = null;
        setIsLoading(false);
        stopSpeech();
    }, [open, stopSpeech]);

    useEffect(() => {
        if (!open) return;

        endOfMessagesRef.current?.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'end',
        });
    }, [messages, open, reducedMotion]);

    const playBlob = useCallback(
        async (blob: Blob) => {
            stopSpeech();

            const audioUrl = URL.createObjectURL(blob);
            speechAudioUrlRef.current = audioUrl;
            const audio = new Audio(audioUrl);
            speechAudioRef.current = audio;
            audio.onended = () => {
                if (speechAudioRef.current === audio) {
                    stopSpeech();
                }
            };
            audio.onerror = () => {
                if (speechAudioRef.current === audio) {
                    stopSpeech();
                    setVoiceStatusMessage(
                        'Voice playback failed. The text reply is still available.'
                    );
                }
            };

            await audio.play();
        },
        [stopSpeech]
    );

    const playReplyAudio = useCallback(
        async (messageId: string, text: string) => {
            const speechText = stripMarkdownForSpeech(text);
            if (!voiceEnabledRef.current || !speechText) {
                setVoicePendingId((current) => (current === messageId ? null : current));
                return;
            }

            stopSpeech();
            const controller = new AbortController();
            speechRequestRef.current = controller;
            setVoicePendingId(messageId);
            setVoiceStatusMessage(null);

            try {
                const response = await fetch(`${apiBase}/api/chat/speech`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                    body: JSON.stringify({ text: speechText }),
                });

                if (!response.ok) {
                    throw new Error(`Voice generation failed with status ${response.status}.`);
                }

                const audioBlob = await response.blob();
                if (controller.signal.aborted || !voiceEnabledRef.current) {
                    return;
                }
                if (!audioBlob.size) {
                    throw new Error('Voice generation returned empty audio.');
                }

                audioCacheRef.current.set(messageId, audioBlob);
                setCachedAudioIds((current) => new Set(current).add(messageId));

                speechRequestRef.current = null;
                await playBlob(audioBlob);
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }

                console.error('Error generating voice for chat reply:', error);
                setVoiceStatusMessage('Voice output failed. The text reply is still available.');
            } finally {
                if (speechRequestRef.current === controller) {
                    speechRequestRef.current = null;
                }
                setVoicePendingId((current) => (current === messageId ? null : current));
            }
        },
        [apiBase, playBlob, stopSpeech]
    );

    const handleReadAgain = async (messageId: string) => {
        const blob = audioCacheRef.current.get(messageId);
        if (!blob) {
            return;
        }

        setVoiceStatusMessage(null);
        try {
            await playBlob(blob);
        } catch (error) {
            console.error('Error replaying cached voice:', error);
            setVoiceStatusMessage('Voice playback failed. The text reply is still available.');
        }
    };

    const handleReadAloudChange = (enabled: boolean) => {
        voiceEnabledRef.current = enabled;
        setReadAloudEnabled(enabled);
        setVoiceStatusMessage(null);
        if (!enabled) {
            stopSpeech();
        }
    };

    const handleNewChat = () => {
        activeRequestRef.current?.abort();
        activeRequestRef.current = null;
        stopSpeech();
        audioCacheRef.current.clear();
        setCachedAudioIds(new Set());
        setMessages(INITIAL_MESSAGES);
        setInput('');
        setIsLoading(false);
        setStatusMessage(null);
        setVoiceStatusMessage(null);
    };

    const sendMessage = async (rawPrompt: string) => {
        const prompt = rawPrompt.trim();

        if (!prompt || isLoading) {
            return;
        }

        console.log('Chat input:', prompt);
        stopSpeech();
        setVoiceStatusMessage(null);

        const userMessage = createMessage('user', prompt);
        const assistantMessage = createMessage('assistant', '');
        const nextMessages = [...messages, userMessage, assistantMessage];
        const controller = new AbortController();

        setMessages(nextMessages);
        setInput('');
        setIsLoading(true);
        setStatusMessage(null);
        activeRequestRef.current = controller;

        if (voiceEnabledRef.current) {
            setVoicePendingId(assistantMessage.id);
        }

        try {
            const response = await fetch(`${apiBase}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    messages: nextMessages
                        .filter(
                            (message) =>
                                message.id !== INTRO_MESSAGE_ID &&
                                !(
                                    message.id === assistantMessage.id &&
                                    message.content.length === 0
                                )
                        )
                        .map((message) => ({
                            role: message.role,
                            content: message.content,
                        })),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'The chat endpoint is unavailable right now.');
            }

            if (!response.body) {
                throw new Error('The chat stream is unavailable right now.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedReply = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;

                accumulatedReply += chunk;
                setMessages((currentMessages) =>
                    currentMessages.map((message) =>
                        message.id === assistantMessage.id
                            ? { ...message, content: accumulatedReply }
                            : message
                    )
                );
            }

            accumulatedReply += decoder.decode();

            console.log('Raw streamed assistant reply:', accumulatedReply);

            const finalReply = accumulatedReply.trim() || 'Thought too hard and died of cringe...';
            setMessages((currentMessages) =>
                currentMessages.map((message) =>
                    message.id === assistantMessage.id
                        ? { ...message, content: finalReply }
                        : message
                )
            );

            if (voiceEnabledRef.current) {
                void playReplyAudio(assistantMessage.id, finalReply);
            }
        } catch (error) {
            setVoicePendingId((current) => (current === assistantMessage.id ? null : current));

            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }

            const message =
                error instanceof Error
                    ? error.message
                    : 'The chat endpoint is unavailable right now.';

            setStatusMessage(message);
            setMessages((currentMessages) =>
                currentMessages.map((currentMessage) =>
                    currentMessage.id === assistantMessage.id
                        ? {
                              ...currentMessage,
                              content:
                                  'AI chat is unavailable right now. Please try again shortly.',
                          }
                        : currentMessage
                )
            );
        } finally {
            activeRequestRef.current = null;
            setIsLoading(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground>
            <DrawerContent className="mx-auto flex h-[78vh] w-full max-w-3xl border border-border/60 bg-background/95 backdrop-blur">
                <DrawerHeader className="relative border-b border-border/60 pb-4">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(88,166,255,0.85)] to-transparent" />
                    <div className="flex items-start justify-between gap-4 pr-10">
                        <div className="space-y-2">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(88,166,255,0.25)] bg-[rgba(88,166,255,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[rgba(88,166,255,0.95)]">
                                <span className="h-2 w-2 rounded-full bg-[rgba(88,166,255,0.95)]" />
                                Beta
                            </div>

                            <DrawerTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                                <Bot className="h-5 w-5 text-[rgba(88,166,255,0.9)]" />
                                Ask Jay AI
                            </DrawerTitle>
                            <DrawerDescription className="max-w-2xl text-sm leading-relaxed">
                                This assistant answers questions about Jay, this portfolio, public
                                projects, and published blog content.
                            </DrawerDescription>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 cursor-pointer"
                            onClick={handleNewChat}
                            disabled={messages.length === INITIAL_MESSAGES.length}
                        >
                            <RotateCcw className="h-4 w-4" />
                            New chat
                        </Button>
                    </div>
                </DrawerHeader>

                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-6">
                    {messages.length === INITIAL_MESSAGES.length ? (
                        <div className="mb-4 grid gap-3 md:grid-cols-3">
                            {STARTER_PROMPT_GROUPS.map((group) => {
                                const GroupIcon = group.icon;

                                return (
                                    <div
                                        key={group.title}
                                        className="rounded-2xl border border-border/60 bg-muted/40 p-3"
                                    >
                                        <div className="mb-3 flex items-center gap-2 text-sm">
                                            <GroupIcon className="h-4 w-4 text-[rgba(88,166,255,0.9)]" />
                                            <span>{group.title}</span>
                                        </div>

                                        <div className="space-y-2">
                                            {group.prompts.map((prompt) => (
                                                <button
                                                    key={prompt}
                                                    type="button"
                                                    className="flex w-full items-start gap-2 rounded-xl border border-transparent bg-background/70 px-3 py-2 text-left text-sm transition-colors hover:border-[rgba(88,166,255,0.22)] hover:bg-background cursor-pointer"
                                                    onClick={() => void sendMessage(prompt)}
                                                    disabled={isLoading}
                                                >
                                                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgba(88,166,255,0.9)]" />
                                                    <span>{prompt}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                        {messages.map((message) =>
                            (() => {
                                const isPendingAssistantMessage =
                                    message.role === 'assistant' &&
                                    message.content.length === 0 &&
                                    isLoading;

                                if (message.content.length === 0 && !isPendingAssistantMessage) {
                                    return null;
                                }

                                const isVoicePending = voicePendingId === message.id;
                                const hasCachedAudio = cachedAudioIds.has(message.id);

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[88%] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                                message.role === 'user'
                                                    ? 'whitespace-pre-wrap bg-primary text-primary-foreground'
                                                    : 'border border-border/60 bg-muted/50 text-foreground'
                                            } ${isVoicePending ? 'chat-voice-pending' : ''}`}
                                            aria-busy={isVoicePending || undefined}
                                        >
                                            {isPendingAssistantMessage ? (
                                                <span className="animate-pulse">▌▌▌</span>
                                            ) : message.role === 'assistant' ? (
                                                <AssistantMarkdown content={message.content} />
                                            ) : (
                                                message.content
                                            )}

                                            {message.role === 'assistant' && hasCachedAudio ? (
                                                <button
                                                    type="button"
                                                    className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                                    onClick={() => void handleReadAgain(message.id)}
                                                    disabled={isVoicePending}
                                                >
                                                    <Volume2 className="h-3.5 w-3.5" />
                                                    Read again
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        <div ref={endOfMessagesRef} />
                    </div>

                    <form
                        className="mt-4 space-y-3 border-t border-border/60 pt-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void sendMessage(input);
                        }}
                    >
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    void sendMessage(input);
                                }
                            }}
                            placeholder="Ask about Jay, his background, projects, or this site..."
                            rows={2}
                            maxLength={500}
                            disabled={isLoading}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="ask-jay-read-aloud"
                                        checked={readAloudEnabled}
                                        onCheckedChange={handleReadAloudChange}
                                        aria-label="Read Ask Jay replies aloud"
                                    />
                                    <label
                                        htmlFor="ask-jay-read-aloud"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Read answers aloud
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="ask-jay-reduced-motion"
                                        checked={reducedMotion}
                                        onCheckedChange={setReducedMotion}
                                        aria-label="Reduce animations"
                                    />
                                    <label
                                        htmlFor="ask-jay-reduced-motion"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Reduce animations
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="cursor-pointer"
                                disabled={isLoading || input.trim().length === 0}
                            >
                                <Send className="h-4 w-4" />
                                Send
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Public portfolio chat with live streaming replies
                            {voicePendingId ? ' Generating voice reply…' : ''}
                        </p>

                        {voiceStatusMessage ? (
                            <p role="status" className="text-xs text-muted-foreground">
                                {voiceStatusMessage}
                            </p>
                        ) : null}

                        {statusMessage ? (
                            <p className="text-xs text-muted-foreground">{statusMessage}</p>
                        ) : null}
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
