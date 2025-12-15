// A/B Testing Service - A/B testing framework for answer variations (Phase 4 - Feature 7)
const ChatbotMessage = require('../models/chatbot_message.model');

class ABTestingService {
  constructor() {
    this.activeExperiments = new Map(); // Map<experimentId, experiment>
    this.userAssignments = new Map(); // Map<userId:experimentId, variant>
  }

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(data) {
    try {
      const {
        name,
        description,
        tenantId,
        controlVersion,
        treatmentVersion,
        splitRatio = 50,
        startDate,
        endDate,
        targetQueries = []
      } = data;

      const experimentId = this._generateId();

      const experiment = {
        id: experimentId,
        name,
        description,
        tenantId,
        controlVersion,
        treatmentVersion,
        splitRatio,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetQueries,
        status: 'active',
        createdAt: new Date(),
        results: {
          control: { count: 0, avgRating: 0, totalRating: 0 },
          treatment: { count: 0, avgRating: 0, totalRating: 0 }
        }
      };

      this.activeExperiments.set(experimentId, experiment);
      return experiment;
    } catch (err) {
      console.error('Error creating experiment:', err.message);
      throw err;
    }
  }

  /**
   * Assign user to variant (control or treatment)
   */
  assignUserToVariant(userId, experimentId) {
    try {
      const experiment = this.activeExperiments.get(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const key = `${userId}:${experimentId}`;

      // Check if already assigned
      if (this.userAssignments.has(key)) {
        return this.userAssignments.get(key);
      }

      // Random assignment based on split ratio
      const variant = Math.random() * 100 < experiment.splitRatio ? 'control' : 'treatment';
      this.userAssignments.set(key, variant);

      return variant;
    } catch (err) {
      console.error('Error assigning user to variant:', err.message);
      throw err;
    }
  }

  /**
   * Get variant for user (returns control or treatment)
   */
  getUserVariant(userId, experimentId) {
    const key = `${userId}:${experimentId}`;
    return this.userAssignments.get(key) || null;
  }

  /**
   * Record feedback for experiment
   */
  async recordFeedback(userId, experimentId, messageId, rating, feedback = {}) {
    try {
      const variant = this.getUserVariant(userId, experimentId);
      if (!variant) {
        throw new Error('User not assigned to experiment');
      }

      const experiment = this.activeExperiments.get(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Update experiment results
      experiment.results[variant].count++;
      experiment.results[variant].totalRating += rating;
      experiment.results[variant].avgRating = 
        experiment.results[variant].totalRating / experiment.results[variant].count;

      // Tag message with experiment metadata
      await ChatbotMessage.findByIdAndUpdate(
        messageId,
        {
          'experimentData.experimentId': experimentId,
          'experimentData.variant': variant,
          'experimentData.feedback': feedback
        }
      );

      return {
        variant,
        experimentId,
        recorded: true
      };
    } catch (err) {
      console.error('Error recording feedback:', err.message);
      throw err;
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId) {
    try {
      const experiment = this.activeExperiments.get(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const controlCount = experiment.results.control.count;
      const treatmentCount = experiment.results.treatment.count;

      // Calculate statistical significance (simplified)
      const results = {
        experimentId,
        name: experiment.name,
        status: experiment.status,
        control: {
          ...experiment.results.control,
          sampleSize: controlCount
        },
        treatment: {
          ...experiment.results.treatment,
          sampleSize: treatmentCount
        },
        winner: this._determineWinner(experiment),
        statisticalSignificance: this._calculateSignificance(experiment),
        confidenceLevel: 0.95
      };

      return results;
    } catch (err) {
      console.error('Error getting experiment results:', err.message);
      throw err;
    }
  }

  /**
   * List active experiments
   */
  async listExperiments(tenantId) {
    try {
      const experiments = Array.from(this.activeExperiments.values())
        .filter(e => e.tenantId === tenantId && e.status === 'active')
        .map(e => ({
          id: e.id,
          name: e.name,
          controlCount: e.results.control.count,
          treatmentCount: e.results.treatment.count,
          startDate: e.startDate,
          endDate: e.endDate
        }));

      return experiments;
    } catch (err) {
      console.error('Error listing experiments:', err.message);
      return [];
    }
  }

  /**
   * End experiment and declare winner
   */
  async endExperiment(experimentId) {
    try {
      const experiment = this.activeExperiments.get(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const winner = this._determineWinner(experiment);

      experiment.status = 'completed';
      experiment.winner = winner;
      experiment.completedAt = new Date();

      return {
        experimentId,
        winner,
        results: experiment.results
      };
    } catch (err) {
      console.error('Error ending experiment:', err.message);
      throw err;
    }
  }

  /**
   * Helper: determine winner based on average rating
   */
  _determineWinner(experiment) {
    const controlAvg = experiment.results.control.avgRating || 0;
    const treatmentAvg = experiment.results.treatment.avgRating || 0;

    if (controlAvg > treatmentAvg) return 'control';
    if (treatmentAvg > controlAvg) return 'treatment';
    return 'tie';
  }

  /**
   * Helper: calculate statistical significance (simplified)
   */
  _calculateSignificance(experiment) {
    const controlCount = experiment.results.control.count;
    const treatmentCount = experiment.results.treatment.count;

    // Require minimum sample size
    if (controlCount < 30 || treatmentCount < 30) {
      return { significant: false, confidence: 0 };
    }

    const controlAvg = experiment.results.control.avgRating;
    const treatmentAvg = experiment.results.treatment.avgRating;
    const diff = Math.abs(controlAvg - treatmentAvg);

    // Simplified t-test logic
    return {
      significant: diff > 0.5,
      confidence: Math.min(0.95, 0.5 + (diff * 0.1))
    };
  }

  /**
   * Helper: generate unique ID
   */
  _generateId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ABTestingService();
