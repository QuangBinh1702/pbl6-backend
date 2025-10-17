// Quản lý bài đăng
const Post = require('../models/post.model');
const Activity = require('../models/activity.model');

module.exports = {
  async getAllPosts(req, res) {
    try {
      const posts = await Post.find()
        .populate('activity')
        .sort({ created_at: -1 });
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPostById(req, res) {
    try {
      const post = await Post.findById(req.params.id)
        .populate('activity');
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPostsByActivity(req, res) {
    try {
      const posts = await Post.find({ activity: req.params.activityId })
        .populate('activity')
        .sort({ created_at: -1 });
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createPost(req, res) {
    try {
      const post = new Post(req.body);
      await post.save();
      await post.populate('activity');
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updatePost(req, res) {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('activity');
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json(post);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deletePost(req, res) {
    try {
      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json({ message: 'Post deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


