# Blog/DevLog Feature

A Reddit-style blog system for sharing project progress updates with image and video support.

## Features

### 📝 Create Posts
- Write detailed updates about your projects
- Rich text content support
- Add multiple images and videos
- Tag posts with relevant keywords
- Auto-saves to browser localStorage

### 📱 View Posts
- Clean, card-based feed layout
- Preview images in grid format
- Sort by date (newest first)
- Click to view full post details

### 🎬 Media Support
- **Images**: Upload multiple images per post
- **Videos**: Upload and preview videos directly in posts
- Click images to view full size
- Video controls for playback

### 🏷️ Tags
- Add custom tags to organize posts
- Visual tag display on posts
- Easy tag management

## Usage

### Creating a New Post

1. Navigate to `/blog` or click "Blog" in the navigation
2. Click "New Post" button
3. Fill in the post details:
   - **Title**: A descriptive title for your update
   - **Content**: Detailed description of your progress
   - **Images**: Click "Upload Images" to add screenshots or photos
   - **Videos**: Click "Upload Videos" to add demonstration videos
   - **Tags**: Add relevant tags (press Enter or click the tag icon)
4. Click "Publish Post"

### Viewing Posts

- Visit `/blog` to see all your posts
- Posts are displayed in reverse chronological order
- Click any post card to view the full details
- Use the "Back to All Posts" button to return to the feed

### Editing/Deleting Posts

- Open a post's detail view
- Click the trash icon in the top-right to delete
- Confirmation dialog prevents accidental deletions

## Data Storage

Posts are currently stored in the browser's localStorage:
- **Key**: `blogPosts`
- **Format**: JSON array of post objects
- **Persistence**: Data persists across browser sessions
- **Portability**: Can be exported/imported via browser dev tools

### Post Structure

```typescript
{
  id: string;          // Timestamp-based unique ID
  title: string;       // Post title
  content: string;     // Post content (markdown-ready)
  date: string;        // ISO 8601 date string
  images: string[];    // Base64 encoded images
  videos: string[];    // Base64 encoded videos
  tags: string[];      // Array of tag strings
}
```

## Future Enhancements

Potential improvements for the blog system:

- **Backend Integration**: Move from localStorage to a database (MongoDB, PostgreSQL, etc.)
- **Markdown Support**: Add markdown editor for rich text formatting
- **Comments**: Allow comments on posts
- **Reactions**: Like/upvote system
- **Search**: Search posts by title, content, or tags
- **Filtering**: Filter posts by tags or date ranges
- **Export**: Export posts as markdown or PDF
- **Image Optimization**: Compress images before storage
- **Draft System**: Save drafts before publishing
- **Edit Posts**: Add ability to edit existing posts
- **Pagination**: Load posts in chunks for better performance
- **Cloud Storage**: Store media files in cloud storage (S3, Cloudinary)

## Components

- **Blog.tsx**: Main feed component displaying all posts
- **CreateBlogPost.tsx**: Form for creating new posts with media uploads
- **BlogPost.tsx**: Individual post detail view with delete functionality

## Routes

- `/blog` - Main blog feed
- `/blog/new` - Create new post
- `/blog/:id` - View individual post

## Styling

The blog components use:
- Tailwind CSS for styling
- shadcn/ui components (Card, Button, Input, etc.)
- Lucide React icons
- Responsive design for mobile and desktop
