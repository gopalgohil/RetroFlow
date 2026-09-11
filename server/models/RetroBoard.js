import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Subdocument Schema for an individual retrospective topic/column
 */
const topicSchema = new mongoose.Schema(
  {
    topicId: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 250,
    },
    icon: {
      type: String,
      default: 'smile', // e.g. smile, frown, bulb, puzzle, rocket, anchor, target, flag
    },
    color: {
      type: String,
      default: '#10B981', // Hex code
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * Subdocument Schema for an individual retrospective sticky card/thought
 */
const cardSchema = new mongoose.Schema(
  {
    cardId: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    topicId: {
      type: String,
      required: [true, 'Topic ID is required'],
    },
    text: {
      type: String,
      required: [true, 'Card feedback text is required'],
      trim: true,
      maxlength: 1000,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorEmail: {
      type: String,
      trim: true,
      default: '',
    },
    votes: {
      type: Number,
      default: 0,
    },
    voters: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

/**
 * Retrospective Session Board Schema
 */
const retroBoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Retrospective session title is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'active',
      index: true,
    },
    shareToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomUUID().slice(0, 12),
    },
    // TeamRetro Process & Waiting Room Controls
    approvalRequired: {
      type: Boolean,
      default: false, // Require Admin approval before joining
    },
    revealMode: {
      type: Boolean,
      default: false, // Blur cards until facilitator reveals
    },
    votingLimit: {
      type: Number,
      default: 5, // Maximum votes per developer
      min: 1,
      max: 20,
    },
    backgroundTheme: {
      type: String,
      enum: ['sailboat', 'standard', 'space', 'mountain', 'minimal'],
      default: 'standard',
    },
    topics: {
      type: [topicSchema],
      default: () => [
        {
          topicId: crypto.randomUUID(),
          title: 'What went well?',
          description: 'Things we are proud of or happy about',
          icon: 'smile',
          color: '#10B981',
          order: 0,
        },
        {
          topicId: crypto.randomUUID(),
          title: 'What could be improved?',
          description: 'Bottlenecks, frictions, or blockers to resolve',
          icon: 'frown',
          color: '#F43F5E',
          order: 1,
        },
        {
          topicId: crypto.randomUUID(),
          title: 'Action Items',
          description: 'Concrete deliverables for the upcoming sprint',
          icon: 'target',
          color: '#0EA5E9',
          order: 2,
        },
      ],
    },
    cards: {
      type: [cardSchema],
      default: [],
    },
    approvedMembers: {
      type: [String],
      default: [], // Whitelisted emails
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
      default: null,
    },
    projectKey: {
      type: String,
      trim: true,
      default: null,
    },
    sprintId: {
      type: String,
      default: null,
    },
    sprintName: {
      type: String,
      trim: true,
      default: null,
    },
    isProjectScoped: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-speed dashboard, whitelisting, and real-time session lookups
retroBoardSchema.index({ shareToken: 1 });
retroBoardSchema.index({ createdBy: 1, createdAt: -1 });
retroBoardSchema.index({ approvedMembers: 1 });
retroBoardSchema.index({ projectId: 1 });
retroBoardSchema.index({ projectKey: 1 });

const RetroBoard = mongoose.model('RetroBoard', retroBoardSchema);

export default RetroBoard;
