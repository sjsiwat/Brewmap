# Review — Phase 3b: รีเช็ก Phase 3

## Round 1 — 2026-10-27
**Range:** `2eba272..phase-3b-recheck-fixes`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (2 suites, 3 passed) → `test:e2e` (2 suites, 24 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` (182 static pages generated))

### Findings
ไม่พบปัญหาในระดับ `blocker` หรือ `major` — งานแก้บั๊กครบทั้ง 4 ข้อตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L166-L180) (3b.1–3b.4)

1. **[nit]** [`web/lib/auth.tsx:92`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/auth.tsx#L92-L100) — [`safeNextPath`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/auth.tsx#L92-L100) เช็ก `url.origin !== NEXT_BASE` ซึ่งกัน `/\example.com`, `//example.com`, และ `///example.com` ได้ครบแล้ว แต่ถ้า `next` มี dot-segment นำหน้าก่อน double slash เช่น `/.//example.com` หรือ `/..//example.com` ตัว URL parser จะยุบ `/.` ออกทำให้ `url.origin` ยังเป็น `NEXT_BASE` แต่ `url.pathname` กลายเป็น `"//example.com"` เมื่อคืนค่า `${url.pathname}${url.search}${url.hash}` โดยตัด origin ออกจึงกลับมาเริ่มด้วย `//` อีกครั้ง
   - เกิดเมื่อ: ส่ง query เช่น `/login?next=/.//example.com` หรือ `/login?next=/..//example.com`
   - แนะนำ: เพิ่มเงื่อนไขเช็ก `if (url.origin !== NEXT_BASE || url.pathname.startsWith("//")) return "/cafes";` (หากต้องการความรัดกุมเพิ่มเติมในเฟสถัดไป)

### สิ่งที่ทำได้ดี (optional)
- **Open Redirect Protection (3b.1):** [`safeNextPath`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/auth.tsx#L92-L100) เปลี่ยนจากการเช็กแค่ string prefix มาเป็น `new URL(next, NEXT_BASE)` และตรวจ `url.origin === NEXT_BASE` ทำให้บล็อก `/\evil.example` (`/%5Cevil.example`) ที่ browser ตีความเป็น `//evil.example` ได้อย่างถูกต้อง
- **Per-Café In-Flight Lock & Deduplication (3b.2):** [`FavoritesProvider`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/favorites.tsx#L36-L83) ใช้ `pending` (`useRef(new Set<string>())`) ล็อกระดับ `cafe.slug` ป้องกัน `PUT`/`DELETE` แซงกันเมื่อผู้ใช้กดรัว ๆ และใช้ `without` กรอง `slug` เดิมออกก่อนเสมอทั้งตอน optimistic update และตอน rollback จึงไม่เกิดปัญหาร้านซ้ำในหน้า Saved
- **401 Session Expiry & Logout Resilience (3b.3–3b.4):** เมื่อกด ❤️ แล้วได้ `401` ตัว [`FavoritesProvider.toggle`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/favorites.tsx#L73-L77) จะ rollback state พร้อมเรียก [`endSession()`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/auth.tsx#L67-L70) และ [`FavoriteButton`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/favorite-button.tsx#L36-L40) พาไป `/login?next=...` ทันที ส่วน [`AccountLinks`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/site-header.tsx#L29-L64) ดัก error ตอน `logout()` เมื่อ API ล่มโดยคงสถานะที่แท้จริงไว้และแสดงข้อความ `"Log out failed · retry"`

## Response
- **#1 แก้แล้ว** (`ec4e8d3`) — ยืนยันแล้วว่าเป็นช่องโหว่จริง ไม่ใช่แค่ nit: `/login?next=/.//example.com` (และ `/..//`, `/a/..//`, `/%2e//`, `/./\\`) ได้ path `//example.com` ซึ่ง router ตีความเป็น protocol-relative → ออกนอกเว็บ · แก้ตามที่แนะนำ: ผลลัพธ์ที่ขึ้นต้นด้วย `//` → `/cafes` · ทดสอบ 13 เคสด้วย node (off-site 0) และใน Chrome ตอน login อยู่: `/.//example.com`, `/a/..//example.com`, `/\\example.com` → `/cafes` · `/me/favorites` ยังพากลับถูก · ขอตรวจ Round 2 เพราะเป็นการแก้ด้าน security หลัง APPROVED
