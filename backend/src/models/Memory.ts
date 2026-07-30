import mongoose, { Document, Schema } from 'mongoose';

export interface IMemory extends Document {
  userId: mongoose.Types.ObjectId;
  facts: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    facts: [{ type: String, maxlength: 500 }],
  },
  { timestamps: true }
);

export const Memory = mongoose.model<IMemory>('Memory', MemorySchema);
