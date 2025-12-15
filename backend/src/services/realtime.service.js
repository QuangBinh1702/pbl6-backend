// Real-time Service - WebSocket support for analytics & real-time updates (Phase 4 - Feature 5)
const EventEmitter = require('events');

class RealtimeService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Map<userId, Set<socketId>>
    this.subscriptions = new Map(); // Map<socketId, Set<subscriptionType>>
    this.analyticsBuffer = [];
    this.bufferSize = parseInt(process.env.ANALYTICS_BUFFER_SIZE || 10);
    this.flushInterval = parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || 5000);

    this.startBufferFlush();
  }

  /**
   * Register a WebSocket client
   */
  registerClient(socketId, userId) {
    try {
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }

      this.clients.get(userId).add(socketId);
      this.subscriptions.set(socketId, new Set());

      console.log(`[Realtime] Client ${socketId} registered for user ${userId}`);
      return true;
    } catch (err) {
      console.error('Error registering client:', err.message);
      return false;
    }
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterClient(socketId, userId) {
    try {
      if (this.clients.has(userId)) {
        this.clients.get(userId).delete(socketId);
        
        if (this.clients.get(userId).size === 0) {
          this.clients.delete(userId);
        }
      }

      this.subscriptions.delete(socketId);
      console.log(`[Realtime] Client ${socketId} unregistered`);
      return true;
    } catch (err) {
      console.error('Error unregistering client:', err.message);
      return false;
    }
  }

  /**
   * Subscribe client to analytics updates
   */
  subscribeToAnalytics(socketId, subscriptionType = 'dashboard') {
    try {
      if (!this.subscriptions.has(socketId)) {
        this.subscriptions.set(socketId, new Set());
      }

      this.subscriptions.get(socketId).add(`analytics:${subscriptionType}`);
      console.log(`[Realtime] Client ${socketId} subscribed to analytics:${subscriptionType}`);
      return true;
    } catch (err) {
      console.error('Error subscribing to analytics:', err.message);
      return false;
    }
  }

  /**
   * Unsubscribe client from analytics
   */
  unsubscribeFromAnalytics(socketId, subscriptionType = 'dashboard') {
    try {
      if (this.subscriptions.has(socketId)) {
        this.subscriptions.get(socketId).delete(`analytics:${subscriptionType}`);
      }
      return true;
    } catch (err) {
      console.error('Error unsubscribing from analytics:', err.message);
      return false;
    }
  }

  /**
   * Broadcast analytics update
   */
  broadcastAnalyticsUpdate(data, subscriptionType = 'dashboard') {
    try {
      const update = {
        type: 'analytics_update',
        subscriptionType,
        data,
        timestamp: new Date()
      };

      let broadcastCount = 0;

      for (const [socketId, subs] of this.subscriptions) {
        if (subs.has(`analytics:${subscriptionType}`)) {
          this.emit('send', {
            socketId,
            message: update
          });
          broadcastCount++;
        }
      }

      console.log(`[Realtime] Broadcast to ${broadcastCount} clients for ${subscriptionType}`);
      return broadcastCount;
    } catch (err) {
      console.error('Error broadcasting analytics update:', err.message);
      return 0;
    }
  }

  /**
   * Send real-time feedback notification
   */
  broadcastFeedbackEvent(feedbackData) {
    try {
      const event = {
        type: 'feedback_event',
        event: 'new_feedback',
        data: feedbackData,
        timestamp: new Date()
      };

      let sentCount = 0;

      for (const [socketId, subs] of this.subscriptions) {
        if (subs.has('feedback:updates')) {
          this.emit('send', {
            socketId,
            message: event
          });
          sentCount++;
        }
      }

      return sentCount;
    } catch (err) {
      console.error('Error broadcasting feedback event:', err.message);
      return 0;
    }
  }

  /**
   * Buffer analytics data for batch processing
   */
  bufferAnalyticsData(data) {
    try {
      this.analyticsBuffer.push({
        ...data,
        timestamp: new Date()
      });

      // Flush if buffer reaches size
      if (this.analyticsBuffer.length >= this.bufferSize) {
        this.flushBuffer();
      }
    } catch (err) {
      console.error('Error buffering analytics data:', err.message);
    }
  }

  /**
   * Flush buffered analytics
   */
  flushBuffer() {
    try {
      if (this.analyticsBuffer.length === 0) return;

      const batch = [...this.analyticsBuffer];
      this.analyticsBuffer = [];

      this.emit('flush_analytics', {
        batch,
        count: batch.length,
        timestamp: new Date()
      });

      console.log(`[Realtime] Flushed ${batch.length} analytics records`);
    } catch (err) {
      console.error('Error flushing analytics buffer:', err.message);
    }
  }

  /**
   * Start periodic buffer flush
   */
  startBufferFlush() {
    setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  /**
   * Get client count
   */
  getClientCount() {
    let total = 0;
    for (const sockets of this.clients.values()) {
      total += sockets.size;
    }
    return total;
  }

  /**
   * Get subscription summary
   */
  getSubscriptionSummary() {
    const summary = {
      totalClients: this.getClientCount(),
      subscriptions: {}
    };

    for (const subs of this.subscriptions.values()) {
      for (const sub of subs) {
        summary.subscriptions[sub] = (summary.subscriptions[sub] || 0) + 1;
      }
    }

    return summary;
  }
}

module.exports = new RealtimeService();
