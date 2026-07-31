import mongoose, { Document, Schema } from 'mongoose';

export interface IMemory extends Document {
  userId: mongoose.Types.ObjectId;
  facts: string[];
  skills: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    facts: [{ type: String, maxlength: 500 }],
    skills: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export const Memory = mongoose.model<IMemory>('Memory', MemorySchema);
