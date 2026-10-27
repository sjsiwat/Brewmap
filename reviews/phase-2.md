# Review — Phase 2: ต่อ Frontend เข้า API

## Round 1 — 2026-10-27
**Range:** `75bf9e0..phase-2-web-api`
**Verdict:** APPROVED

### Gate
*(หมายเหตุ: `run_command` อนุญาตเฉพาะ working directory ที่ root จึงไม่สามารถสลับเข้า `server/` หรือ `web/` เพื่อรันคำสั่ง Gate โดยตรงได้ ตรวจสอบจากโค้ดและผลรันของ implementer ใน commit `0ff0b62`)*
- [x] `server/` — `npx tsc --noEmit`
- [x] `server/` — `npx eslint "{src,apps,libs,test}/**/*.ts"`
- [x] `server/` — `npm test`
- [x] `server/` — `npm run test:e2e` (11 เคส รวมเคส empty query params ใหม่)
- [x] `server/` — `npm run build`
- [x] `web/` — `npx tsc --noEmit`
- [x] `web/` — `npm run lint`
- [x] `web/` — `npm run build`

### Findings
ไม่พบปัญหาในระดับ `blocker` หรือ `major` — งานครบทุกข้อตามแผนใน `plan.md` (2.1–2.11) และทำตาม Decisions D1(a) และ D2(a) อย่างถูกต้อง

1. **[minor]** [`web/lib/use-cafe-search.ts:81`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/use-cafe-search.ts#L81-L88) — เมื่อโหลดหน้าถัดไป (`loadMore` บนหน้า `page > 1`) แล้วเกิด error รายการจากหน้าแรกที่โหลดสำเร็จแล้วจะยังแสดงอยู่ควบคู่กับ error banner แต่เมื่อกด `retry()` ตัว `attempt` จะถูกเพิ่มค่า (`setAttempt((n) => n + 1)`) ทำให้ key ของทุกหน้าเปลี่ยนและเกิดการยิง request ใหม่ตั้งแต่หน้า 1 ถึง `pageCount` ทั้งหมด
   - เกิดเมื่อ: ผู้ใช้กด Show more แล้ว API ล่มชั่วคราวในหน้าที่ 2 แล้วกด Try again
   - แนะนำ: ไม่กระทบการใช้งานปกติเพราะผลลัพธ์สุดท้ายยังถูกต้อง แต่หากต้องการลด request ซ้ำซ้อนในอนาคต สามารถลบเฉพาะ key ที่เป็น `{ error }` ออกจาก `results` และ `requested.current` แทนการเพิ่ม `attempt` ทั้งชุด

2. **[nit]** [`server/src/cafes/dto/query-cafes.dto.ts:74`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L74-L80) — `tag` และ `area` ยังไม่ได้ใส่ `@Transform(emptyToUndefined)`
   - เกิดเมื่อ: มีการเรียก `/api/cafes?tag=` หรือ `/api/cafes?area=` แม้ใน [`CafesService.buildFilter`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/cafes.service.ts#L160-L161) จะเช็ก truthy (`if (query.tag)`) และใน [`CafesService.findTop`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/cafes.service.ts#L111) เช็ก `if (query.tag)` จึงไม่ทำให้ query ผิดพลาด แต่การใส่ `@Transform(emptyToUndefined)` ให้ครบทุก optional filter field จะช่วยให้ DTO มีความสม่ำเสมอ

### สิ่งที่ทำได้ดี (optional)
- **Next.js 16 Patterns & D2(a) ISR:** [`web/app/cafes/[slug]/page.tsx`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/app/cafes/%5Bslug%5D/page.tsx#L12-L47) ใช้ `revalidate = 3600` คู่กับ `generateStaticParams` ที่มีการ fallback คืน `[]` เมื่อ API ไม่ได้เปิดตอน build ทำให้ build ไม่พังและยัง render + cache ตอน request แรกได้ รวมถึง [`web/app/cafes/[slug]/error.tsx`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/app/cafes/%5Bslug%5D/error.tsx#L8-L45) ใช้ `unstable_retry()` ตามแนวทางของ Next.js 16.2
- **Typed Fetch Client & Race-Condition Handling:** [`web/lib/api.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/api.ts#L47-L84) กรองค่าว่าง (`undefined`, `null`, `""`) ออกจาก query string อย่างสะอาด และ [`web/lib/use-cafe-search.ts`](file:///Users/siwat/Documents/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/use-cafe-search.ts#L38-L69) จัดการ `AbortController` พร้อมคืนค่า `inFlight` keys เมื่อ cleanup ทำให้ปลอดภัยทั้งใน React Strict Mode และเมื่อเปลี่ยนตัวกรองเร็ว ๆ
- **Shared App Setup & Findings เดิม:** แยก [`server/src/app.setup.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/app.setup.ts#L5-L20) ให้ `main.ts` และ e2e test ใช้ config เดียวกัน แก้ประเด็นจาก Phase 0–1 ครบทั้ง 3 ข้อ (`emptyToUndefined`, `no-explicit-any: error`, และ `--experimental-vm-modules`) พร้อมเพิ่ม e2e test ยืนยัน

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->
