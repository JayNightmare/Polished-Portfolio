import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react';
import { Bot, Lightbulb, Orbit, Send, Sparkles, Waves } from 'lucide-react';

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

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

const CHAT_MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const CHAT_RAW_URL_PATTERN = /\b(?:https?:\/\/|mailto:)[^\s<]+/g;

function isSafeChatHref(href: string) {
    if (href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) {
        return true;
    }

    try {
        const url = new URL(href);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function shouldOpenChatLinkInNewTab(href: string) {
    if (href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) {
        return false;
    }

    try {
        if (typeof window === 'undefined') {
            return true;
        }

        return new URL(href, window.location.origin).origin !== window.location.origin;
    } catch {
        return false;
    }
}

function renderChatAnchor(label: string, href: string, key: string) {
    if (!isSafeChatHref(href)) {
        return <Fragment key={key}>{label}</Fragment>;
    }

    const openInNewTab = shouldOpenChatLinkInNewTab(href);

    return (
        <a
            key={key}
            href={href}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noreferrer noopener' : undefined}
            className="font-medium text-[rgba(88,166,255,0.98)] underline decoration-[rgba(88,166,255,0.45)] underline-offset-4 transition-colors hover:text-[rgba(125,190,255,1)]"
        >
            {label}
        </a>
    );
}

function renderAutoLinkedText(text: string, keyPrefix: string) {
    CHAT_RAW_URL_PATTERN.lastIndex = 0;

    const nodes: ReactNode[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(CHAT_RAW_URL_PATTERN)) {
        const start = match.index ?? 0;
        const href = match[0];

        if (start > lastIndex) {
            nodes.push(text.slice(lastIndex, start));
        }

        nodes.push(renderChatAnchor(href, href, `${keyPrefix}-${start}`));
        lastIndex = start + href.length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

function renderAssistantMessageContent(content: string) {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
        CHAT_MARKDOWN_LINK_PATTERN.lastIndex = 0;

        const lineNodes: ReactNode[] = [];
        let lastIndex = 0;

        for (const match of line.matchAll(CHAT_MARKDOWN_LINK_PATTERN)) {
            const start = match.index ?? 0;
            const [fullMatch, label, href] = match;

            if (start > lastIndex) {
                lineNodes.push(
                    ...renderAutoLinkedText(
                        line.slice(lastIndex, start),
                        `line-${lineIndex}-text-${lastIndex}`
                    )
                );
            }

            lineNodes.push(renderChatAnchor(label, href, `line-${lineIndex}-link-${start}`));
            lastIndex = start + fullMatch.length;
        }

        if (lastIndex < line.length) {
            lineNodes.push(
                ...renderAutoLinkedText(
                    line.slice(lastIndex),
                    `line-${lineIndex}-text-${lastIndex}`
                )
            );
        }

        return (
            <Fragment key={`line-${lineIndex}`}>
                {lineNodes}
                {lineIndex < lines.length - 1 ? <br /> : null}
            </Fragment>
        );
    });
}

export function HeroAIChat({ open, onOpenChange, apiBase }: HeroAIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
    const activeRequestRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            activeRequestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (open) {
            return;
        }

        activeRequestRef.current?.abort();
        activeRequestRef.current = null;
        setIsLoading(false);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, open]);

    const sendMessage = async (rawPrompt: string) => {
        const prompt = rawPrompt.trim();

        if (!prompt || isLoading) {
            return;
        }

        console.log('Chat input:', prompt);

        const userMessage = createMessage('user', prompt);
        const assistantMessage = createMessage('assistant', '');
        const nextMessages = [...messages, userMessage, assistantMessage];
        const controller = new AbortController();

        setMessages(nextMessages);
        setInput('');
        setIsLoading(true);
        setStatusMessage(null);
        activeRequestRef.current = controller;

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

            setMessages((currentMessages) =>
                currentMessages.map((message) =>
                    message.id === assistantMessage.id
                        ? {
                              ...message,
                              content:
                                  accumulatedReply.trim() ||
                                  'Thought too hard and died of cringe...',
                          }
                        : message
                )
            );
        } catch (error) {
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

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border/60 bg-muted/50 text-foreground'
                                            }`}
                                        >
                                            {isPendingAssistantMessage ? (
                                                <>
                                                    <span className="animate-pulse">▌▌▌</span>
                                                </>
                                            ) : message.role === 'assistant' ? (
                                                renderAssistantMessageContent(message.content)
                                            ) : (
                                                message.content
                                            )}
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

                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                                Public portfolio chat with live streaming replies
                            </p>

                            <Button
                                type="submit"
                                className="cursor-pointer"
                                disabled={isLoading || input.trim().length === 0}
                            >
                                <Send className="h-4 w-4" />
                                Send
                            </Button>
                        </div>

                        {statusMessage ? (
                            <p className="text-xs text-muted-foreground">{statusMessage}</p>
                        ) : null}
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
