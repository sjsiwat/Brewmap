# Review — Phase 23: "สนับสนุนค่ากาแฟ" QR พร้อมเพย์ใน footer

## Round 1 — 2026-11-07
**Range:** `4c124ce..44e8541`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:web` (`tsc --noEmit` → `eslint` → `next build` 415/415 static pages)

### Findings
ไม่มี (ไม่พบปัญหาในระดับ blocker / major / minor / nit)

### สิ่งที่ทำได้ดี
- [`SiteFooter`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/site-footer.tsx#L64-L101) ใช้ `<section aria-labelledby="support-coffee">` คู่กับ `<h2 id="support-coffee">` และ `alt` จาก dictionary ครบทั้ง 2 ภาษา ([`en.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/i18n/en.ts#L52-L56), [`th.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/i18n/th.ts#L49-L53))
- [`promptpay-qr.png`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/public/support/promptpay-qr.png) ตัดเหลือเฉพาะตัว QR พร้อมขอบขาว (quiet zone) และวางในกล่อง `bg-white p-2` บนพื้นหลัง `bg-ink` ทำให้แอปธนาคารสแกนได้แม่นยำโดยไม่เปิดเผยข้อมูลส่วนบุคคลบนหน้าเว็บ
- มีคำแนะนำสำหรับผู้ใช้มือถือพร้อมปุ่มดาวน์โหลด (`download="brewmap-promptpay-qr.png"`) ที่รองรับการโฟกัสด้วยคีย์บอร์ด (`focus-ring`) และจัดวาง layout แบบ responsive (`flex-col` บนมือถือ → `sm:flex-row` บนจอใหญ่) ได้เข้ากับธีมของเว็บ

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->
