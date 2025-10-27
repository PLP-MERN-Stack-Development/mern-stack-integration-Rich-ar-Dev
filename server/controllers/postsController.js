const Post = require('../models/Post');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// helper to upload buffer to cloudinary
const streamUpload = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    stream.end(buffer);
  });

// GET /api/posts
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('category')
      .populate('author')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: posts, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id
exports.getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    let post = null;

    // If id is a valid ObjectId, try to find by _id first
    if (mongoose.Types.ObjectId.isValid(id)) {
      post = await Post.findById(id).populate('category').populate('author');
    }

    // If not found by id, try to find by slug
    if (!post) {
      post = await Post.findOne({ slug: id }).populate('category').populate('author');
    }

    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

  // push comment and save (use authenticated user if available)
  const commenter = req.user && req.user.id ? req.user.id : null;
  post.comments.push({ user: commenter, content });
    await post.save();

    res.status(201).json({ success: true, data: post, createdSlug: post.slug });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/search?q=term
exports.searchPosts = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('category')
      .populate('author')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: posts, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/mine - returns posts created by the authenticated user
exports.getMyPosts = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, error: 'Unauthorized' })

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const filter = { author: req.user.id };

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('category')
      .populate('author')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: posts, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts
exports.createPost = async (req, res, next) => {
  try {
    // collect a small, safe snapshot of incoming fields for debugging (no file buffers)
    const incoming = {
      title: req.body?.title ? 'present' : 'missing',
      content: req.body?.content ? 'present' : 'missing',
      category: req.body?.category || null,
      hasFile: !!(req.file && (req.file.originalname || req.file.fieldname)),
    }

    // In development, keep the snapshot available to return in helpful 4xx responses
    const devInfo = process.env.NODE_ENV === 'development' ? { received: incoming } : {}

    // ensure provided category exists
    const { category } = req.body;
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category id', ...devInfo });
    }

    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ success: false, error: 'Category not found', ...devInfo });

    // set author from authenticated user if available
    const authorId = req.user && req.user.id ? req.user.id : req.body.author;
    const payload = { ...req.body, author: authorId };

    // Handle image upload if file provided (multer memory storage places buffer on req.file.buffer)
    if (req.file && req.file.buffer) {
      try {
        const result = await streamUpload(req.file.buffer, { folder: 'posts' });
        payload.featuredImage = result.secure_url;
        payload.featuredImageId = result.public_id;
      } catch (uploadErr) {
        // Development-friendly fallback: if Cloudinary isn't configured or upload fails,
        // save the file locally to /uploads and continue. This avoids blocking local dev.
        const uploadDev = process.env.NODE_ENV === 'development' ? { received: incoming, uploadError: uploadErr.message || String(uploadErr) } : {}

        // If in development, attempt to write the buffer to local uploads folder
        if (process.env.NODE_ENV === 'development' && req.file && req.file.buffer) {
          try {
            const uploadsDir = path.join(__dirname, '..', 'uploads')
            fs.mkdirSync(uploadsDir, { recursive: true })
            const safeName = (req.file.originalname || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_')
            const filename = `post-${Date.now()}-${safeName}`
            const filepath = path.join(uploadsDir, filename)
            fs.writeFileSync(filepath, req.file.buffer)
            payload.featuredImage = `/uploads/${filename}`
            payload.featuredImageId = null
            // continue with creation using local file
          } catch (fsErr) {
            // If local save also fails, return the original upload error
            return res.status(500).json({ success: false, error: 'Image upload failed', ...uploadDev })
          }
        } else {
          return res.status(500).json({ success: false, error: 'Image upload failed', ...uploadDev })
        }
      }
    }

    // Ensure a slug is present (pre-save should create one from title, but make explicit
    // to avoid validation errors when middleware ordering differs). Compute a stable baseSlug
    // and attempt to create the document; if the unique index triggers (E11000) we will
    // append a short random suffix and retry a few times to avoid race-condition duplicates.
    let baseSlug = null
    if (!payload.slug && payload.title) {
      baseSlug = payload.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
      payload.slug = baseSlug
    } else if (payload.slug) {
      baseSlug = payload.slug
    }

    const maxAttempts = 6
    let attempt = 0
    let post = null
    while (attempt < maxAttempts) {
      try {
        post = await Post.create(payload)
        break
      } catch (createErr) {
        // Detect duplicate-key on slug robustly (different mongoose/mongo versions provide different shapes)
        const isDupKey = !!(
          (createErr && createErr.code === 11000) ||
          (createErr && createErr.name === 'MongoServerError' && createErr.code === 11000) ||
          (createErr && createErr.keyPattern && createErr.keyPattern.slug) ||
          (createErr && createErr.keyValue && createErr.keyValue.slug) ||
          (createErr && createErr.message && /duplicate key|E11000|dup key/i.test(createErr.message))
        )
        const slugDup = !!(
          (createErr && createErr.keyPattern && createErr.keyPattern.slug) ||
          (createErr && createErr.keyValue && createErr.keyValue.slug) ||
          (createErr && createErr.message && /slug/i.test(createErr.message))
        )
        if (isDupKey && slugDup && baseSlug) {
          // append a short random suffix and retry
          const suffix = Math.random().toString(36).slice(2, 8)
          payload.slug = `${baseSlug}-${suffix}`
          attempt += 1
          continue
        }
        // Not a slug duplicate or no baseSlug to derive from -> rethrow
        throw createErr
      }
    }

    if (!post) {
      // Include a helpful dev message when available
      const devMsg = process.env.NODE_ENV === 'development' ? { info: 'Failed to create post after multiple attempts (slug retries)', received: incoming } : {}
      return res.status(500).json({ success: false, error: 'Failed to create post after multiple attempts', ...devMsg })
    }

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// PUT /api/posts/:id
exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    // Only author or admin can update
    if (req.user && post.author && post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Handle image upload replacement
    if (req.file && req.file.buffer) {
      try {
        const result = await streamUpload(req.file.buffer, { folder: 'posts' });
        // delete old image from cloudinary if exists
        if (post.featuredImageId) {
          try {
            await cloudinary.uploader.destroy(post.featuredImageId);
          } catch (e) {
            // non-fatal: log and continue
            console.warn('Failed to delete old image from Cloudinary', e.message || e);
          }
        }
        post.featuredImage = result.secure_url;
        post.featuredImageId = result.public_id;
      } catch (uploadErr) {
        return res.status(500).json({ success: false, error: 'Image upload failed' });
      }
    }

    Object.assign(post, req.body);
    await post.save();

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    // Only author or admin can delete
    if (req.user && post.author && post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // delete cloudinary image if exists
    if (post.featuredImageId) {
      try {
        await cloudinary.uploader.destroy(post.featuredImageId);
      } catch (e) {
        // log and continue
        console.warn('Failed to delete image from Cloudinary during post delete', e.message || e);
      }
    }

    await post.remove();
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
