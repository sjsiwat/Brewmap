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
**Status:** `awaiting-review`
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
- [x] 4c.7 **ข้อมูลส่วนบุคคลในไฟล์ scrape** — ลบชื่อ/รูปโปรไฟล์/ลิงก์ผู้รีวิว/รูปรีวิว/review id ออกจาก `raw-full173.json`, `raw-top60.json` (build script ได้ผลเท่าเดิม) · commit เก่ายังมีอยู่ — การเขียน history ใหม่ต้องให้ owner อนุมัติแยก

ทดสอบใน Chrome: ฟอร์มสมัครที่กรอกผิดแสดง error ครบ 3 ช่อง · สมัครชื่อไทยแล้วถูกจัดรูปแบบ · 400 จาก server แสดงข้อความตรง · หน้าร้าน + แผนที่ OSM ไม่มี CSP violation · ❤️ → logout → `/me` 401 · ลบผู้ใช้ QA ออกจาก Atlas แล้ว

**Gate:** `npm run gate:server` · `npm run gate:web`

---

### Phase 5 — AI (Gemini)
**Status:** `todo`

- [ ] 5.1 `AiModule` + `GeminiService` ใช้ SDK `@google/genai` · `GEMINI_API_KEY`, `GEMINI_MODEL` อยู่ใน env (ไม่ hardcode ชื่อ model) · key อยู่ฝั่ง server เท่านั้น
- [ ] 5.2 `POST /api/ai/find` `{ query, lat?, lng? }` (รองรับภาษาไทย/อังกฤษ)
  1. Gemini แปลง query → filter ด้วย structured output (schema เดียวกับ `QueryCafesDto`)
  2. validate filter ด้วย class-validator อีกรอบ (ห้ามเชื่อ output ของ AI ตรง ๆ)
  3. เรียก `CafesService.findAll` เอาไม่เกิน 5 ร้าน
  4. Gemini เขียนเหตุผล 1–2 ประโยคต่อร้าน **อ้างอิงเฉพาะข้อมูลร้านที่ส่งให้** (กัน AI แต่งข้อมูล)
- [ ] 5.3 Timeout + error handling — Gemini ล่ม → 503 ข้อความชัดเจน
- [ ] 5.4 Rate limit `/ai/*` ต่อ IP
- [ ] 5.5 Script `server/scripts/summarize-reviews.ts` — สรุป review text จาก `web/scripts/scrape-cafes/raw-full173.json` → `aiSummary { pros[], cons[] }` เก็บลง DB (รันครั้งเดียว ไม่เรียก AI ทุกครั้งที่เปิดหน้า)
- [ ] 5.6 Frontend: ช่อง AI Finder (หน้า `/cafes` หรือ hero) + แสดงเหตุผล · แสดง `aiSummary` ในหน้าร้าน
- [ ] 5.7 Tests: mock `GeminiService` — ทดสอบ filter ที่ invalid ถูกตัดทิ้ง, Gemini error → 503

**Gate:** Phase 4 gate · **Acceptance:** ลอง 5 ประโยคตัวอย่าง (ไทย 3 / อังกฤษ 2) แล้วผลลัพธ์สมเหตุสมผล จดผลไว้ใน review request

---

### Phase 6 — Deploy + QA
**Status:** `todo` · D3 = (a) rewrite · D4 = Vercel + Render

- [ ] 6.1 Deploy server (Render) — env ครบ, health check path `/api/health`
- [ ] 6.2 Atlas Network Access อนุญาต IP ของ host
- [ ] 6.3 Deploy web (Vercel) — ทำ cookie ตาม D3
- [ ] 6.4 Seed production + รัน review summary
- [ ] 6.5 QA ตาม PRD: 375 / 768 / 1440px, keyboard nav, contrast, console errors, overflow
- [ ] 6.6 Root README: architecture diagram, ลิงก์ production, ลิงก์ API docs

---

## 4. Backlog (ยังไม่ทำ)
- Interactive map แสดงทุกร้าน (Leaflet + OSM)
- Personalized recommendations จาก favorites + reviews
- Café owner dashboard / sponsored listing
- Re-enrich flavor จาก review text → เปิดตัวกรอง Flavor กลับมา
- (security) เขียน git history ใหม่เพื่อลบข้อมูลผู้รีวิวในไฟล์ scrape เก่า (ทำลาย history — owner ต้องอนุมัติ)
- อัปเกรด NestJS 11 → 12
