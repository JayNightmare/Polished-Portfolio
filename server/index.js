import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import AI_PROFILE_CONTEXT, { CURATED_PROJECT_PROFILES } from './aiProfileContext.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const SITE_URL = (process.env.SITE_URL || 'https://portfolio.nexusgit.info').replace(/\/$/, '');
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const AI_BASE_URL = (
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://api.openai.com/v1'
).replace(/\/$/, '');
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'JayNightmare';
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
const GITHUB_API_BASE = (process.env.GITHUB_API_BASE || 'https://api.github.com').replace(
    /\/$/,
    ''
);
const CONTACT_EMAIL = 'jn3.enquiries@gmail.com';
const LINKEDIN_PROFILE_URL = 'https://linkedin.com/in/jordan-s-bell';
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 10;
const CHAT_MAX_HISTORY = 10;
const CHAT_MAX_MESSAGE_LENGTH = 500;
const CHAT_MAX_RESPONSE_LENGTH = 1200;
const BLOG_CONTEXT_LIMIT = 6;
const PROJECT_CONTEXT_LIMIT = 6;
const PROJECT_CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;
const AI_HEALTH_PROBE_TIMEOUT_MS = 4000;
const EMPTY_CHAT_REPLY = "I don't have a reply right now. Please try again.";
const PORTFOLIO_LINKS = {
    about: '/#about',
    blog: '/blog',
    contact: '/#contact',
    email: `mailto:${CONTACT_EMAIL}`,
    github: GITHUB_PROFILE_URL,
    home: '/',
    linkedin: LINKEDIN_PROFILE_URL,
    projects: '/#projects',
    resume: '/Jordan_Bell_CV.pdf',
    skills: '/#skills',
};

const ADMIN_TOKEN = process.env.VITE_ADMIN_TOKEN;
const chatRateLimitStore = new Map();
const projectContextCache = {
    expiresAt: 0,
    repos: [],
    value: '',
};
const githubAuthState = {
    tokenRejected: false,
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
let db;
let postsCollection;
let siteViewsCollection;

async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        db = client.db();
        postsCollection = db.collection('BlogPosts');
        siteViewsCollection = db.collection('SiteViews');

        // Ensure SiteViews has at least one document
        const countDoc = await siteViewsCollection.findOne({});
        if (!countDoc) {
            await siteViewsCollection.insertOne({ count: 0 });
            console.log('Initialized SiteViews collection');
        }

        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Admin authentication middleware
function requireAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

function getClientIdentifier(req) {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || 'unknown-client';
}

function chatRateLimit(req, res, next) {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    const windowStart = now - CHAT_RATE_LIMIT_WINDOW_MS;
    const recentRequests = (chatRateLimitStore.get(clientId) || []).filter(
        (timestamp) => timestamp > windowStart
    );

    if (recentRequests.length >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many chat requests. Please wait a minute.' });
    }

    recentRequests.push(now);
    chatRateLimitStore.set(clientId, recentRequests);
    next();
}

function normalizeChatMessages(messages) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter(
            (message) =>
                message &&
                (message.role === 'user' || message.role === 'assistant') &&
                typeof message.content === 'string'
        )
        .map((message) => ({
            role: message.role,
            content: message.content.trim().slice(0, CHAT_MAX_MESSAGE_LENGTH),
        }))
        .filter((message) => message.content.length > 0)
        .slice(-CHAT_MAX_HISTORY);
}

