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

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->
