# Review — Phase 25: Vercel Web Analytics

## Round 1 — 2026-11-07
**Range:** `main..phase-25-vercel-analytics` (`3acde8b`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` บน Next.js 16.4.3 — 415 static pages generated + Proxy middleware enabled)

### Findings
ไม่พบปัญหาในระดับ `blocker`, `major`, `minor` หรือ `nit` — งานครบตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L615-L629) (25.1–25.4) ทุกหัวข้อ

### สิ่งที่ทำได้ดี (optional)
- **ความเป็นส่วนตัวและการกรองข้อมูลใน [`beforeSend`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/site-analytics.tsx#L16-L32):**
  - ตัด query string และ hash ออกจากทุก URL (`url.origin + url.pathname` พร้อม fallback `event.url.split(/[?#]/)[0]`) ทำให้คำค้นหาของผู้ใช้ไม่ถูกส่งออกไปกับ analytics event
  - รองรับการ opt-out / opt-in ต่อเครื่องผ่าน `?no-analytics=1` และ `?no-analytics=0` โดยครอบการเข้าถึง `localStorage` ด้วย `try / catch` เพื่อไม่ให้พังในโหมดที่บล็อก storage
- **การทำงานร่วมกับ Proxy และ CSP:**
  - อัปเดต [`config.matcher`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/proxy.ts#L67-L71) ใน [`proxy.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/proxy.ts) ให้ข้าม `/_vercel/` เพื่อไม่ให้ endpoint `/_vercel/insights/view` ถูก redirect ไปยัง `/en/...` หรือ `/th/...`
  - ตั้งค่า [`CSP`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/next.config.ts#L16-L28) ใน [`next.config.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/next.config.ts) ให้เปิด `https://va.vercel-scripts.com` เฉพาะตอน `isDev` ส่วนบน production ใช้ `'self'` (`/_vercel/insights/*`) ได้โดยไม่ต้องเปิดโดเมนภายนอกเพิ่ม

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->