function sanitizeContextText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/[`*_>#]/g, ' ')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncateText(value, maxLength) {
    const sanitized = sanitizeContextText(value);

    if (sanitized.length <= maxLength) {
        return sanitized;
    }

    return `${sanitized.slice(0, maxLength - 3).trim()}...`;
}

function formatContextDate(dateValue) {
    const parsed = new Date(dateValue);

    if (Number.isNaN(parsed.getTime())) {
        return 'Unknown date';
    }

    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
    });
}

function formatRepoName(name) {
    return String(name || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())
        .trim();
}

function formatChatLink(label, href) {
    if (!label || !href) {
        return String(label || href || '');
    }

    return `[${label}](${href})`;
}

function buildLinkContext() {
    return [
        'Portfolio And Social Links',
        `- Home: ${PORTFOLIO_LINKS.home}`,
        `- About: ${PORTFOLIO_LINKS.about}`,
        `- Skills: ${PORTFOLIO_LINKS.skills}`,
        `- Projects: ${PORTFOLIO_LINKS.projects}`,
        `- Blog: ${PORTFOLIO_LINKS.blog}`,
        `- Contact: ${PORTFOLIO_LINKS.contact}`,
        `- CV: ${PORTFOLIO_LINKS.resume}`,
        `- GitHub: ${PORTFOLIO_LINKS.github}`,
        `- LinkedIn: ${PORTFOLIO_LINKS.linkedin}`,
        `- Email: ${PORTFOLIO_LINKS.email}`,
    ].join('\n');
}

async function buildBlogContext() {
    if (!postsCollection) {
        return 'Recent Blog Posts\n- Blog content is temporarily unavailable.';
    }

    try {
        const posts = await getRecentBlogPosts();

        if (!posts.length) {
            return 'Recent Blog Posts\n- No blog posts are currently published.';
        }

        const summaries = posts.map((post) => {
            const title = truncateText(post.title || 'Untitled Post', 100);
            const excerpt = truncateText(post.content || '', 220) || 'No summary available.';
            const link = post._id ? ` Link: /blog/${post._id}.` : '';
            const tags =
                Array.isArray(post.tags) && post.tags.length > 0
                    ? ` Tags: ${post.tags.slice(0, 4).join(', ')}.`
                    : '';

            return `- ${title} (${formatContextDate(post.date)}).${tags}${link} Summary: ${excerpt}`;
        });

        return `Recent Blog Posts\n${summaries.join('\n')}`;
    } catch (error) {
        console.error('Error building blog context:', error);
        return 'Recent Blog Posts\n- Blog content is temporarily unavailable.';
    }
}

async function getRecentBlogPosts() {
    if (!postsCollection) {
        return [];
    }

    return postsCollection
        .find({}, { projection: { _id: 1, title: 1, content: 1, date: 1, tags: 1 } })
        .sort({ date: -1 })
        .limit(BLOG_CONTEXT_LIMIT)
        .toArray();
}

async function getDirectBlogReply(message) {
    if (typeof message !== 'string' || !postsCollection) {
        return null;
    }

    const normalized = message.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    const asksForRecentPosts =
        /\b(recent|latest)\b.*\bblog posts?\b/i.test(normalized) ||
        /\bwhat\b.*\bblog posts?\b.*\bsite\b/i.test(normalized);
    const asksForBlogTopics =
        /\b(which|what)\b.*\btopics?\b.*\bblog\b/i.test(normalized) ||
        /\bwhat\b.*\bwrite about\b.*\bblog\b/i.test(normalized);

    if (!asksForRecentPosts && !asksForBlogTopics) {
        return null;
    }

    const posts = await getRecentBlogPosts();

    if (!posts.length) {
        return 'No blog posts are currently published on the site.';
    }

    if (asksForRecentPosts) {
        const lines = posts.map((post) => {
            const title = truncateText(post.title || 'Untitled Post', 100);
            const linkedTitle = post._id ? formatChatLink(title, `/blog/${post._id}`) : title;
            const tags =
                Array.isArray(post.tags) && post.tags.length > 0
                    ? ` - ${post.tags.slice(0, 3).join(', ')}`
                    : '';

            return `- ${linkedTitle} (${formatContextDate(post.date)})${tags}`;
        });

        return `Here are the recent blog posts on the site. You can also browse the full archive at ${formatChatLink('the blog', PORTFOLIO_LINKS.blog)}.\n\n${lines.join('\n')}`;
    }

    const uniqueTopics = [...new Set(posts.flatMap((post) => post.tags || []))]
        .filter(Boolean)
        .slice(0, 10);

    if (uniqueTopics.length > 0) {
        return `Jay writes about topics like ${uniqueTopics.join(', ')}. The latest posts are collected on ${formatChatLink('the blog', PORTFOLIO_LINKS.blog)}.`;
    }

    const titles = posts
        .map((post) => truncateText(post.title || 'Untitled Post', 80))
        .slice(0, 4)
        .join(', ');

    return `Jay's blog covers technical posts and project updates, including posts like ${titles}. You can read them on ${formatChatLink('the blog', PORTFOLIO_LINKS.blog)}.`;
}

