# BrewMap AI — Implementation Plan

> ไฟล์นี้คือ **source of truth** ของงานทั้งหมด
> - **Implementer:** Claude Code — เขียนโค้ดตามแผน ทีละ step
> - **Reviewer:** Antigravity — ตรวจทีละ phase ตาม [`REVIEW.md`](REVIEW.md)
> - **Owner:** siwat — ตัดสินใจข้อที่อยู่ใน "Decisions"

---

## 1. Workflow

```
 ┌──────────── Claude ────────────┐      ┌────────── Antigravity ──────────┐
 │ 1. หา phase แรกที่ยังไม่ approved │      │                                 │
 │ 2. ทำทีละ step + commit ทีละ step │      │                                 │
 │ 3. รัน Gate ของ phase ให้ผ่าน     │      │                                 │
 │ 4. Status → awaiting-review     │ ───▶ │ 5. ตรวจตาม REVIEW.md             │
 │    แล้ว "หยุด"                   │      │ 6. เขียน reviews/phase-N.md       │
 │                                 │ ◀─── │    Verdict: APPROVED / CHANGES   │
 │ 7a. CHANGES → แก้ แล้วกลับไปข้อ 4 │      │                                 │
 │ 7b. APPROVED → phase ถัดไป       │      │                                 │
 └─────────────────────────────────┘      └─────────────────────────────────┘
```

### กติกาของ Claude (Implementer)
1. เริ่มทุกครั้งด้วยการอ่าน `plan.md` และไฟล์ `reviews/` ล่าสุด
2. ทำได้ **เฉพาะ phase ที่ phase ก่อนหน้าเป็น `approved` แล้ว** — ห้ามข้าม phase
3. ถ้า phase ล่าสุดเป็น `changes-requested` → แก้ทุก finding ระดับ blocker/major ก่อน แล้วเขียนตอบใต้หัวข้อ `## Response` ในไฟล์ review เดียวกัน
4. ทำทีละ step, ติ๊ก `[x]` เมื่อเสร็จ, commit ทีละ step: `phase N.k: <สิ่งที่ทำ>`
5. ถ้าเจอเรื่องที่ต้องตัดสินใจและยังไม่มีคำตอบใน **Decisions** → **หยุดและถาม** ห้ามเดาเอง
6. ห้ามเพิ่ม scope นอก plan — ถ้าเห็นว่าควรเพิ่ม ให้จดไว้ใน "Backlog" แทน
7. จบ phase: รัน Gate ให้ผ่านทั้งหมด → กรอก `Review range` → เปลี่ยน Status เป็น `awaiting-review` → commit → **หยุด**
8. Merge เข้า `main` ได้ **เฉพาะหลัง phase นั้น `approved`** → merge, push, เปลี่ยน Status เป็น `approved` (owner อนุญาต 2026-10-27) · ห้าม merge งานที่ยังไม่ผ่าน review

### Status ที่ใช้
`todo` → `in-progress` → `awaiting-review` → (`changes-requested` ↺) → `approved` (= merge เข้า main แล้ว)

### Branch
- 1 phase = 1 branch: `phase-N-<ชื่อ>` แตกจาก `main` ที่อัปเดตล่าสุด
- `Review range` = `<commit ก่อนเริ่ม phase>..<commit ล่าสุด>` ให้ reviewer ใช้ `git diff`

### วิธีสั่งงาน (auto)
Owner สั่ง Claude ครั้งเดียว: `ทำงานต่อตาม plan.md` → Claude ทำ phase จนจบ แล้วเรียก Antigravity เอง:

```bash
# รันที่ root ของ repo ขณะ checkout branch ของ phase
agy -p "ตรวจงานตาม REVIEW.md สำหรับ Phase N ..." --print-timeout 1500s > <scratchpad>/review.md
```
- Antigravity รัน Gate เองได้เฉพาะคำสั่งใน allow-list (ดู `REVIEW.md` → "คำสั่งที่อนุญาต") — ไม่มีสิทธิ์เขียนไฟล์
- Claude บันทึก stdout ลง `reviews/phase-N.md` **ตามนั้นทุกตัวอักษร** แล้วอ่าน Verdict
  - `APPROVED` → merge เข้า main, push, ไป phase ถัดไป
  - `CHANGES_REQUESTED` → แก้, เขียน `## Response`, เรียก `agy` ตรวจรอบใหม่
- ถ้า `agy` ถูกปฏิเสธสิทธิ์หรือ error → Claude หยุดและแจ้ง owner (ห้ามตรวจแทนเอง)
- ถ้าตรวจเกิน 3 รอบแล้วยังไม่ผ่าน → หยุดและให้ owner ตัดสิน

---

## 2. Decisions (owner ตอบแล้ว 2026-10-27)

| # | เรื่อง | ตัวเลือก | แนะนำ | ใช้ใน | คำตอบ |
|---|---|---|---|---|---|
| D1 | Café Finder หลังย้ายไป API | (a) กรองแบบ strict ผ่าน API (ร้านที่ไม่ตรงทุกเงื่อนไขจะไม่แสดง) (b) คง "% match" แบบเดิม โดยให้ API คำนวณคะแนน | (a) — มาตรฐาน, ง่าย, ส่วน "ค้นแบบยืดหยุ่น" ให้ AI Finder (Phase 5) ทำแทน | Phase 2 | ✅ (a) |
| D2 | หน้า `/cafes/[slug]` | (a) build static ทุกร้านตอน build + revalidate (b) render ตอน request ทุกครั้ง | (a) — เร็ว, SEO ดี, ข้อมูลร้านเปลี่ยนไม่บ่อย | Phase 2 | ✅ (a) |
| D3 | Cookie ตอน production (web กับ API อยู่คนละโดเมน) | (a) ให้ Next.js rewrite `/api/*` ไปที่ server → cookie เป็น first-party (b) `SameSite=None; Secure` ข้ามโดเมน | (a) — browser หลายตัวบล็อก third-party cookie | Phase 3, 6 | ✅ (a) |
| D4 | Hosting | web: Vercel / server: Render หรือ Railway | Vercel + Render (มี free tier) | Phase 6 | ✅ Vercel + Render |

---

## 3. Phases

### Phase 0 — Setup backend
**Status:** `approved` — [reviews/phase-0-1.md](reviews/phase-0-1.md)
**Branch:** `feat/nest-backend` (แตกจาก `fix/cafe-data-model`)
**Review range:** `6f5676e..feat/nest-backend` (ใช้ `git diff 6f5676e..feat/nest-backend`)

- [x] 0.1 Scaffold NestJS 11 ใน `server/`
- [x] 0.2 `@nestjs/config` + `.env.example` (`MONGODB_URI`, `PORT`, `WEB_ORIGIN`), `.env` อยู่ใน `.gitignore`
- [x] 0.3 Global prefix `/api`, `ValidationPipe` (whitelist + forbidNonWhitelisted + transform), CORS `credentials: true`
- [x] 0.4 Swagger ที่ `/api/docs`
- [x] 0.5 `GET /api/health` รายงานสถานะ DB
- [x] 0.6 เชื่อม MongoDB Atlas สำเร็จ (owner ยืนยันแล้ว: `database: connected`)

**Acceptance:** `npm run start:dev` แล้ว `/api/health` ตอบ connected, `/api/docs` เปิดได้

### Phase 1 — Cafes API
**Status:** `approved` (ตรวจรวมกับ Phase 0)
**Branch / Review range:** เดียวกับ Phase 0

- [x] 1.1 `Cafe` schema — `location` เป็น GeoJSON Point + index `2dsphere`, `slug` unique, index `rating`
- [x] 1.2 `npm run seed` — อ่าน `web/data/cafes.json`, upsert ด้วย `$set` ตาม slug (รันซ้ำได้, ไม่ลบ field ที่เพิ่มทีหลัง)
- [x] 1.3 `GET /api/cafes` — filters (price, drinkType, parking, petFriendly, tag, area), geo (`lat`/`lng`/`radiusKm` → `distanceKm`), sort, pagination
- [x] 1.4 `GET /api/cafes/top` — `tag`, `minReviews` (default 50), `limit`
- [x] 1.5 `GET /api/cafes/filters`
- [x] 1.6 `GET /api/cafes/:slug` + 404
- [x] 1.7 Response shape เหมือน `Cafe` ใน `web/lib/cafes.ts` (+ `distanceKm`)
- [x] 1.8 Tests: unit (`toCafeResponse`) + e2e 10 เคส บน in-memory MongoDB
- [x] 1.9 `server/README.md`
- [x] 1.10 Commit + กรอก Review range

