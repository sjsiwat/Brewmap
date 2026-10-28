# Review — Phase 13: ภาษาไทย / อังกฤษ (i18n)

## Round 1 — 2026-10-28
**Range:** `main..5432af0` (`main..phase-13-i18n`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:web` (`typecheck` (`tsc --noEmit`) → `lint` (`eslint`) → `next build` ผ่านทั้งหมด 361 static pages ใต้ `/en` และ `/th`)

### Findings
1. **[nit]** [`web/components/stars.tsx:6`](web/components/stars.tsx#L6) — `aria-label={`${value} out of 5`}` ใน component [`Stars`](web/components/stars.tsx#L4-L11) ยังเป็นข้อความภาษาอังกฤษคงที่
   - เกิดเมื่อ: ใช้ screen reader อ่านดาวคะแนนในส่วน [`GoogleReviews`](web/components/google-reviews.tsx#L19-L47) และ [`CafeReviews`](web/components/cafe-reviews.tsx#L162-L263) บนหน้า `/th/cafes/[slug]`
   - แนะนำ: ไม่กระทบการแสดงผลหรือการใช้งานหลัก หากต้องการแปลในอนาคตสามารถส่ง label ที่แปลแล้วผ่าน prop หรืออ่านจาก dictionary ได้

### สิ่งที่ทำได้ดี (optional)
- **ครบถ้วนตามรายการตรวจสอบทั้งหมดในแผน (13.1–13.5):**
  - **ลิงก์ภายในทั้งเว็บ:** ทุกหน้าและทุก component ([`site-header.tsx`](web/components/site-header.tsx), [`site-footer.tsx`](web/components/site-footer.tsx), [`feature-showcase.tsx`](web/components/feature-showcase.tsx), [`final-cta.tsx`](web/components/final-cta.tsx), [`hero-visual.tsx`](web/components/hero-visual.tsx), [`cafe-card.tsx`](web/components/cafe-card.tsx), [`cafe-detail.tsx`](web/components/cafe-detail.tsx), [`cafe-finder.tsx`](web/components/cafe-finder.tsx), [`cafe-reviews.tsx`](web/components/cafe-reviews.tsx), [`favorite-button.tsx`](web/components/favorite-button.tsx), [`favorites-list.tsx`](web/components/favorites-list.tsx), [`auth-form.tsx`](web/components/auth-form.tsx), [`error.tsx`](web/app/%5Blang%5D/cafes/%5Bslug%5D/error.tsx)) ใช้ `href()` หรือ [`localePath()`](web/lib/i18n/config.ts#L16-L20) ครบทุกจุด รวมถึง `?next=` ตอนพาไปหน้า login และการค้นหาจาก header ไปยัง `/th/cafes?search=…`
  - **ความครบถ้วนของ Dictionary และข้อความ UI:** [`web/lib/i18n/th.ts`](web/lib/i18n/th.ts) ใช้ type [`Dictionary`](web/lib/i18n/en.ts#L449) จาก [`web/lib/i18n/en.ts`](web/lib/i18n/en.ts) บังคับให้มีครบทุก key โดยไม่มีตกหล่น พร้อมแยก validation error ใน [`web/lib/validation.ts`](web/lib/validation.ts) ออกเป็น key เพื่อให้แสดงข้อความตามภาษาของหน้าได้ทันที
  - **การทำงานของ [`web/proxy.ts`](web/proxy.ts):** แยกการจัดการ `/api` ออกไปที่ [`forwardToApi`](web/proxy.ts#L14-L30) โดยยังคงลบ `x-client-ip` / `x-proxy-secret` ที่มาจาก client และแนบ header สำหรับ rate limit เหมือนเดิมทุกประการ ส่วนหน้าเว็บปกติทำ redirect 307 ตามลำดับ `NEXT_LOCALE` cookie → `Accept-Language` (เรียงตามค่า `q` และกันค่า `NaN` ด้วย `entry.q > 0`) → `en` พร้อมคง query string เดิมและบันทึก cookie เมื่อเข้าหน้า `/en` หรือ `/th`
  - **ความถูกต้องของภาษาไทยและรายละเอียด Typography:** คำแปลใน [`th.ts`](web/lib/i18n/th.ts) เป็นธรรมชาติและตรงกับการใช้งานจริงของระบบ ใช้ `Intl` (`th-TH`) สำหรับตัวเลขและวันที่ พ.ศ., โหลดฟอนต์ `Noto_Sans_Thai` / `Noto_Serif_Thai` แบบ `preload: false` เฉพาะหน้าที่มีอักษรไทย และปิด `letter-spacing: 0` บน `:lang(th)` ใน [`web/app/globals.css`](web/app/globals.css#L96-L102) เพื่อไม่ให้สระและวรรณยุกต์ลอยแยกจากพยัญชนะ

## Response
Round 1 APPROVED · แก้ nit ใน `c0b5660`: `Stars` รับ `outOf5` จาก dictionary (`units.outOf5`: "{n} out of 5" / "{n} จาก 5 ดาว") ทุกจุดที่ใช้ และเพิ่ม `role="img"` ให้ `aria-label` ถูกอ่านแน่นอน
