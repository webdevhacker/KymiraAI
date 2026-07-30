import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
  type: string;
  url: string;
  name: string;
}

export interface ISearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: IAttachment[];
  searchResults: ISearchResult[];
  imageUrl?: string;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  type: { type: String },
  url: { type: String },
  name: { type: String },
});

const SearchResultSchema = new Schema<ISearchResult>({
  title: { type: String },
  url: { type: String },
  snippet: { type: String },
  score: { type: Number },
});

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    attachments: { type: [AttachmentSchema], default: [] },
    searchResults: { type: [SearchResultSchema], default: [] },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
