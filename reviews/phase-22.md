# Review — Phase 22: ปุ่มนำทางด้วย Google Maps

## Round 1 — 2026-11-07
**Range:** `main..6a8a7af`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:web` (`tsc --noEmit` → `eslint` → `next build` 415/415 static pages)

### Findings
ไม่มี (ไม่พบปัญหาในระดับ blocker / major / minor / nit)

### สิ่งที่ทำได้ดี
- [`googleMapsDirectionsUrl`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/cafes.ts#L59-L61) ใช้รูปแบบ URL ทางการของ Google Maps (`https://www.google.com/maps/dir/?api=1&destination=...`) พร้อม URL-encode คอมมา (`%2C`) สอดคล้องกับ [`osmEmbedUrl`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/cafes.ts#L53-L56)
- ปุ่มนำทางใน [`CafeDetail`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-detail.tsx#L96-L105) และลิงก์ใน [`CafeCard`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-card.tsx#L110-L119) จัดการ accessibility (`aria-label` ที่มีชื่อร้านใน card, `sr-only` แจ้งเปิด Google Maps ในหน้าร้าน, `focus-ring`), responsive (`w-full` บนมือถือ และ `sm:w-auto` บนจอใหญ่), และ `relative z-10` อยู่เหนือ stretched link ของการ์ดอย่างถูกต้อง
- คำแปลครบทั้ง [`en.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/i18n/en.ts#L282-L283) และ [`th.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/i18n/th.ts#L394-L395)

## Round 2 — 2026-11-07
**Range:** `main..947eb9b`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`tsc --noEmit` → `eslint` → `jest` 12 suites / 67 tests → `jest e2e` 5 suites / 69 tests → `nest build`)
- [x] `npm run gate:web` (`tsc --noEmit` → `eslint` → `next build` 415/415 static pages)

### Findings
ไม่มี (ไม่พบปัญหาในระดับ blocker / major / minor / nit)

### สิ่งที่ทำได้ดี
- ส่งต่อ `placeId` ครบตั้งแต่สคริปต์ [`build_cafes_all.py`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/build_cafes_all.py#L325-L327) → [`cafes.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/data/cafes.json) (ครบ 1,435 ร้าน) → [`Cafe`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/schemas/cafe.schema.ts#L82-L84) schema → [`toCafeResponse`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/cafe-response.dto.ts#L70) (`cafe.placeId ?? null`) → [`Cafe`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/cafes.ts#L20-L21) ฝั่งเว็บ พร้อม e2e test ใน [`cafes.e2e-spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/test/cafes.e2e-spec.ts#L97-L98)
- [`googleMapsDirectionsUrl`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/cafes.ts#L65-L72) รับ `Pick<Cafe, "name" | "placeId" | "lat" | "lng">`, ใช้ `encodeURIComponent` ทั้ง `destination` และ `destination_place_id` อย่างปลอดภัย และมี fallback กลับไปใช้พิกัด `lat%2Clng` เมื่อไม่มี `placeId`

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->
