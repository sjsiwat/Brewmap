# Review — Phase 10: หน้าค้นหา: quick wins

## Round 1 — 2026-10-28
**Range:** `main..phase-10-finder-quick-wins` (`38d4f35`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (7 suites, 28 passed) → `test:e2e` (5 suites, 63 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` บน Next.js 16.4.3 — 182 static pages generated + Proxy middleware enabled)

### Findings
ไม่พบปัญหาในระดับ `blocker`, `major`, `minor` หรือ `nit` — งานครบตามแผนใน [`plan.md`](plan.md#L381-L397) (10.1–10.5) ทุกหัวข้อ

### สิ่งที่ทำได้ดี (optional)
- **สูตร Bayesian Average (`sort=recommended`) และ Aggregation Pipeline เดียว:**
  - ใน [`CafesService.recommendedScore`](server/src/cafes/cafes.service.ts#L109-L125) คำนวณ `(reviewCount * rating + m * mean) / (reviewCount + m)` โดยใช้ `RECOMMENDED_PRIOR_REVIEWS = 250` และหา `mean` จากทุกร้านใน DB (`stats?.mean ?? 0` รองรับกรณี DB ว่างโดยไม่หารศูนย์เพราะตัวส่วนเป็น `$reviewCount + 250`) พร้อมเรียงลำดับด้วย `{ score: -1, reviewCount: -1, slug: 1 }` ใน [`SORT_ORDERS`](server/src/cafes/cafes.service.ts#L27-L33) เพื่อให้ pagination เสถียรเสมอ
  - ใน [`CafesService.findAll`](server/src/cafes/cafes.service.ts#L41-L102) รวมเส้นทางมีพิกัด (`$geoNear` เป็น stage แรก) และไม่มีพิกัด (`$match`) เข้าเป็น aggregation pipeline เดียวที่จบด้วย `$facet` (`items` + `total`) และแปลงผลลัพธ์ผ่าน [`toCafeResponse`](server/src/cafes/dto/cafe-response.dto.ts) ทำให้ฟิลด์ชั่วคราว `score` ไม่รั่วออกไปใน API response และยังคงค่า default เดิมของ API (`distance` เมื่อมี `lat`/`lng`, `rating` เมื่อไม่มี)
- **ตัวกรองและการเรียงลำดับมีผลทันที พร้อม Accessibility ที่ครบถ้วน:**
  - ใน [`CafeFinder`](web/components/cafe-finder.tsx#L79-L230) ตัด state `draft`/`applied` และปุ่ม Confirm ออก ทำให้เปลี่ยนตัวกรองหรือ `sort` (ค่าเริ่มต้น `"recommended"`) แล้วอัปเดตผลลัพธ์ทันที มีปุ่ม `"Clear N filter(s)"` เมื่อ `activeCount > 0` และแสดงจำนวนร้านขนาดใหญ่พร้อม `aria-live="polite"` รวมถึง `<span className="sr-only"> · sorted by {sortLabel}</span>` สำหรับ screen reader
- **ความสะอาดของการ์ดร้านและการแยกปุ่ม Favorite ออกจาก `<Link>`:**
  - ใน [`CafeFinder`](web/components/cafe-finder.tsx#L235-L300) ลบเลขลำดับ (`cafe.index`), ปรับคอลัมน์ชื่อร้านเป็น `md:col-span-5`, เปลี่ยนสีราคาเป็น `text-ink`, ให้ทั้งแถวอยู่ใน `<Link>` พร้อม hover state ทั้งแถว (`hover:bg-ink/[0.03]` และ `group-hover:text-rust`) โดยวาง [`FavoriteButton`](web/components/cafe-finder.tsx#L298) ไว้นอก `<Link>` (`absolute top-6 right-0`) ไม่ให้เกิด `<button>` ซ้อนใน `<a>` ตามมาตรฐาน HTML
- **การทดสอบ E2E ครอบคลุมเงื่อนไขสำคัญ:**
  - ใน [`server/test/cafes.e2e-spec.ts`](server/test/cafes.e2e-spec.ts#L199-L226) ทดสอบครบทั้งกรณีไม่มีพิกัดและมีพิกัด (`lat`/`lng`/`radiusKm`), ตรวจว่าไม่มี `score` หลุดใน response, และยืนยันว่าร้านที่ได้ 4.9 ดาวจากรีวิว 2,000+ อยู่อันดับสูงกว่าร้านที่ได้ 5.0 ดาวแต่รีวิวน้อย (`< 100`)

## Response
Round 1 APPROVED ไม่มี finding — ไม่มีอะไรต้องแก้
