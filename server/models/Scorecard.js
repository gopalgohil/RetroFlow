import mongoose from 'mongoose';

/**
 * Scorecard Schema:
 * Stores 1-5 star performance ratings for sprint and retrospective contributors
 * applying Mehul Bhai's weighted formula:
 * Quality (35%) + Timeliness (25%) + Communication (25%) + Collaboration (15%) = 100%
 */
const scorecardSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },
    memberName: {
      type: String,
      required: true,
      trim: true,
    },
    memberEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    memberRole: {
      type: String,
      default: 'Developer',
      trim: true,
    },
    projectId: {
      type: String,
      default: null,
    },
    projectKey: {
      type: String,
      default: null,
      trim: true,
    },
    retroId: {
      type: String,
      default: null,
    },
    retroTitle: {
      type: String,
      default: null,
      trim: true,
    },
    sprintId: {
      type: String,
      default: null,
    },
    sprintName: {
      type: String,
      default: null,
      trim: true,
    },
    ratedBy: {
      id: String,
      name: String,
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      role: String,
    },
    ratings: {
      quality: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      collaboration: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
    weights: {
      quality: { type: Number, default: 0.35 },
      timeliness: { type: Number, default: 0.25 },
      communication: { type: Number, default: 0.25 },
      collaboration: { type: Number, default: 0.15 },
    },
    overallScore: {
      type: Number,
      required: true,
      min: 1.0,
      max: 5.0,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

scorecardSchema.index({ memberEmail: 1, createdAt: -1 });
scorecardSchema.index({ projectId: 1 });
scorecardSchema.index({ retroId: 1 });
scorecardSchema.index({ createdAt: -1 });

export const Scorecard = mongoose.model('Scorecard', scorecardSchema);
export default Scorecard;
