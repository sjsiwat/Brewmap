# Review — Phase 6: Deploy + QA

## Round 1 — 2026-10-27
**Range:** `main..phase-6-deploy` (`b0ccfff..09c9a6d`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (6 suites, 22 passed) → `test:e2e` (4 suites, 53 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` บน Next.js 16.4.3 — 182 static pages generated + Proxy middleware enabled)

### Findings
ไม่พบปัญหาในระดับ `blocker`, `major`, `minor` หรือ `nit` — งานครบตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L303-L320) (6.1–6.6) ทุกหัวข้อ

### สิ่งที่ทำได้ดี (optional)
- **Render Blueprint ([`render.yaml`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/render.yaml#L1-L40)) และการจัดการ Secret:** กำหนด `rootDir: server`, `buildCommand: npm ci --include=dev && npm run build` (เพื่อให้มี `@nestjs/cli` ตอน build แม้ `NODE_ENV=production`), `startCommand: node dist/main`, `healthCheckPath: /api/health` และ `TRUST_PROXY: "1"` ตรงกับโค้ดใน `main.ts` ค่าลับทั้งหมด (`MONGODB_URI`, `WEB_ORIGIN`, `PROXY_SECRET`, `GEMINI_API_KEY`) ตั้งเป็น `sync: false` และ `JWT_SECRET` ใช้ `generateValue: true` โดยไม่มีค่า secret ใด ๆ อยู่ใน git
- **ความเข้ากันได้ของ [`server/package-lock.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/package-lock.json#L2715-L2760) กับ npm 10 บน Node 22:** สร้าง lockfile ใหม่ด้วย npm 10 แก้ปัญหา optional peer dependency (`webpack@5.112.2` ภายใต้ `@nestjs/cli`) และ `libc` filter ที่ทำให้ `npm ci` บน Render ล้มเหลว
- **Endpoint `GET /api/auth/session` ([`auth.controller.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/auth.controller.ts#L73-L80), [`auth.service.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/auth.service.ts#L76-L92)):** ตรวจสอบครบเหมือน [`JwtAuthGuard`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/jwt-auth.guard.ts#L28-L48) ทุกประการ ได้แก่ ตรวจลายเซ็นและวันหมดอายุด้วย `jwtService.verifyAsync`, ตรวจว่าผู้ใช้ยังมีอยู่ในฐานข้อมูลผ่าน [`usersService.findById`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/users/users.service.ts#L46-L50) และเทียบ `(user.tokenVersion ?? 0) !== (payload.ver ?? 0)` เพื่อปฏิเสธ token ที่ถูก logout ไปแล้ว รวมถึงแปลงผลลัพธ์ผ่าน [`toUserResponse`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/users/user-response.dto.ts) จึงไม่รั่ว `passwordHash` หรือ field ภายใน พร้อม e2e test ([`auth.e2e-spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/test/auth.e2e-spec.ts#L200-L240)) ครบทั้งกรณีไม่มี cookie, token ปลอม, token ใช้งานได้ และ token ที่เพิกถอนแล้ว
- **การปรับสีผ่านเกณฑ์ WCAG AA ([`globals.css`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/app/globals.css#L8-L25)):** ปรับ `--color-muted` (`#676057`) และ `--color-rust` (`#a73e1c`) สำหรับพื้นหลังสีสว่าง และแยก `--color-rust-bright` (`#d97a52`) สำหรับข้อความบนพื้น `bg-ink` ใน [`cafe-finder.tsx`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-finder.tsx#L146), [`hero-visual.tsx`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/hero-visual.tsx#L70) และ [`point-of-view.tsx`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/point-of-view.tsx#L8) ให้มีค่า contrast ≥ 4.6:1 โดยรักษาโทนสีของดีไซน์เดิมไว้
- **เอกสาร Architecture และ Deploy ใน [`README.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/README.md#L355-L406):** แผนภาพ Mermaid และคำอธิบายตรงกับการทำงานจริงของระบบ (Next.js `/api/*` rewrite สำหรับ first-party cookie, การส่งต่อ `x-client-ip` คู่กับ `x-proxy-secret`, ISR ของหน้าร้าน, ลิงก์ production และข้อควรระวังเรื่อง `API_URL` ต้องลงท้ายด้วย `/api`)

## Response
ไม่มี finding ให้แก้ · หลัง merge จะรัน QA ชุดเดิมซ้ำบน production (Vercel deploy `main` ใหม่) และบันทึกผลใน plan.md