async function getDirectProjectReply(message) {
    if (typeof message !== 'string') {
        return null;
    }

    const normalized = message.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    const asksForProjectTypes =
        /\bwhat\b.*\bkinds? of projects\b.*\bworked on\b/i.test(normalized) ||
        /\bwhat\b.*\bprojects\b.*\bworked on\b/i.test(normalized);
    const asksForOpenSourceAndPortfolio =
        /\bopen source\b.*\bportfolio projects?\b/i.test(normalized) ||
        /\bportfolio projects?\b.*\bopen source\b/i.test(normalized);

    if (!asksForProjectTypes && !asksForOpenSourceAndPortfolio) {
        return null;
    }

    if (asksForProjectTypes) {
        return [
            `Jay has worked across AI and research projects, data-heavy web applications, satellite and networking software, and personal portfolio tooling. A good starting point is the ${formatChatLink('projects section', PORTFOLIO_LINKS.projects)}.`,
            '',
            ...CURATED_PROJECT_PROFILES.map(
                (project) =>
                    `- ${project.name === 'Polished Portfolio' ? formatChatLink(project.name, PORTFOLIO_LINKS.home) : project.name}: ${project.summary}`
            ),
        ].join('\n');
    }

    const { repos } = await getProjectContextSnapshot();
    const curatedProjectLines = CURATED_PROJECT_PROFILES.filter(
        (project) => project.name !== 'Polished Portfolio'
    ).map((project) => `- ${project.name}: ${project.summary}`);
    const repoLines = repos.slice(0, 4).map((repo) => {
        const description = truncateText(repo.description || 'No description available.', 120);
        const repoName = repo.html_url
            ? formatChatLink(formatRepoName(repo.name), repo.html_url)
            : formatRepoName(repo.name);

        return `- ${repoName}: ${description}`;
    });
    const sections = [
        `On the portfolio side, the main showcase is ${formatChatLink('Polished Portfolio', PORTFOLIO_LINKS.home)}, Jay's React and TypeScript site with a blog, SEO support, GitHub integration, a music control, and the built-in AI chat. You can also jump to the ${formatChatLink('projects section', PORTFOLIO_LINKS.projects)} or ${formatChatLink('blog', PORTFOLIO_LINKS.blog)}.`,
        '',
        'Other curated project highlights include:',
        ...curatedProjectLines,
    ];

    if (repoLines.length > 0) {
        sections.push('', 'Current public repo highlights include:', ...repoLines);
    }

    sections.push(
        '',
        `For more background, see ${formatChatLink('GitHub', PORTFOLIO_LINKS.github)} or ${formatChatLink('LinkedIn', PORTFOLIO_LINKS.linkedin)}.`
    );

    return sections.join('\n');
}

function getDirectProfileLinksReply(message) {
    if (typeof message !== 'string') {
        return null;
    }

    const normalized = message.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    const asksForContact = /\b(contact|reach|get in touch|hire|email|message)\b/i.test(normalized);
    const asksForSocialLinks =
        /\b(github|linkedin|socials?)\b/i.test(normalized) ||
        /\b(cv|resume|resumé)\b/i.test(normalized);

    if (!asksForContact && !asksForSocialLinks) {
        return null;
    }

    return [
        `You can reach Jay through the ${formatChatLink('contact section', PORTFOLIO_LINKS.contact)} or directly by ${formatChatLink(CONTACT_EMAIL, PORTFOLIO_LINKS.email)}.`,
        '',
        'Useful links:',
        `- ${formatChatLink('GitHub', PORTFOLIO_LINKS.github)}`,
        `- ${formatChatLink('LinkedIn', PORTFOLIO_LINKS.linkedin)}`,
        `- ${formatChatLink('CV', PORTFOLIO_LINKS.resume)}`,
        `- ${formatChatLink('Projects section', PORTFOLIO_LINKS.projects)}`,
        `- ${formatChatLink('Blog', PORTFOLIO_LINKS.blog)}`,
    ].join('\n');
}

async function getDirectChatReply(message) {
    return (
        (await getDirectBlogReply(message)) ||
        (await getDirectProjectReply(message)) ||
        getDirectProfileLinksReply(message)
    );
}

function getGitHubHeaders() {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Polished-Portfolio-Server',
    };

    if (GITHUB_TOKEN && !githubAuthState.tokenRejected) {
        return {
            ...headers,
            Authorization: `Bearer ${GITHUB_TOKEN}`,
        };
    }

    return headers;
}

