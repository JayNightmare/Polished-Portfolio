import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const ADMIN_TOKEN = process.env.VITE_ADMIN_TOKEN;

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
