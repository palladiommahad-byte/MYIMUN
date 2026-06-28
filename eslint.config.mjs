import next from 'eslint-config-next';

// Flat config (ESLint 9). `next lint` was removed in Next 16, so linting now runs
// via the `eslint` CLI. eslint-config-next v16 ships a native flat-config array
// (core-web-vitals + typescript), so it's spread in directly — no FlatCompat needed.
const eslintConfig = [
    ...next,
    {
        ignores: ['.next/**', 'node_modules/**', 'src/generated/**', 'next-env.d.ts'],
    },
];

export default eslintConfig;
