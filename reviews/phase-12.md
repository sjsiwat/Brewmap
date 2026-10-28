# Review — Phase 12: หน้าค้นหา: การ์ดร้าน, header, เวลาเปิด-ปิดรายวัน

## Round 1 — 2026-10-28
**Range:** `de90fe9..3925c51` (`phase-11-unified-search..phase-12-cards-header`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (8 suites, 36 passed) → `test:e2e` (5 suites, 64 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `next build` ผ่านทั้งหมด 182 static pages)

### Findings
ไม่พบปัญหาในระดับ `blocker`, `major`, `minor` หรือ `nit` — งานครบตามแผนใน [`plan.md`](plan.md#L417-L435) (12.1–12.6) ทุกหัวข้อ

### สิ่งที่ทำได้ดี (optional)
- **การแปลงและตรวจสอบเวลาเปิด-ปิดรายสัปดาห์ที่รัดกุมและตรงกันทั้งสองฝั่ง:**
  - [`server/src/cafes/opening-hours.ts`](server/src/cafes/opening-hours.ts) รองรับรูปแบบจาก Google Maps ครบถ้วน (`8 AM–6 PM`, `8:30 AM–5:30 PM`, `12–10 PM`, `7 AM–1 AM`, `Closed`, `Open 24 hours`, หลายช่วงเวลาต่อวัน) และคืนค่า `null` ทันทีเมื่อข้อมูลไม่ครบหรืออ่านไม่ได้โดยไม่เดา พร้อมคำนวณเวลาตามโซน `Asia/Bangkok` และรองรับร้านที่เปิดข้ามคืนจากวันก่อนหน้า (`close > 1440`) ทั้งใน [`isOpenAt`](server/src/cafes/opening-hours.ts#L101-L110) และ MongoDB query [`openAtFilter`](server/src/cafes/opening-hours.ts#L113-L125)
  - ฝั่งเว็บใน [`web/lib/opening-hours.ts`](web/lib/opening-hours.ts) ใช้ [`useSyncExternalStore`](web/lib/opening-hours.ts#L76-L79) (`useNow`) คืนค่า `null` ตอน SSR เพื่อป้องกัน hydration mismatch และอัปเดตสถานะเปิด-ปิดทุกนาทีบน client
- **โครงสร้างการ์ดร้าน (`CafeCard`) และ Accessibility:**
  - [`web/components/cafe-card.tsx`](web/components/cafe-card.tsx) เรียงลำดับข้อมูลชัดเจน ตัด tag ที่ซ้ำกับ `Parking` / `Pet-friendly` ออกก่อนจำกัดไม่เกิน 3 tags, ใช้ stretched link (`after:absolute after:inset-0`) พร้อมวง focus รอบการ์ด และวาง [`FavoriteButton`](web/components/cafe-card.tsx#L97) แยกเป็น `<button>` อิสระอยู่เหนือลิงก์ (`z-10`) ไม่ซ้อน `<button>` ใน `<a>`
- **Header ที่กระชับและการส่งต่อคำค้นหาข้ามหน้า:**
  - [`web/components/site-header.tsx`](web/components/site-header.tsx) และ [`SearchFromUrl`](web/components/cafe-finder.tsx#L75-L86) ใน [`web/components/cafe-finder.tsx`](web/components/cafe-finder.tsx) ทำงานร่วมกันได้ดี เมื่อค้นหาจากหน้าอื่นจะพามาที่ `/cafes?search=…` รัน `submit(false, search)` ครั้งเดียวแล้วใช้ `router.replace("/cafes", { scroll: false })` ล้าง query param เพื่อไม่ให้ถาม AI ซ้ำเมื่อรีเฟรชหน้า

## Response
Round 1 APPROVED ไม่มี finding — ไม่มีอะไรต้องแก้
