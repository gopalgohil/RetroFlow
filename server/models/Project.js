import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Subdocument Schema: Sprint Backlog Story or Action Item
 */
const backlogItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `item-${crypto.randomUUID().slice(0, 8)}`,
    },
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['story', 'task', 'bug', 'action_item'],
      default: 'story',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    storyPoints: {
      type: Number,
      default: 3,
      min: 0,
      max: 100,
    },
    assignee: {
      name: { type: String, trim: true },
      avatar: { type: String, trim: true },
    },
    sourceRetroId: { type: String },
    sourceRetroTitle: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Subdocument Schema: Sprint Cycle
 */
const sprintSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `sprint-${crypto.randomUUID().slice(0, 8)}`,
    },
    name: {
      type: String,
      required: [true, 'Sprint name is required'],
      trim: true,
      maxlength: 150,
    },
    number: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['active', 'upcoming', 'completed'],
      default: 'upcoming',
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    endDate: {
      type: String,
      default: () => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    },
    goal: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    daysLeft: {
      type: Number,
      default: 14,
    },
    totalStoryPoints: {
      type: Number,
      default: 0,
    },
    completedStoryPoints: {
      type: Number,
      default: 0,
    },
    openBlockers: {
      type: Number,
      default: 0,
    },
    items: [backlogItemSchema],
  },
  { _id: false }
);

/**
 * Subdocument Schema: Project Team Member with Role
 */
const projectMemberSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `m-${crypto.randomUUID().slice(0, 8)}`,
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Member email is required'],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      trim: true,
      default: 'Developer',
    },
    avatar: {
      type: String,
      default: 'DEV',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Subdocument Schema: Retrospective Session Link
 */
const projectRetroLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    shareToken: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    scheduledDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: {
      type: String,
      enum: ['active', 'completed', 'draft'],
      default: 'active',
    },
    sprintName: { type: String, default: 'Sprint Active' },
    topicsCount: { type: Number, default: 3 },
    cardsCount: { type: Number, default: 0 },
    actionItemsCount: { type: Number, default: 0 },
    actionItemsExported: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Subdocument Schema: Velocity History Metric
 */
const velocityMetricSchema = new mongoose.Schema(
  {
    sprintName: { type: String, required: true },
    committedPoints: { type: Number, default: 0 },
    completedPoints: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Main Enterprise Project Schema
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 120,
    },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['scrum', 'kanban'],
      default: 'scrum',
    },
    healthStatus: {
      type: String,
      enum: ['on_track', 'at_risk', 'delayed'],
      default: 'on_track',
      index: true,
    },
    cadence: {
      type: String,
      enum: ['1_week', '2_weeks', '3_weeks', 'custom'],
      default: '2_weeks',
    },
    customCadenceDays: {
      type: Number,
      default: 14,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    lead: {
      id: { type: String, default: 'lead-1' },
      name: { type: String, default: 'Gopal' },
      email: { type: String, default: 'gopalgohel249@gmail.com' },
      avatar: { type: String, default: 'G' },
    },
    members: [projectMemberSchema],
    sprints: [sprintSchema],
    retrospectives: [projectRetroLinkSchema],
    velocityHistory: [velocityMetricSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Virtual active sprint resolution
        ret.activeSprint = ret.sprints?.find((s) => s.status === 'active') || ret.sprints?.[0] || null;
        return ret;
      },
    },
  }
);

// Compound & Performance indexes for high-speed sub-millisecond queries
projectSchema.index({ key: 1 });
projectSchema.index({ key: 1, createdBy: 1 });
projectSchema.index({ 'members.email': 1 });
projectSchema.index({ 'lead.email': 1 });
projectSchema.index({ createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
export default Project;
