import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'no-explicit-any': 'off',
      '@typescript-eslint/no-unused-any': ['error'],
      'no-unused-any': 'off',
      '@typescript-eslint/no-unused-any': ['error'],
    },
  },
];

export default eslintConfig;
