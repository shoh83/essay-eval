// src/utils/types.ts

export type ChatHistory = {
  role: 'user' | 'model';
  parts: { text: string }[];
};