**Gate (server):** `npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run test:e2e` · `npm run build` (ตั้งแต่ Phase 2b รวมเป็น `npm run gate:server` ที่ root)

---

### Phase 2 — ต่อ Frontend เข้า API
**Status:** `approved` — [reviews/phase-2.md](reviews/phase-2.md) · D1 = (a) strict filter · D2 = (a) static + revalidate
**Branch:** `phase-2-web-api` · PR #2
**Review range:** `75bf9e0..phase-2-web-api` (ใช้ `git diff 75bf9e0..phase-2-web-api`) · สรุป docs Next 16 (2.1) อยู่ใน commit message ของ `b35d5f6`

- [x] 2.1 อ่าน `web/node_modules/next/dist/docs/` เรื่อง data fetching / caching / revalidate ของ Next 16 แล้วสรุปสั้น ๆ ใน PR/commit message (ตาม `web/AGENTS.md`)
- [x] 2.2 `web/lib/api.ts` — typed fetch wrapper, ไม่ส่ง query key ที่ค่าว่าง/undefined, base URL จาก `NEXT_PUBLIC_API_URL`, `ApiError` class, `web/.env.example`
- [x] 2.3 ย้าย type `Cafe` ให้ตรงกับ response ของ API (ลบ field ที่ API ไม่ส่ง)
- [x] 2.4 `/cafes/[slug]` — ดึงจาก `GET /api/cafes/:slug` ฝั่ง server component, 404 → `notFound()`, ทำตาม D2
- [x] 2.5 `/cafes` — ตัวกรองเรียก `GET /api/cafes` ส่ง `lat`/`lng` เมื่อผู้ใช้อนุญาต location, ทำตาม D1, ใช้ `distanceKm` จาก API
- [x] 2.6 Loading / error / empty state ทุกหน้าที่ fetch
- [x] 2.7 เลิก import `data/cafes.json` ใน runtime ของ web (ไฟล์ยังอยู่ ใช้เป็น seed)
- [x] 2.8 Root `package.json` + script `dev` รัน web และ server พร้อมกัน (`concurrently`)
- [x] 2.9 Root `README.md` — วิธีรันทั้งระบบในเครื่อง
- [x] 2.10 (จาก review 0–1 #1) server: query param ที่เป็น `""` ให้ถือเป็น `undefined` ก่อน `@Type(() => Number)` + e2e test `?lat=&lng=` และ `?maxPrice=`
- [x] 2.11 (จาก review 0–1 #2–3) eslint `no-explicit-any` → `error` · ใส่ `NODE_OPTIONS=--experimental-vm-modules` ให้ `test:watch`, `test:cov`

**Gate:** server gate ทั้งหมด + web: `npx tsc --noEmit` · `npm run lint` · `npm run build` (ตอน build ต้องมี server รันอยู่ ถ้าเลือก D2a)
**Acceptance:** ปิด server แล้วหน้าเว็บแสดง error state ไม่ crash · เปิด server แล้วทุกหน้าทำงานเหมือนเดิม · ไม่มี console error ที่ 375 / 768 / 1440px

---

### Phase 2b — แก้ข้อเสนอแนะจาก review Phase 2 + Gate ของ reviewer
**Status:** `approved` — [reviews/phase-2b.md](reviews/phase-2b.md) (owner สั่ง 2026-10-27)
**Branch:** `phase-2b-review-followups`
**Review range:** `5f03977..phase-2b-review-followups` (ใช้ `git diff 5f03977..phase-2b-review-followups`)

- [x] 2b.1 (review 2 #1) `useCafeSearch.retry()` ยิงใหม่เฉพาะหน้าที่ error — หน้าที่โหลดสำเร็จแล้วไม่ถูกยิงซ้ำ
- [x] 2b.2 (review 2 #2) `tag` / `area` (และ `tag` ของ `/top`) ใช้ `emptyToUndefined` + e2e
- [x] 2b.3 Root script `gate:server` / `gate:web` ให้ reviewer รัน Gate จาก root ได้ · server เพิ่ม `typecheck`, `lint:check` (ไม่ --fix) · web เพิ่ม `typecheck` · อัปเดต allow-list ใน `REVIEW.md`

**Gate:** `npm run gate:server` · `npm run gate:web` (ที่ root, เปิด API ไว้)

---

### Phase 3 — Auth + Favorites
**Status:** `approved` — [reviews/phase-3.md](reviews/phase-3.md) · D3 = (a) Next.js rewrite → first-party cookie
**Branch:** `phase-3-auth-favorites`
**Review range:** `1fc0898..phase-3-auth-favorites` (ใช้ `git diff 1fc0898..phase-3-auth-favorites`)
**Acceptance (ทดสอบใน Chrome 2026-10-27):** refresh แล้วยัง login ✓ · JS มองไม่เห็น `access_token` ✓ · 375 / 768 / 1440px ไม่มี horizontal scroll และไม่มี console error ✓ · ปิด API แล้วขึ้น error state ไม่ crash ✓ (เจอบั๊กข้อความ "Internal Server Error" ผ่าน proxy → แก้ใน `e0ef1ba`)

**Backend**
- [x] 3.1 `User` schema — `email` (unique, lowercase), `passwordHash`, `displayName`, `role` (`user` / `owner` / `admin`), timestamps · ห้ามส่ง `passwordHash` ออกใน response
- [x] 3.2 `POST /api/auth/register` — DTO validation (email, password ≥ 8), hash ด้วย bcrypt, email ซ้ำ → 409
- [x] 3.3 `POST /api/auth/login` — ถูกต้อง → set cookie `access_token` (httpOnly, `sameSite: lax`, `secure` เมื่อ production, อายุ 7 วัน) · ผิด → 401 ข้อความกลาง ๆ ไม่บอกว่า email หรือ password ผิด
- [x] 3.4 `POST /api/auth/logout` (ลบ cookie) · `GET /api/auth/me`
- [x] 3.5 `JwtAuthGuard` อ่าน token จาก cookie (`cookie-parser`), `JWT_SECRET` จาก env
- [x] 3.6 Rate limit `/auth/login` และ `/auth/register` ด้วย `@nestjs/throttler`
- [x] 3.7 `Favorite` schema — unique `(userId, cafeId)` · `GET /api/me/favorites` · `PUT /api/me/favorites/:slug` · `DELETE /api/me/favorites/:slug` (กดซ้ำไม่ error)
- [x] 3.8 e2e: register → login → me → logout, รหัสผิด, ไม่มี cookie → 401, favorites ซ้ำ/ลบซ้ำ

**Frontend**
- [x] 3.9 หน้า `/login`, `/register` (ดีไซน์ตาม art direction ใน PRD)
- [x] 3.10 Auth state จาก `GET /auth/me`, fetch ทุกตัวใช้ `credentials: 'include'`
- [x] 3.11 ปุ่ม ❤️ บน list + detail (ถ้ายังไม่ login → พาไปหน้า login), หน้า `/me/favorites`
- [x] 3.12 Header แสดงสถานะ login / ปุ่ม logout

**Gate:** Phase 2 gate + e2e auth ผ่าน
**Acceptance:** refresh หน้าแล้วยัง login อยู่ · JavaScript ในหน้าเว็บอ่าน token ไม่ได้ (`document.cookie` ไม่มี `access_token`)

---

### Phase 3b — รีเช็ก Phase 3 (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-3b.md](reviews/phase-3b.md)
**Branch:** `phase-3b-recheck-fixes`
**Review range:** `2eba272..phase-3b-recheck-fixes` (ใช้ `git diff 2eba272..phase-3b-recheck-fixes`)

บั๊กที่เจอจากการทดสอบซ้ำใน Chrome (ยืนยันก่อนแก้ และทดสอบซ้ำหลังแก้ทุกข้อ):
- [x] 3b.1 **Open redirect** — `/login?next=/%5Cexample.com` พาผู้ใช้ที่ login แล้วไป `https://example.com` → `safeNextPath` parse เป็น URL และต้องอยู่ใน origin เดียวกัน
- [x] 3b.2 กด ❤️ รัว ๆ → state ซ้ำ (หน้า Saved แสดงร้านเดียว 5 ครั้ง) และ PUT/DELETE แซงกันได้ → ล็อกต่อร้านระหว่างที่ request ยังไม่จบ + dedupe
- [x] 3b.3 Session หมด/ถูก logout จากที่อื่น แล้วกด ❤️ → ค้างที่ "try again" → 401 จบ session ฝั่ง UI และพาไป `/login?next=`
- [x] 3b.5 (review 3b #1) `next=/.//example.com` ยุบเป็น `//example.com` → ผลลัพธ์ที่ขึ้นต้นด้วย `//` → `/cafes`
- [x] 3b.4 Log out ตอน API ล่ม → uncaught exception, หน้าจอไม่เปลี่ยน → แสดง "Log out failed · retry"

ทดสอบซ้ำแล้วผ่าน: flow ปกติ (login / ❤️ / Saved / logout), ข้อความ 429, ไม่มี console error

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 3c — Rate limit ต่อผู้ใช้หลัง /api proxy (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-3c.md](reviews/phase-3c.md)
**Branch:** `phase-3c-trust-proxy`
**Review range:** `8e2f647..phase-3c-trust-proxy` (ใช้ `git diff 8e2f647..phase-3c-trust-proxy`)

ปัญหา: ทุก request จาก browser มาทาง Next rewrite → API เห็น IP เดียว → login ผิด 10 ครั้งล็อกทุกคน 1 นาที
ข้อค้นพบ: เปิดแค่ `trust proxy` ไม่ได้ — ทดสอบแล้ว `next start` ส่ง `X-Forwarded-For` ที่ client ใส่มาต่อไปตรง ๆ (ไม่เติม IP จริง) → ปลอม IP ได้ทุก request

- [x] 3c.1 API: `ClientIpThrottlerGuard` เชื่อ `x-client-ip` เฉพาะเมื่อ `x-proxy-secret` ตรงกับ `PROXY_SECRET` (timing-safe) และเป็น IP ที่ถูกต้อง ไม่งั้นใช้ `req.ip` · `TRUST_PROXY` → Express `trust proxy` (ปิดเป็นค่าเริ่มต้น) · e2e 2 เคส
- [x] 3c.2 Web: `proxy.ts` (Next 16) บน `/api/:path*` — ลบ `x-client-ip`/`x-proxy-secret` ที่ client ส่งมาเสมอ, ใส่ IP จาก `x-real-ip`/`x-forwarded-for` + secret เมื่อมี `PROXY_SECRET`
- [x] 3c.3 เอกสาร env (`server/README.md`, `.env.example` ทั้งสองฝั่ง): local เว้นว่าง · production ตั้ง `PROXY_SECRET` ค่าเดียวกันทั้งสองฝั่ง + `TRUST_PROXY=1`

ทดสอบจริงผ่าน web proxy: visitor A ผิด 10 ครั้ง → 429 แต่ visitor B ยัง 401 · ยิงตรง API ปลอม `x-client-ip` ไม่มี secret → ถูกนับรวม (429 ครั้งที่ 11) · client ปลอม header ผ่าน proxy → ถูกลบ · login/me/favorites/logout ปกติทั้งโหมดมีและไม่มี secret

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 4 — Reviews
**Status:** `approved` — [reviews/phase-4.md](reviews/phase-4.md)
**Branch:** `phase-4-reviews`
**Review range:** `c93f9b0..phase-4-reviews` (ใช้ `git diff c93f9b0..phase-4-reviews`)
**ทดสอบใน Chrome 2026-10-27:** เขียน (ไม่เลือกดาว → เตือน) / แก้ (ล้าง "what you had", ป้าย edited) / ลบ (ยืนยัน 2 ขั้น) · ผู้ใช้อื่นไม่เห็นปุ่มแก้/ลบ และ API ตอบ 403 · ค่าเฉลี่ย 3.5 จาก 2 รีวิว · Show more 10 → 12 ไม่ซ้ำ · 375/768px ไม่มี horizontal scroll · API ล่ม → error + Try again ใช้ได้ · session หมดตอนโพสต์ → ไป login · ไม่มี console error

- [x] 4.1 `Review` schema — `userId`, `cafeId`, `rating` (1–5), `text` (10–1000 ตัวอักษร), `drinkOrdered?`, timestamps · unique `(userId, cafeId)` = 1 รีวิวต่อคนต่อร้าน
- [x] 4.2 `GET /api/cafes/:slug/reviews` (pagination, ใหม่สุดก่อน) + `GET /api/cafes/:slug/reviews/mine` สำหรับฟอร์มของผู้ใช้
- [x] 4.3 `POST` (ต้อง login), `PATCH` / `DELETE` เฉพาะเจ้าของรีวิว (คนอื่น → 403)
- [x] 4.4 เพิ่ม `communityRating`, `communityReviewCount` ใน cafe — คำนวณใหม่ทุกครั้งที่รีวิวเปลี่ยน (แยกจาก `rating` ของ Google)
- [x] 4.5 Frontend: รายการรีวิว + ฟอร์มเขียน/แก้/ลบ ในหน้าร้าน
- [x] 4.6 e2e: สร้าง / แก้ / ลบ / แก้ของคนอื่น / รีวิวซ้ำ / ค่า community rating ถูกต้อง

**Gate:** Phase 3 gate · **Acceptance:** seed ใหม่แล้ว `communityRating` ไม่หาย

---

### Phase 4b — ตรวจความปลอดภัย + บั๊กทั้งระบบ (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-4b.md](reviews/phase-4b.md)
**Branch:** `phase-4b-security-recheck`
**Review range:** `58a26b7..phase-4b-security-recheck` (ใช้ `git diff 58a26b7..phase-4b-security-recheck`)

ตรวจแล้วไม่พบปัญหา: ไม่มี secret/`.env` ใน git history · ไม่มี `dangerouslySetInnerHTML` (รีวิวที่มี `<script>` แสดงเป็นข้อความ) · NoSQL injection ทาง body/query/param → 400/404 · body 2MB → 413 · JWT `alg: none` → 401 · CORS ตอบเฉพาะ origin ของเว็บ · `page` ใหญ่มาก → 200 ว่าง · open redirect ทุกรูปแบบเดิมยังปิดอยู่บน Next ใหม่

- [x] 4b.1 Dependencies: `next` 16.2.10 → 16.4.3 (critical: Proxy bypass, DoS) + postcss/sharp/nanoid ฯลฯ · `multer` ≥ 2.5 ผ่าน `overrides` → web audit 0
- [x] 4b.2 **รหัสผ่านเกิน 72 bytes** — bcrypt ตัดที่ 72 bytes แต่ DTO นับเป็นตัวอักษร → รหัสไทย 30 ตัว (90 bytes) สมัครได้ แล้ว login ด้วยรหัสที่ 6 ตัวท้ายต่างกันได้ 200 → ตรวจเป็น bytes ทั้ง register/login + e2e
- [x] 4b.3 **Token ของบัญชีที่ถูกลบ** ยังเพิ่ม favorite (204) และโพสต์รีวิว (201) ได้จนหมดอายุ → `JwtAuthGuard` เช็กว่าผู้ใช้ยังอยู่ + e2e
- [x] 4b.5 (review 4b #1) `?page=1e20` + `lat`/`lng` → 500 → `page` ≤ 10,000
- [x] 4b.4 Security headers บนเว็บ (X-Frame-Options/CSP frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy) · ปิด `X-Powered-By` ทั้งเว็บและ API

ทดสอบใน Chrome บน Next 16.4.3: สมัคร (รหัสไทยเกิน → ข้อความชัด) · ❤️ · เขียนรีวิว · แผนที่ · หน้า Saved · open redirect · ไม่มี console error

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 4c — ปิดความเสี่ยงที่เหลือ + กฎข้อมูลสมัครสมาชิก (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-4c.md](reviews/phase-4c.md)
**Branch:** `phase-4c-hardening`
**Review range:** `bae6305..phase-4c-hardening` (ใช้ `git diff main...HEAD`)

- [x] 4c.1 **กฎสมัครสมาชิก** (server `RegisterDto` = ตัวจริง, web `lib/validation.ts` = สำเนาไว้เตือนก่อนส่ง)
  - อีเมล: ASCII เท่านั้น, ต้องมี TLD, ห้าม IP domain / display name / จุดซ้อน-ขึ้นต้น-ลงท้าย, ≤ 254 · ตัดช่องว่าง + ตัวพิมพ์เล็ก
  - รหัสผ่าน: 8–72 ตัว เฉพาะอังกฤษ/ตัวเลข/สัญลักษณ์ (**ห้ามภาษาไทย**, เว้นวรรค, อีโมจิ) ต้องมีตัวอักษร ≥ 1 และตัวเลข ≥ 1 → ขีด 72 bytes ของ bcrypt = 72 ตัวพอดี (แทน 4b.2)
  - ชื่อ: 2–30 ตัว ตัวอักษรไทย/อังกฤษ ตัวเลข เว้นวรรคเดียว และ `. _ - '` ขึ้นต้นด้วยตัวอักษร/ตัวเลข · ห้าม `<>`, อีโมจิ, zero-width
  - ฟอร์มสมัคร: คำแนะนำใต้ช่อง, error รายช่อง (`aria-invalid`), focus ช่องแรกที่ผิด, 400 แสดงข้อความจาก server
- [x] 4c.2 **Logout เพิกถอน JWT จริง** — `User.tokenVersion` ใส่ใน token เป็น `ver`; guard เทียบทุกคำขอ; logout เพิ่มเลข → cookie ที่ถูกคัดลอกไว้ใช้ไม่ได้ทันที (ออกจากทุกอุปกรณ์)
- [x] 4c.3 **Rate limit การเขียนต่อผู้ใช้** — รีวิว POST/PATCH/DELETE และ favorites PUT/DELETE 30 ครั้ง/นาที/route นับตามบัญชี (`UserThrottlerGuard`)
- [x] 4c.4 **Swagger** `/api/docs` ปิดเมื่อ `NODE_ENV=production` (เปิดได้ด้วย `SWAGGER=true`)
- [x] 4c.5 **js-yaml** ≥ 5.5 ใต้ `@nestjs/swagger` ผ่าน `overrides` (Swagger 12 ต้องใช้ Nest 12) → server audit 0
- [x] 4c.6 **CSP เต็ม** แบบไม่ใช้ nonce (nonce บังคับทุกหน้าเป็น dynamic → เสีย ISR): `default-src 'self'`, OSM เป็น frame เดียวที่อนุญาต, `object-src 'none'`, `base-uri`/`form-action 'self'`
- [x] 4c.7 **ข้อมูลส่วนบุคคลในไฟล์ scrape** — ลบชื่อ/รูปโปรไฟล์/ลิงก์ผู้รีวิว/รูปรีวิว/review id ออกจาก `raw-full173.json`, `raw-top60.json` (build script ได้ผลเท่าเดิม) + คำตอบของร้าน (`reply_*` เรียกชื่อผู้รีวิว) · **เขียน git history ใหม่ทุก branch แล้ว** (owner สั่ง 2026-10-27, `git filter-repo` + force push) — ไม่มี commit ไหนเหลือชื่อ/รูปผู้รีวิว

ทดสอบใน Chrome: ฟอร์มสมัครที่กรอกผิดแสดง error ครบ 3 ช่อง · สมัครชื่อไทยแล้วถูกจัดรูปแบบ · 400 จาก server แสดงข้อความตรง · หน้าร้าน + แผนที่ OSM ไม่มี CSP violation · ❤️ → logout → `/me` 401 · ลบผู้ใช้ QA ออกจาก Atlas แล้ว

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 5 — AI (Gemini)
**Status:** `approved` — [reviews/phase-5.md](reviews/phase-5.md)
**Branch:** `phase-5-ai`
**Review range:** `main..phase-5-ai` (ใช้ `git diff main...HEAD`)

- [x] 5.1 `AiModule` + `GeminiService` ใช้ SDK `@google/genai` · `GEMINI_API_KEY`, `GEMINI_MODEL` อยู่ใน env (ไม่ hardcode ชื่อ model) · key อยู่ฝั่ง server เท่านั้น
- [x] 5.2 `POST /api/ai/find` `{ query, lat?, lng? }` (รองรับภาษาไทย/อังกฤษ)
  1. Gemini แปลง query → filter ด้วย structured output (schema เดียวกับ `QueryCafesDto`)
  2. validate filter ด้วย class-validator อีกรอบ (ห้ามเชื่อ output ของ AI ตรง ๆ)
  3. เรียก `CafesService.findAll` เอาไม่เกิน 5 ร้าน
  4. Gemini เขียนเหตุผล 1–2 ประโยคต่อร้าน **อ้างอิงเฉพาะข้อมูลร้านที่ส่งให้** (กัน AI แต่งข้อมูล)
- [x] 5.3 Timeout + error handling — Gemini ล่ม → 503 ข้อความชัดเจน
- [x] 5.4 Rate limit `/ai/*` ต่อ IP
- [x] 5.5 Script `server/scripts/summarize-reviews.ts` — สรุป review text จาก `web/scripts/scrape-cafes/raw-full173.json` → `aiSummary { pros[], cons[] }` เก็บลง DB (รันครั้งเดียว ไม่เรียก AI ทุกครั้งที่เปิดหน้า)
- [x] 5.6 Frontend: ช่อง AI Finder (หน้า `/cafes` หรือ hero) + แสดงเหตุผล · แสดง `aiSummary` ในหน้าร้าน
- [x] 5.7 Tests: mock `GeminiService` — ทดสอบ filter ที่ invalid ถูกตัดทิ้ง, Gemini error → 503

- [x] 5.8 ปรับจูนกับ Gemini จริง
  - model `gemini-3.1-flash-lite-preview` + `GEMINI_THINKING_LEVEL=minimal` ตอบ ~2–7 วินาที (`gemini-flash-latest` ไม่ตอบภายใน 40 วินาที/ติด 503 high demand)
  - Gemini ตอบ 503 → ลองใหม่ 1 ครั้งภายใน deadline เดิม
  - ไม่มีร้านตรงทุก filter → ผ่อน filter ทีละตัว (tag → area → drink → ราคา → สัตว์เลี้ยง → ที่จอดรถ → ระยะ) และส่ง `relaxed` ให้หน้าเว็บบอกว่าข้ามอะไร
  - `ai:summarize --rpm` (ค่าเริ่มต้น 10) — free tier ได้ 15 requests/นาที/model ใช้ร่วมกับ AI Finder
- สรุปรีวิวครบ **173/173 ร้าน** ใน Atlas (`aiSummary.model = gemini-3.1-flash-lite-preview`)

**Acceptance (Gemini จริง, 2026-10-27):**

| คำค้น | filter ที่ได้ | ผ่อน | ผลลัพธ์ |
|---|---|---|---|
| ร้านกาแฟเงียบๆ มีที่จอดรถ ใกล้นิมมาน | Coffee, parking | Quiet, Nimman | 5 ร้านมีที่จอด ย่านช้างเผือกติดนิมมาน · เหตุผลบอกตรง ๆ ว่าใกล้นิมมาน/บางร้านไม่เงียบ |
| อยากได้มัทฉะรสเข้มข้น นั่งทำงานได้ | Tea | Work-friendly | ร้านมัทฉะ (Minna, hokkori…) · เหตุผลบอกว่าร้านเล็ก อาจไม่เหมาะนั่งทำงานนาน |
| คาเฟ่ที่พาหมาไปได้ ราคาไม่แพง | petFriendly, Budget-friendly | — | ร้าน pet-friendly 70–80฿ |
| quiet specialty coffee with pour over in the old city | Coffee, Quiet, Old City | — | ร้าน Old City เงียบ · เหตุผลบอกว่าไม่มีข้อมูล pour-over (ไม่แต่งเติม) |
| cheap cafe with good desserts open early | Budget-friendly, sort price | — | ร้านราคาถูกเรียงตามราคา |

ทดสอบใน Chrome: AI Finder (ไทย) แสดงผล + เหตุผล + ข้อความ "skip: Quiet, Nimman" · หน้าร้านแสดง "What reviewers say" · ไม่มี console error

**Billing:** owner เปิด billing แล้ว (2026-10-27) — ยิงพร้อมกัน 20 requests ผ่านหมด ไม่ติดเพดาน 15/นาที ของ free tier แล้ว · จำกัดต่อผู้ใช้ 10 การค้นหา/นาที เหมือนเดิม

**Gate:** Phase 4 gate · **Acceptance:** ลอง 5 ประโยคตัวอย่าง (ไทย 3 / อังกฤษ 2) แล้วผลลัพธ์สมเหตุสมผล จดผลไว้ใน review request

---

### Phase 6 — Deploy + QA
**Status:** `approved` — [reviews/phase-6.md](reviews/phase-6.md) · D3 = (a) rewrite · D4 = Vercel + Render
**Production:** web https://brewmap-cafe.vercel.app · API https://brewmap-api.onrender.com/api/health
**Branch:** `phase-6-deploy`
**Review range:** `main..phase-6-deploy` (ใช้ `git diff main...HEAD`)

- [x] 6.1 Deploy server (Render) — เตรียม `render.yaml` แล้ว (Node 22, `npm ci --include=dev && npm run build`, health `/api/health`, `NODE_ENV=production`, `TRUST_PROXY=1`, `JWT_SECRET` ให้ Render สุ่ม, secret เป็น `sync: false`) · ทดสอบ build + รันแบบ production ในเครื่องแล้ว: health 200, `/api/docs` 404, cookie `HttpOnly; Secure; SameSite=Lax`, ไม่มี `X-Powered-By` · Render build ครั้งแรกล้ม: `npm ci` ของ npm 10 (มากับ Node 22) อ่าน lockfile ที่สร้างด้วย npm 11 ไม่ได้ (`Missing: webpack@5.112.2`) → สร้าง `server/package-lock.json` ใหม่ด้วย npm 10, ทดสอบ `npm ci` ผ่านทั้ง npm 10/11 (web lockfile ผ่าน npm 10 อยู่แล้ว) · owner deploy ผ่าน Blueprint แล้ว: health ok + database connected, 173 ร้าน + aiSummary, `/api/docs` 404, ไม่มี `X-Powered-By`
- [x] 6.2 Atlas Network Access `0.0.0.0/0` (Render free ไม่มี IP คงที่) · owner ตั้งแล้ว
- [x] 6.3 Deploy web (Vercel) — Root Directory `web`, env `API_URL` + `PROXY_SECRET` (Production + Preview)
  - ครั้งแรก `API_URL` ไม่มี `/api` → `/api/*` และหน้าร้าน 404 (`Cannot GET /auth/session`) → owner แก้ env + redeploy · README เตือนเรื่องนี้แล้ว
  - ตรวจบน production: ทุกหน้า 200, หน้าร้านมี "What reviewers say", `/api/cafes` ผ่าน proxy = 173, AI Finder (ไทย) ตอบ ~3 วินาที, CORS = โดเมน Vercel, headers ครบ + HSTS จาก Vercel
  - QA บน production (ก่อน merge, ยังเป็นโค้ด main): ไม่มี overflow / ปุ่มไร้ชื่อ / ปัญหา keyboard · contrast + 401 ใน console = ชุดที่ branch นี้แก้แล้ว → ตรวจซ้ำหลัง merge
- [x] 6.4 Seed production + review summary — Atlas มีครบแล้ว (173 ร้าน, `aiSummary` 173/173) ใช้ cluster เดิม
- [x] 6.5 QA (headless Chrome ผ่าน CDP, 7 หน้า × 375/768/1440): ไม่มี overflow แนวนอน · ไม่มีปุ่ม/ลิงก์/รูปที่ไม่มีชื่อ · Tab ผ่านทุกจุดและเห็น focus ring ทุกจุด · แก้แล้ว:
  - contrast WCAG AA: `muted` #7a7267 → #676057, `rust` #b8451f → #a73e1c, เพิ่ม `rust-bright` #d97a52 สำหรับข้อความบนพื้น ink (เดิม 2.7–4.1:1 → ≥ 4.6:1)
  - console error: ผู้ใช้ที่ยังไม่ login ได้ 401 จาก `/auth/me` → เพิ่ม `GET /api/auth/session` (200 `{ user | null }`) ให้เว็บใช้แทน
- [x] 6.6 Root README: แผนภาพ architecture (mermaid), ขั้นตอน deploy, ลิงก์ production

---

### Phase 7 — เนื้อหาตามจริง + CSS กลาง + ร้านใกล้ผู้ใช้ (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-7.md](reviews/phase-7.md)
**Branch:** `phase-7-real-content`
**Review range:** `main..phase-7-real-content` (ใช้ `git diff main...HEAD`)

- [x] 7.1 **CSS กลาง** ใน `web/app/globals.css` (`@utility` ของ Tailwind v4): `focus-ring`, `page-container`, `eyebrow`, `label-mono`, `heading-section`, `heading-page`, `nav-link`, `btn-outline` — แทนชุด class ที่ซ้ำกันทั้งเว็บ (focus ring 26 จุด, page container 22, eyebrow 12…)
- [x] 7.2 **ลบส่วน "Our view" และ "From café owner"** (testimonial คนสมมติ) ออกจากหน้าแรก + ลบไฟล์ component
- [x] 7.3 **การ์ด hero ใช้ร้านจริงตามตำแหน่งผู้ใช้** (แทน "94% match / Analog Coffee" ที่แต่งขึ้น): ร้าน rating สูงสุดในรัศมี 3 กม. หรือร้านที่ใกล้ที่สุดถ้าไม่มี · แสดง specialty, atmosphere, ราคา, ระยะทาง, rating จริง · กดเข้าหน้าร้านได้
- [x] 7.4 **ขอสิทธิ์ตำแหน่งตอนเข้าเว็บ** ทุกหน้า (ครั้งเดียวต่อการเปิด) ผ่าน `LocationOnEntry` ใน root layout · ปฏิเสธได้ → ใช้ประตูท่าแพ + ปุ่ม "Use my location"
- [x] 7.5 **Feature กดดูได้จริง** ทั้ง 6 ข้อ → `/cafes#ai-finder`, `/cafes#filters`, ตัวอย่างหน้าร้าน `#reviewers-say` / `#reviews`, `/me/favorites`, หน้าร้าน (มี `scroll-mt` กัน header บัง)
- [x] 7.6 **ลบสิ่งที่ระบบไม่มี:** Interactive Coffee Map, Top Lists, Personalized Recommendations, ขั้น "Learn", สัญญาณ Flavor/Brewing method, ตัวเลข "2 min / 6 signals", อีเมล `hello@brewmap.co`, ลิงก์โซเชียลที่ชี้หน้าแรกของ Instagram/LINE/X, ประโยค "café data is mocked" · เขียนใหม่ตามจริง: hero stats (173 ร้าน, TH·EN, 173 สรุป), สิ่งที่ match ได้, ขั้นตอน Describe → Filter → Match → Save & review, About (stack จริง), footer (ลิงก์ภายในเว็บ), meta description
- [x] 7.7 `Reveal as="li"` — เดิม `<ul>` มี `<div>` เป็นลูก (HTML ไม่ถูกต้อง)

ทดสอบ: headless Chrome จำลองตำแหน่ง — นิมมาน → "Top rated within 3 km" 2.1 km · แม่ริม → "Nearest café" 6.4 km · ปฏิเสธ → จากประตูท่าแพ + ปุ่มขอใหม่ · ลิงก์ feature ครบ 6 ข้อเจอหน้าและ anchor · QA 7 หน้า × 375/768/1440 = 0 ปัญหา (overflow, ชื่อปุ่ม, contrast, console, focus ring)

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 8 — ยุบ feature + เปิดหน้าที่บนสุด + รีวิว Google จริง (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-8.md](reviews/phase-8.md)
**Branch:** `phase-8-google-reviews`
**Review range:** `main..phase-8-google-reviews` (ใช้ `git diff main...HEAD`)

- [x] 8.1 **ยุบ feature เหลือ 4 ข้อ:** "AI Finder, Filters & Sort" (รวม AI Finder + Filters) · "Reviews & AI Summary" (รวม AI summary + community reviews + รีวิว Google) · Saved Cafés · Café Pages
- [x] 8.2 **กดแล้วเปิดหน้าที่บนสุด:** ทดสอบบน production พบว่าลิงก์ `#ai-finder`, `#filters`, `#reviewers-say`, `#reviews` พาไปกลางหน้า (y = 365–867) → ลิงก์ feature ทุกข้อชี้หน้าเฉย ๆ ไม่มี `#` · เพิ่ม `data-scroll-behavior="smooth"` ที่ `<html>` ตามเอกสาร Next 16 (smooth scroll ใช้แค่ในหน้า ไม่ใช่ตอนเปลี่ยนหน้า) · ทดสอบคลิกจากกลางหน้า 15 ลิงก์ (feature, การ์ด hero, footer, รายการร้าน, ปุ่มกลับ) → y = 0 ทุกลิงก์
- [x] 8.3 **รีวิว Google จริงในหน้าร้าน:**
  - collection `google_reviews` (ดาว, ข้อความต้นฉบับ, คำแปลอังกฤษของ Google เฉพาะรีวิวที่ไม่ใช่ภาษาอังกฤษ, ภาษา, วันที่) — **ไม่มีชื่อ/รูป/ลิงก์ผู้รีวิว และไม่มีข้อความที่ร้านตอบกลับ**
  - `npm run import:google-reviews` (`--dry-run`) อ่านจากไฟล์ scrape → แทนที่รีวิวของแต่ละร้าน รันซ้ำได้ · นำเข้า Atlas แล้ว 861 รีวิว ครบ 173 ร้าน (ข้าม 4 รีวิวที่ไม่มีข้อความ) · ไทย 28 รีวิวมีคำแปล
  - `GET /api/cafes/:slug/google-reviews` → `{ items, total }` ใหม่สุดก่อน, ร้านไม่มี → 404
  - หน้าร้าน: ส่วน "Google reviews" (rating + จำนวนรีวิวบน Google, รีวิวพร้อมดาว/เดือนปี, รีวิวยาวพับได้ด้วย `<details>`, คำแปลกดดูได้) · โหลดไม่ได้ → หน้ายังแสดงตามปกติ
  - `scripts/raw-scrape.ts` ใช้ร่วมกับ `ai:summarize` · `Stars` แยกเป็น component กลาง
  - tests: unit `toGoogleReview` (เก็บแค่ฟิลด์ที่อนุญาต, คำแปล, ข้ามรีวิวที่แสดงไม่ได้) · e2e (นำเข้าซ้ำไม่ซ้ำซ้อน, ฟิลด์ตรง, ไม่มี reply/ชื่อ, เรียงใหม่สุดก่อน, รีวิวไทยมีคำแปล, 404)

QA 7 หน้า × 375/768/1440 = 0 ปัญหา

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 9 — ค้นหาร้านด้วยชื่อ (owner สั่ง 2026-10-27)
**Status:** `approved` — [reviews/phase-9.md](reviews/phase-9.md)
**Branch:** `phase-9-name-search`
**Review range:** `main..phase-9-name-search` (ใช้ `git diff main...HEAD`)

ที่มา: owner หา "% Arabica" ไม่เจอ ทั้งที่ร้านมีอยู่ (`arabica-chiang-mai-one-nimman`) เพราะเว็บไม่มีค้นหาด้วยชื่อ และเรียงตาม rating ร้านนี้ (4.4) อยู่ลึก · ส่วน Starbucks Reserve ไม่มีในข้อมูลที่ scrape มาเลย (ต้อง scrape เพิ่ม — แยกเรื่อง)

- [x] 9.1 **API:** `GET /api/cafes?q=` — ทุกคำต้องอยู่ในชื่อร้าน ไม่สนตัวพิมพ์/เครื่องหมาย ("%arabica", "nimman arabica" เจอ) · รองรับภาษาไทย · escape เป็นข้อความธรรมดา (ไม่ใช่ regex) · ≤ 60 ตัว · ใช้ร่วมกับ filter และการค้นตามระยะทางได้
- [x] 9.2 **หน้า `/cafes`:** ช่อง "Search by café name" เหนือ filter ค้นขณะพิมพ์ (หน่วง 300 ms → 1 request ต่อคำ) · บอกจำนวน "N cafés named …" · ไม่เจอ → "No café named … on BrewMap yet"
- [x] 9.3 **AI Finder เข้าใจชื่อร้าน:** filter `q` เมื่อคำขอระบุชื่อร้าน/เชน · ร้านที่ไม่มีในระบบ → ทิ้งชื่อก่อนแต่เก็บเงื่อนไขอื่น ("Starbucks Reserve แถวนิมมาน" → ร้านในนิมมาน + "skip: Starbucks Reserve") · ร้านที่มีแต่ไม่ตรงเงื่อนไข → ผ่อนเงื่อนไขอื่นก่อน ชื่อเป็นอย่างสุดท้าย · chip แสดงชื่อ
- [x] 9.4 tests: e2e ค้นชื่อ (ตัวพิมพ์/เครื่องหมาย, ทุกคำ, ไม่เจอ, ร่วม filter/geo, regex/operator injection, ยาวเกิน) · unit + e2e AI (เก็บ/ทิ้ง q, ลำดับการผ่อน)

ทดสอบกับ Gemini จริง: "อยากไป % Arabica" → % Arabica · "Starbucks Reserve แถวนิมมาน" → 5 ร้านในนิมมาน, relaxed `q` · "one nimman arabica coffee" → % Arabica · เบราว์เซอร์: พิมพ์ "arabica" → 1 ร้าน, "starbucks" → ข้อความไม่พบ · QA 7 หน้า × 3 ขนาด = 0 ปัญหา

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 10 — หน้าค้นหา: quick wins (owner สั่ง 2026-10-28)
**Status:** `approved` — [reviews/phase-10.md](reviews/phase-10.md)
**Branch:** `phase-10-finder-quick-wins`
**Review range:** `main..phase-10-finder-quick-wins` (ใช้ `git diff main...HEAD`)

ที่มา: owner ขอปรับ UI/UX หน้า `/cafes` เป็น 4 เฟส (quick wins → ช่องค้นหาเดียว + chips → การ์ด/header → แผนที่) แล้วค่อยทำ i18n TH/EN เป็นเฟสแยก · owner ตอบแล้ว: เพิ่ม `sort=recommended` ใน API ได้ · เพิ่มเวลาเปิด-ปิดรายวันใน schema ได้ (เฟส 12) · ไม่ใส่รูปร้าน (รูปมีแค่ลิงก์ของ Google) · ทำระบบ i18n

- [x] 10.1 **API `sort=recommended`:** Bayesian average `(n·rating + m·mean) / (n + m)` · `m = 250` (ราว median ของจำนวนรีวิว = 246) · `mean` = rating เฉลี่ยทุกร้าน · ใช้ได้ทั้งมี/ไม่มีพิกัด · ไม่แตะ schema, ไม่ส่ง `score` ออกไป · ค่า default ของ API เดิมไม่เปลี่ยน · `findAll` ใช้ aggregation pipeline เดียว (`$geoNear` หรือ `$match`) แทน find + countDocuments
- [x] 10.2 **ตัวกรองมีผลทันที:** ตัดปุ่ม Confirm / "Find matching cafés" · หัวกล่องมีปุ่ม "Clear N filters" เมื่อมีตัวกรอง · จำนวนร้านใหญ่ขึ้น "173 cafés" อัปเดตตามตัวกรอง (aria-live)
- [x] 10.3 **เรียงลำดับ:** dropdown Recommended (ค่าเริ่มต้น) / Nearest / Cheapest / Top rated
- [x] 10.4 **การ์ด:** ลบเลขลำดับ (010, 062…) · ราคาสีปกติ (ink) ไม่ใช่สีส้ม · ทั้งการ์ดเป็นลิงก์ มี hover ทั้งแถว · ♡ ยังกดแยก
- [x] 10.5 tests: e2e `sort=recommended` (5.0 รีวิวน้อยอยู่ใต้ 4.9 รีวิว 2,000+, ใช้กับ geo + radius ได้, ไม่มี `score`)

ผลบน Atlas: อันดับต้น Sweet Home 5.0/1176 · Minna matcha 5.0/294 · TWENTY MAR 4.9/2379 · WHYs 4.9/2028 … Sensory 5.0/238 อยู่อันดับ 7 · เบราว์เซอร์: เลือก "Under 100฿" + Cheapest → 63 ร้านทันที, ~40฿ ก่อน · QA 7 หน้า × 3 ขนาด = 0 ปัญหา

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 11 — หน้าค้นหา: ช่องค้นหาเดียว + filter chips (owner สั่ง 2026-10-28)
**Status:** `approved` — [reviews/phase-11.md](reviews/phase-11.md)
**Branch:** `phase-11-unified-search` (ต่อจาก `phase-10-finder-quick-wins` ซึ่งยังไม่ merge)
**Review range:** `phase-10-finder-quick-wins..phase-11-unified-search`

- [x] 11.1 **ช่องค้นหาเดียว:** รวมช่อง AI กับช่องค้นชื่อร้าน (`#cafe-search`) · พิมพ์ = ค้นชื่อทันที (หน่วง 300 ms) · Enter = ถ้ามีร้านชื่อนี้ (`GET /api/cafes?q=…&limit=1` > 0) แสดงตามชื่อ ไม่งั้นส่ง AI · ปุ่ม "Ask AI" ส่ง AI เสมอ · ไม่เจอชื่อ → บอกให้กด Enter / Ask AI · ตัวอย่างคำถาม 3 ข้อยังอยู่ · ลบ `ai-finder.tsx` และ `LocationOrigin`
- [x] 11.2 **AI → chips:** filter ที่ AI ตีความลง state เดียวกับ chips (`lib/finder-filters.ts`) ลบทีละอันได้ · tag / ย่าน / ชื่อร้านที่ AI ตั้งก็เป็น chip · บอกสิ่งที่ AI ข้าม (relaxed) · เหตุผลของ AI แสดงใต้ร้านที่ AI เลือก · เรียงตาม sort ของ AI หรือ Nearest (ตรงกับที่ AI เลือกมา)
- [x] 11.3 **Filter แนวนอน:** Price ▾ · Distance ▾ · Parking · Pet friendly · Drink ▾ + "Clear all" · ราคา/ระยะที่ AI ตั้งนอก preset (เช่น "Up to 150฿") เลือกค้างได้ · มือถือเลื่อนแนวนอน · ใช้ `<select>` จริง (คีย์บอร์ด/มือถือใช้ได้) · ปรับ filter ติดกันหลายอันไม่หาย (functional update)
- [x] 11.4 **แถบเหนือรายการ:** "N cafés · Distances from 📍 ▾" (Your location / Nimman / Old City) + Sort · ไม่อนุญาตตำแหน่ง → ข้อความบอกชัด + ใช้ Old City (Tha Phae Gate) · เลือก "Your location" → ขอสิทธิ์ · AI ใช้จุดอ้างอิงเดียวกัน
- [ ] "เปิดอยู่ตอนนี้" — รอเฟส 12 (เพิ่มเวลาเปิด-ปิดรายวัน)

เบราว์เซอร์: "arabica" + Enter → 1 ร้าน ไม่เรียก AI · "ร้านเงียบ นั่งทำงานได้ มีที่จอดรถ ไม่เกิน 150 บาท" + Enter → chips Up to 150฿ / Parking / Work-friendly → TORA BAKE พร้อมเหตุผลภาษาไทย · Parking + Under 100฿ → 1 ร้าน (ตรงกับ API) · QA 7 หน้า × 3 ขนาด = 0 ปัญหา

**Gate:** `npm run gate:web` (ไม่แตะ server)

---

### Phase 12 — หน้าค้นหา: การ์ดร้าน, header, เวลาเปิด-ปิดรายวัน (owner สั่ง 2026-10-28)
**Status:** `approved` — [reviews/phase-12.md](reviews/phase-12.md)
**Branch:** `phase-12-cards-header` (ต่อจาก `phase-11-unified-search` ซึ่งยังไม่ merge)
**Review range:** `phase-11-unified-search..phase-12-cards-header`

owner อนุญาตแล้ว: เพิ่ม field เวลาเปิด-ปิดรายวันใน schema + import + API · ไม่ใส่รูปร้าน (ข้อมูลมีแค่ลิงก์รูปของ Google)

- [x] 12.1 **เวลาเปิด-ปิดรายวัน (server):** `cafes.openingHours: { day 0–6, open, close }[]` (นาทีหลังเที่ยงคืน, ปิดหลังเที่ยงคืน → `close` > 1440) · `src/cafes/opening-hours.ts` อ่าน "8 AM–6 PM", "8:30 AM–5:30 PM", "12–10 PM", "7 AM–1 AM", "Closed", "Open 24 hours", หลายช่วงต่อวัน · อ่านไม่ได้ → ไม่ใส่ (ไม่เดา) · `npm run import:opening-hours` (`--dry-run`) · Atlas: 173/173 ร้าน · `GET /api/cafes?openNow=true` (เวลาเชียงใหม่ รวมร้านที่เปิดข้ามคืนจากเมื่อวาน) · response มี `openingHours` (null ถ้าไม่รู้)
- [x] 12.2 **การ์ดร้าน (`cafe-card.tsx`):** ชื่อ → ย่าน · ระยะ · ● Open · Closes 18:00 / Closed · Opens Mon 08:00 → ★ 4.9 (2,379 reviews) · ~110฿ → เมนูเด่น → tag ≤ 3 + Parking / Pets welcome (ไอคอนพร้อมข้อความ, ไม่ซ้ำกับ tag) · tag เป็นตัวอักษรปกติ ไม่ใช่ mono ตัวใหญ่ (ink-soft บนพื้น 8.9:1) · ทั้งการ์ดคลิกได้ (stretched link + focus ring ทั้งการ์ด) ♡ แยก · grid 2 คอลัมน์บน md · ไม่มีรูป (ไม่มีข้อมูล)
- [x] 12.3 **"Open now" chip** ใน filter row · สีเขียว `--color-moss` 5.4:1
- [x] 12.4 **หน้าร้าน:** Hours แสดงสถานะเปิด/ปิดตอนนี้ + ตารางทั้งสัปดาห์ (วันนี้ตัวหนา) · ไม่มีข้อมูล → แสดงข้อความเดิม
- [x] 12.5 **Header:** เหลือ โลโก้ · ช่องค้นหา (หน้าอื่น → `/cafes?search=…` แล้วรันค้นหา/AI ครั้งเดียว ลบ param ออก) · Saved · Log in/out · ลบ Discover/Features/How it works/About + "Find your café" + เมนูมือถือ → ย้ายลิงก์ไป footer · หน้า `/cafes` ช่องค้นหาของ finder ปักใต้ header (sticky `top-16`)
- [x] 12.6 **Hero `/cafes` สั้นลง:** หัวข้อบรรทัดเดียว + คำอธิบาย (ซ่อนบนมือถือ) · มือถือ: ปุ่ม Ask AI เป็นไอคอน, ตัวอย่างคำถามเลื่อนแนวนอน → การ์ดแรกเห็นในจอแรกที่ 375×812

เบราว์เซอร์: Open now → 153 ร้าน (ตรงกับ API) ไม่มีการ์ด "Closed" · หน้า TWENTY MAR: Tuesday 08:30–18:00 วันอื่น 08:00–18:00 · ค้น "twenty mar" จาก header หน้า About → `/cafes` 1 ร้าน · QA 7 หน้า × 3 ขนาด: 0 ปัญหา (ยกเว้น "noRing" ของลิงก์การ์ด = false positive เพราะวง focus อยู่ที่ `::after` ครอบทั้งการ์ด ตรวจด้วยภาพแล้ว)

หมายเหตุ deploy: หน้าร้าน (ISR `revalidate: 3600`) อาจยังแสดงเวลาแบบเดิมได้นานสุด 1 ชม. หลัง deploy เพราะ fetch cache

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 13 — ภาษาไทย / อังกฤษ (i18n) (owner สั่ง 2026-10-28)
**Status:** `approved` — [reviews/phase-13.md](reviews/phase-13.md)
**Branch:** `phase-13-i18n`
**Review range:** `main..phase-13-i18n` (ใช้ `git diff main...HEAD`)

owner เลือก: URL แยกภาษา `/th` `/en` · ข้ามเฟสแผนที่ (Leaflet) ไปก่อน

- [x] 13.1 **Routing:** ทุกหน้าอยู่ใต้ `app/[lang]` (`generateStaticParams` en/th, `dynamicParams = false` → ภาษาอื่น 404) · `proxy.ts`: path ไม่มีภาษา (`/`, `/cafes/x`) → redirect 307 ตาม cookie `NEXT_LOCALE` → `Accept-Language` → en · เปิด `/th/…` ตั้ง cookie · `/api` เหมือนเดิม · ลิงก์เก่าไม่เสีย
- [x] 13.2 **ข้อความ:** `web/lib/i18n/en.ts` (ต้นแบบ, `Dictionary`) + `th.ts` (type บังคับ key ครบ) · `format("{n} …")`, `plural({one, other})` · server component รับ `lang` · client ใช้ `useI18n()` (`t`, `href`) · `lib/content.ts` เหลือแค่ลิงก์/ตัวเลข · validation คืน key แทนข้อความ · ข้อมูลร้านจาก API (ชื่อ จุดเด่น แท็ก ย่าน) ยังเป็นอังกฤษ · ข้อความ error จาก server (เช่นกฎรหัสผ่านตอนสมัคร) ยังเป็นอังกฤษ
- [x] 13.3 **ภาษา/รูปแบบ:** `<html lang>` ตามหน้า · `Intl` en-GB / th-TH (วันที่รีวิวเป็น พ.ศ.) · "กม." · ชื่อวันไทย · Noto Sans/Serif Thai เป็น fallback (ไม่ preload, โหลดเฉพาะหน้าที่มีอักษรไทย) · ปิด letter-spacing ของ label บนหน้าไทย
- [x] 13.4 **สลับภาษา:** ปุ่ม "ภาษาไทย" / "English" ใน header → หน้าเดียวกันอีกภาษา · `hreflang` + canonical (`metadataBase`) · title/description ต่อภาษา
- [x] 13.5 **ลิงก์ภายในทั้งเว็บ** ผ่าน `href()` / `localePath()` รวม `?next=` ตอนเข้าสู่ระบบ, header search → `/th/cafes?search=…`
- [x] ปรับ copy ให้ตรงของจริง: feature "AI Finder" (ช่องค้นหาเดียว, sort ใหม่, open now), capabilities เพิ่ม "Open now", process ขั้น 3

เบราว์เซอร์: `/` (th browser) → `/th`, (en) → `/en` · cookie en + browser th → `/en/cafes` · `/th/cafes`: `<html lang="th">`, title "หาคาเฟ่ — BrewMap", hreflang en/th · ค้น "twenty mar" จาก header `/th/about` → `/th/cafes` "1 ร้าน ชื่อ “twenty mar”" · ปุ่ม English บน `/th/cafes/twenty-mar` → `/en/cafes/twenty-mar` · สมัครแบบว่าง → error ภาษาไทย · กด ♡ ตอนไม่ได้ login → `/th/login?next=%2Fth%2Fcafes%2Ftwenty-mar` · QA 7 หน้า × 3 ขนาด × 2 ภาษา = 0 ปัญหา (ยกเว้น noRing false positive ของการ์ด)

**Gate:** `npm run gate:web` (ไม่แตะ server)

---

### Phase 14 — แปลข้อมูลร้านเป็นภาษาไทย (owner สั่ง 2026-10-28)
**Status:** `awaiting-review`
**Branch:** `phase-14-cafe-translations`
**Review range:** `main..phase-14-cafe-translations` (ใช้ `git diff main...HEAD`)

owner เลือก: เก็บในฐานข้อมูล + API · แปลด้วย Gemini script (อนุมัติการรันกับทุกร้าน)

- [x] 14.1 **Schema:** `cafes.th` = `{ specialty, flavor, atmosphere, aiSummary: {pros, cons} | null, model, generatedAt }` · ชื่อร้าน ที่อยู่ แท็ก ย่าน ไม่แปลในฐานข้อมูล (แท็ก/ย่านเป็นค่าที่ใช้กรอง)
- [x] 14.2 **API `lang=th`:** `GET /api/cafes`, `/cafes/top`, `/cafes/:slug`, `/me/favorites` · มีคำแปล → ข้อความไทย, ไม่มี → อังกฤษ · `textLang` บอกว่าได้ภาษาไหน · ไม่ส่ง `th` ออกไป · ภาษาอื่น → 400 · ค่า default (en) เดิมไม่เปลี่ยน · `src/cafes/lang.ts` ใช้ร่วมทุก DTO
- [x] 14.3 **`npm run ai:translate`** (`--limit`, `--force`, `--dry-run`, `--rpm`) · ส่งแค่ข้อความอังกฤษของร้าน · `cleanTranslation` ไม่เชื่อผลจาก model: ทุกช่องต้องมีอักษรไทย, ≤ 160 ตัว, pros/cons ต้องมีจำนวนเท่าต้นฉบับ · ไม่ผ่าน → ไม่บันทึก รันใหม่ได้
- [x] 14.4 **เว็บ:** หน้า `/th` ส่ง `lang=th` ทุกที่ที่ดึงร้าน (รายการ, hero, หน้าร้าน ISR, รายการโปรด) · แท็ก 77 ชื่อและย่าน 17 ชื่อแปลใน `th.ts` (`dataLabel`) ใช้ในการ์ด หน้าร้าน chip ของ AI และข้อความ "ข้าม …"
- [x] 14.5 tests: unit `cleanTranslation` · e2e `lang=th` (detail/list/top, fallback อังกฤษ, ไม่มี `th` ใน response, 400) · favorites `lang=th`

ผลบน Atlas: แปลครบ 173/173 ร้าน (รวมสรุปรีวิว AI) · รอบแรกผ่าน 161 · 12 ร้านไม่ผ่านเพราะ Gemini คงชื่อเมนูไว้เป็นอังกฤษ → ปรับ prompt ให้เขียนไทยทุกช่อง + ตัวอย่าง · ตรวจพบ 17 ร้านที่ผ่านแต่ยังเป็นอังกฤษเกินครึ่ง (เช่น "Hojicha latte และ specialty espresso") → เพิ่มกฎ "อักษรไทย ≥ ครึ่งหนึ่งของอักษรอังกฤษ" ลบคำแปลของ 17 ร้านแล้วแปลใหม่ · ใช้ Gemini ทั้งหมดราว 230 requests · หน้าร้านไทย: จุดเด่น/รสชาติ/บรรยากาศ/ที่คนชอบ/ควรระวัง/แท็ก/ย่าน เป็นไทย ชื่อร้านและที่อยู่คงเดิม · QA 7 หน้า × 3 ขนาด × 2 ภาษา = 0 ปัญหา · API ไม่ส่ง lang = อังกฤษเหมือนเดิม

**Gate:** `npm run gate:server` · `npm run gate:web`

---

## 4. Backlog (ยังไม่ทำ)
- Interactive map แสดงทุกร้าน (Leaflet + OSM) — เฟส 4 ของงาน UX หน้าค้นหา, owner ให้ข้ามไปก่อน (2026-10-28)
- ข้อความ error จาก server เป็นภาษาไทย
- Personalized recommendations จาก favorites + reviews
- Café owner dashboard / sponsored listing
- Re-enrich flavor จาก review text → เปิดตัวกรอง Flavor กลับมา
- อัปเกรด NestJS 11 → 12