function selectProjectRepos(repos) {
    const publicRepos = repos.filter(
        (repo) => !repo.private && !repo.fork && !repo.archived && !repo.disabled
    );

    const byImpact = [...publicRepos].sort(
        (left, right) =>
            right.stargazers_count + right.forks_count - (left.stargazers_count + left.forks_count)
    );
    const byRecent = [...publicRepos].sort(
        (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
    );

    const selected = [];
    const seen = new Set();

    for (const repo of [...byImpact.slice(0, 4), ...byRecent.slice(0, 4)]) {
        if (!seen.has(repo.id)) {
            selected.push(repo);
            seen.add(repo.id);
        }

        if (selected.length >= PROJECT_CONTEXT_LIMIT) {
            break;
        }
    }

    return selected;
}

async function getProjectContextSnapshot() {
    const now = Date.now();

    if (projectContextCache.value && projectContextCache.expiresAt > now) {
        return {
            context: projectContextCache.value,
            repos: projectContextCache.repos,
        };
    }

    try {
        const githubReposUrl = `${GITHUB_API_BASE}/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&per_page=24`;
        let response = await fetch(githubReposUrl, { headers: getGitHubHeaders() });

        if (response.status === 401 && GITHUB_TOKEN && !githubAuthState.tokenRejected) {
            const errorText = await response.text();

            if (/bad credentials/i.test(errorText)) {
                githubAuthState.tokenRejected = true;
                console.warn(
                    'GitHub token rejected for project context. Retrying with public GitHub access.'
                );
                response = await fetch(githubReposUrl, { headers: getGitHubHeaders() });
            } else {
                throw new Error(`GitHub context error: ${response.status} ${errorText}`);
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub context error: ${response.status} ${errorText}`);
        }

        const repos = await response.json();
        const selectedRepos = selectProjectRepos(Array.isArray(repos) ? repos : []);

        if (!selectedRepos.length) {
            const fallback =
                'Open Source Project Snapshot\n- Public repository details are currently unavailable.';
            projectContextCache.value = fallback;
            projectContextCache.repos = [];
            projectContextCache.expiresAt = now + PROJECT_CONTEXT_CACHE_TTL_MS;

            return {
                context: fallback,
                repos: [],
            };
        }

        const summaries = selectedRepos.map((repo) => {
            const description = truncateText(repo.description || 'No description available.', 180);
            const technologies = [
                repo.language,
                ...(Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : []),
            ]
                .filter(Boolean)
                .join(', ');
            const techLine = technologies ? ` Tech: ${technologies}.` : '';
            const linkLine = repo.html_url ? ` Link: ${repo.html_url}.` : '';

            return `- ${formatRepoName(repo.name)}: ${description}${techLine}${linkLine} Stars: ${repo.stargazers_count}. Updated: ${formatContextDate(repo.updated_at)}.`;
        });

        const context = `Open Source Project Snapshot\n${summaries.join('\n')}`;
        projectContextCache.value = context;
        projectContextCache.repos = selectedRepos;
        projectContextCache.expiresAt = now + PROJECT_CONTEXT_CACHE_TTL_MS;

        return {
            context,
            repos: selectedRepos,
        };
    } catch (error) {
        console.error('Error building project context:', error);
        const fallback =
            'Open Source Project Snapshot\n- Public repository details are currently unavailable.';
        projectContextCache.value = fallback;
        projectContextCache.repos = [];
        projectContextCache.expiresAt = now + 60 * 1000;

        return {
            context: fallback,
            repos: [],
        };
    }
}

async function buildProjectContext() {
    const { context } = await getProjectContextSnapshot();

    return context;
}

async function buildKnowledgeContext() {
    const [projectContext, blogContext] = await Promise.all([
        buildProjectContext(),
        buildBlogContext(),
    ]);

    return [AI_PROFILE_CONTEXT, buildLinkContext(), projectContext, blogContext]
        .filter(Boolean)
        .join('\n\n');
}

function guardAssistantResponse(content) {
    if (typeof content !== 'string') {
        return EMPTY_CHAT_REPLY;
    }

    const normalized = content.trim();

    if (!normalized) {
        return EMPTY_CHAT_REPLY;
    }

    return normalized.slice(0, CHAT_MAX_RESPONSE_LENGTH);
}

function extractChatCompletionContent(data) {
    const messageContent = data?.choices?.[0]?.message?.content;

    if (typeof messageContent === 'string') {
        return messageContent;
    }

    if (Array.isArray(messageContent)) {
        const combinedText = messageContent
            .map((item) => {
                if (typeof item === 'string') {
                    return item;
                }

                if (item && typeof item.text === 'string') {
                    return item.text;
                }

                if (item && typeof item.content === 'string') {
                    return item.content;
                }

                return '';
            })
            .join('')
            .trim();

        if (combinedText) {
            return combinedText;
        }
    }

    if (typeof data?.choices?.[0]?.text === 'string') {
        return data.choices[0].text;
    }

    return '';
}

function buildChatSystemPrompt(knowledgeContext) {
    return `${knowledgeContext}\n\nYou are the AI inside Jay's portfolio. Use the provided profile, project, blog, and link context when it is helpful, but answer naturally and conversationally. You can respond to broader questions as well, and you do not need to refuse off-topic prompts. Keep answers concise and useful. Use plain text for normal prose. If a link would genuinely help, you may include a small number of inline Markdown links in the form [label](url). Only use URLs that appear in the provided context or the active conversation, and do not invent URLs. Do not use other Markdown formatting such as bold markers, headings, code fences, or numbered Markdown lists. Short paragraphs and simple plain-text bullet lines are fine.`;
}

async function getChatCompletion(messages, knowledgeContext) {
    console.log('AI chat input:', {
        messages,
    });

    const headers = {
        'Content-Type': 'application/json',
    };

    if (AI_API_KEY) {
        headers.Authorization = `Bearer ${AI_API_KEY}`;
    }

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: AI_MODEL,
            temperature: 0.2,
            max_tokens: 420,
            messages: [
                {
                    role: 'system',
                    content: buildChatSystemPrompt(knowledgeContext),
                },
                ...messages,
            ],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI provider error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI raw provider response:', data);
    return guardAssistantResponse(extractChatCompletionContent(data));
}

function getAiProviderHealthSummary() {
    const hasExplicitBaseUrl = Boolean(process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL);
    const hasApiKey = Boolean(AI_API_KEY);
    const configured = hasApiKey || hasExplicitBaseUrl;

    return {
        configured,
        model: AI_MODEL,
        baseUrl: AI_BASE_URL,
        usesAuth: hasApiKey,
        explicitBaseUrl: hasExplicitBaseUrl,
        note: configured
            ? null
            : 'Set AI_API_KEY for authenticated providers, or set AI_BASE_URL for a no-auth OpenAI-compatible endpoint.',
    };
}

async function probeAiProvider() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_HEALTH_PROBE_TIMEOUT_MS);

    try {
        const headers = {
            Accept: 'application/json',
        };

        if (AI_API_KEY) {
            headers.Authorization = `Bearer ${AI_API_KEY}`;
        }

        const response = await fetch(`${AI_BASE_URL}/models`, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });

        if (!response.ok) {
            const detail = (await response.text()).trim();

            return {
                reachable: false,
                status: response.status,
                detail: detail ? detail.slice(0, 240) : null,
            };
        }

        return {
            reachable: true,
            status: response.status,
            detail: null,
        };
    } catch (error) {
        return {
            reachable: false,
            status: null,
            detail:
                error instanceof Error
                    ? error.name === 'AbortError'
                        ? 'Probe timed out.'
                        : error.message
                    : 'Unknown probe failure.',
        };
    } finally {
        clearTimeout(timeout);
    }
}

function getChatRequestMessages(req) {
    const messages = normalizeChatMessages(req.body?.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

    return {
        messages,
        latestUserMessage,
    };
}

function writeStreamHeaders(res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamReply(res, reply) {
    const normalizedReply = guardAssistantResponse(reply);
    const chunks = normalizedReply.match(/\S+\s*/g) || [normalizedReply];

    for (const chunk of chunks) {
        res.write(chunk);
        await delay(18);
    }

    res.end();
}

// Routes

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await postsCollection.find().sort({ date: -1 }).toArray();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await postsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create new post
app.post('/api/posts', requireAdmin, async (req, res) => {
    try {
        const { title, content, images, videos, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newPost = {
            title: title.trim(),
            content: content.trim(),
            date: new Date().toISOString(),
            images: images || [],
            videos: videos || [],
            tags: tags || [],
        };

        const result = await postsCollection.insertOne(newPost);
        const createdPost = await postsCollection.findOne({ _id: result.insertedId });
        res.status(201).json(createdPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update post
app.put('/api/posts/:id', requireAdmin, async (req, res) => {
    try {
        const { title, content, images, videos, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const updateData = {
            title: title.trim(),
            content: content.trim(),
            images: images || [],
            videos: videos || [],
            tags: tags || [],
        };

        const result = await postsCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const updatedPost = await postsCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post
app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
    try {
        const result = await postsCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
    const { secret } = req.body;
    if (secret === ADMIN_TOKEN) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get view count
app.get('/api/views', async (req, res) => {
    try {
        const doc = await siteViewsCollection.findOne({});
        res.json({ count: doc ? doc.count : 0 });
    } catch (error) {
        console.error('Error fetching view count:', error);
        res.status(500).json({ error: 'Failed to fetch view count' });
    }
});

// Increment view count
app.post('/api/views', async (req, res) => {
    try {
        const doc = await siteViewsCollection.findOneAndUpdate(
            {},
            { $inc: { count: 1 } },
            { returnDocument: 'after', upsert: true }
        );
        res.json({ count: doc ? doc.count : 1 });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ error: 'Failed to increment view count' });
    }
});

app.post('/api/chat', chatRateLimit, async (req, res) => {
    try {
        const { messages, latestUserMessage } = getChatRequestMessages(req);

        if (!latestUserMessage) {
            return res.status(400).json({ error: 'A user message is required.' });
        }

        const directReply = await getDirectChatReply(latestUserMessage.content);

        if (directReply) {
            return res.json({ reply: directReply });
        }

        const knowledgeContext = await buildKnowledgeContext();
        const reply = await getChatCompletion(messages, knowledgeContext);
        res.json({ reply });
    } catch (error) {
        console.error('Error handling AI chat request:', error);
        res.status(500).json({ reply: 'Thought too hard and died of cringe' });
    }
});

app.post('/api/chat/stream', chatRateLimit, async (req, res) => {
    try {
        const { messages, latestUserMessage } = getChatRequestMessages(req);

        if (!latestUserMessage) {
            return res.status(400).send('A user message is required.');
        }

        const directReply = await getDirectChatReply(latestUserMessage.content);

        if (directReply) {
            writeStreamHeaders(res);
            await streamReply(res, directReply);
            return;
        }

        const knowledgeContext = await buildKnowledgeContext();
        const reply = await getChatCompletion(messages, knowledgeContext);

        writeStreamHeaders(res);
        await streamReply(res, reply);
    } catch (error) {
        console.error('Error handling streamed AI chat request:', error);

        if (!res.headersSent) {
            res.status(500).json({ reply: 'Thought too hard and died of cringe' });
            return;
        }

        res.write('Thought too hard and died of cringe');
        res.end();
    }
});

app.get('/sitemap.xml', async (req, res) => {
    try {
        const staticRoutes = ['/', '/all-projects', '/blog'];
        const staticEntries = staticRoutes.map((path) => ({
            loc: `${SITE_URL}${path}`,
            lastmod: new Date().toISOString(),
            changefreq: path === '/blog' ? 'daily' : 'weekly',
            priority: path === '/' ? '1.0' : '0.8',
        }));

        const posts = await postsCollection.find({}, { projection: { _id: 1, date: 1 } }).toArray();
        const postEntries = posts.map((post) => {
            const dateValue = post.date ? new Date(post.date) : new Date();
            const normalizedDate = Number.isNaN(dateValue.getTime())
                ? new Date().toISOString()
                : dateValue.toISOString();

            return {
                loc: `${SITE_URL}/blog/${post._id}`,
                lastmod: normalizedDate,
                changefreq: 'weekly',
                priority: '0.7',
            };
        });

        const allEntries = [...staticEntries, ...postEntries];
        const urls = allEntries
            .map(
                (entry) =>
                    `<url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
            )
            .join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=900');
        res.status(200).send(xml);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Failed to generate sitemap');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/chat/health', async (req, res) => {
    const summary = getAiProviderHealthSummary();
    const shouldProbe = req.query.probe === '1';

    if (!shouldProbe || !summary.configured) {
        return res.json({
            status: summary.configured ? 'ok' : 'needs_configuration',
            timestamp: new Date().toISOString(),
            provider: {
                ...summary,
                probe: shouldProbe
                    ? {
                          attempted: false,
                          reachable: false,
                          status: null,
                          detail: 'Provider probe skipped because AI provider configuration is incomplete.',
                      }
                    : null,
            },
        });
    }

    const probe = await probeAiProvider();

    res.json({
        status: probe.reachable ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        provider: {
            ...summary,
            probe: {
                attempted: true,
                ...probe,
            },
        },
    });
});

// Initialize server
async function startServer() {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

export default app;
