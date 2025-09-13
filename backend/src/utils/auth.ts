import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const extractGraduationYear = (schoolEmail: string): number | null => {
  const domain = '@smithville.k12.mo.us';
  if (!schoolEmail.endsWith(domain)) {
    return null;
  }

  const username = schoolEmail.replace(domain, '');
  const lastTwoChars = username.slice(-2);
  
  if (!/^\d{2}$/.test(lastTwoChars)) {
    return null;
  }

  const year = parseInt(lastTwoChars);
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  
  let graduationYear = currentCentury + year;
  if (graduationYear < currentYear - 10) {
    graduationYear += 100;
  }

  return graduationYear;
};

export const isValidSchoolEmail = (email: string): boolean => {
  return email.endsWith('@smithville.k12.mo.us');
};