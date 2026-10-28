// node_modules 의 Alpine.js ESM 빌드를 public/assets/vendor 로 복사한다.
// 외부 CDN 없이 우리 도메인에서 직접 서빙하기 위함 (속도·보안 정책 단순화).
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/assets/vendor');

mkdirSync(outDir, { recursive: true });
copyFileSync(
  join(root, 'node_modules/alpinejs/dist/module.esm.min.js'),
  join(outDir, 'alpine.esm.js'),
);
console.log('✔ Alpine.js → public/assets/vendor/alpine.esm.js');
