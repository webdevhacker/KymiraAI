import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISession {
  token: string;
  userAgent: string;
  ip: string;
  location: string;
  deviceType: string;
  lastActive: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  
  // Roles
  role: 'user' | 'admin';
  
  // Terms & Privacy
  hasAcceptedTerms: boolean;
  
  // Email Verification
  isEmailVerified: boolean;
  emailVerificationOtp?: string;
  emailVerificationExpires?: Date;
  
  // Password Reset
  resetPasswordOtp?: string;
  resetPasswordExpires?: Date;
  
  // Two-Factor Auth
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Account Deletion
  deleteAccountOtp?: string;
  deleteAccountExpires?: Date;
  
  // Active Sessions
  sessions: ISession[];
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const SessionSchema = new Schema<ISession>({
  token: { type: String, required: true },
  userAgent: { type: String, required: true },
  ip: { type: String, required: true },
  location: { type: String, default: 'Unknown' },
  deviceType: { type: String, default: 'Unknown' },
  lastActive: { type: Date, default: Date.now }
}, { _id: true });

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String },
    
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    hasAcceptedTerms: { type: Boolean, default: false },
    
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    
    resetPasswordOtp: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    
    deleteAccountOtp: { type: String, select: false },
    deleteAccountExpires: { type: Date, select: false },
    
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    
    sessions: [SessionSchema]
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.emailVerificationOtp;
  delete obj.emailVerificationExpires;
  delete obj.resetPasswordOtp;
  delete obj.resetPasswordExpires;
  delete obj.deleteAccountOtp;
  delete obj.deleteAccountExpires;
  return obj;
};

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
