# Review — Phase 3: Auth + Favorites

## Round 1 — 2026-10-27
**Range:** `1fc0898..phase-3-auth-favorites`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (2 suites, 3 passed) → `test:e2e` (2 suites, 23 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` (182 static pages generated))

### Findings
ไม่พบปัญหาในระดับ `blocker` หรือ `major` — งานครบทุกข้อตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L139-L163) (3.1–3.12) และทำตาม Decision D3(a) อย่างถูกต้อง

1. **[nit]** [`server/src/auth/dto/auth.dto.ts:27`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/dto/auth.dto.ts#L27-L34) — `LoginDto.password` มี `@IsString()` และ `@MaxLength(72)` แต่ยังไม่มี `@IsNotEmpty()` (หรือ `@MinLength(1)`)
   - เกิดเมื่อ: ส่ง `{ email: "user@example.com", password: "" }` ไปที่ `POST /api/auth/login` โดยตรง ตัว `ValidationPipe` จะปล่อยผ่านไปทำ `bcrypt.compare` ใน [`AuthService.login`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/auth.service.ts#L46-L56) แล้วค่อยตอบ 401 แทนที่จะตัดจบด้วย 400 ตั้งแต่ชั้น DTO validation
   - แนะนำ: เพิ่ม `@IsNotEmpty()` บน `LoginDto.password` เพื่อไม่ให้เสียรอบคำนวณ `bcrypt.compare` เมื่อส่งรหัสผ่านว่างเปล่า

### สิ่งที่ทำได้ดี (optional)
- **Security & Timing-Safe Auth (3.1–3.6):** [`AuthService`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/auth.service.ts#L15-L60) ใช้ `DUMMY_HASH` เปรียบเทียบด้วย `bcrypt.compare` เสมอแม้ไม่พบอีเมลเพื่อกัน timing attack พร้อมจำกัดความยาวรหัสผ่านใน [`RegisterDto`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/dto/auth.dto.ts#L15-L18) ที่ 8–72 ตัวอักษรตามข้อจำกัด 72 bytes ของ bcrypt, อาศัย unique index ของ MongoDB (`11000` → 409) ป้องกัน race condition ตอนสมัครซ้ำพร้อมกัน, และแยก [`toUserResponse`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/users/user-response.dto.ts#L11-L18) ไม่ให้ `passwordHash` หลุดออกทาง response
- **First-Party Cookie via Next.js Rewrite (D3a & 3.10):** [`web/next.config.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/next.config.ts#L5-L10) และ [`web/lib/api.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/api.ts#L5-L8) แยกการเรียก API ระหว่างฝั่ง browser (`/api` ผ่าน proxy rewrite บน origin เดียวกันเพื่อให้ cookie `access_token` แบบ `httpOnly; SameSite=Lax` เป็น first-party) กับฝั่ง server component (`process.env.API_URL` โดยตรง) พร้อมดักกรณี proxy ตอบ 5xx ที่ไม่ใช่ JSON เมื่อ API server ปิดอยู่ให้เป็น unreachable error อย่างเหมาะสม
- **Idempotent Favorites & Clean Frontend UX/A11y (3.7–3.12):** [`FavoritesService`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/favorites/favorites.service.ts#L22-L50) รองรับการกดซ้ำ/ลบซ้ำแบบ idempotent (รวมถึงดัก `11000` เมื่อเกิด concurrent upsert), [` safeNextPath`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/auth.tsx#L77-L79) ป้องกัน open redirect จาก `?next=`, และ [`FavoriteButton`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-finder.tsx#L244-L245) ถูกวางแยกนอก `<Link>` เพื่อไม่ให้ `<button>` ซ้อนอยู่ใน `<a>` ตามมาตรฐาน HTML และ accessibility

## Response
- **#1 [nit] แก้แล้ว** (`cfd1660`): `LoginDto.password` เพิ่ม `@MinLength(1)` → รหัสผ่านว่างได้ 400 ตั้งแต่ชั้น validation ไม่ถึง `bcrypt.compare` · เพิ่ม e2e "rejects an empty password before checking it -> 400" · `npm run gate:server` ผ่าน (e2e 24/24) · ฝั่ง web ฟอร์มมี `required` อยู่แล้ว และ map 400 เป็นข้อความ "Enter a valid email and your password."
