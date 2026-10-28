# Review — Phase 14: แปลข้อมูลร้านเป็นภาษาไทย

## Round 1 — 2026-10-28
**Range:** `main..8a684ab` (`main..phase-14-cafe-translations`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` 9 suites / 40 tests → `test:e2e` 5 suites / 66 tests → `build` ผ่านทั้งหมด)
- [x] `npm run gate:web` (`typecheck` → `lint` → `next build` ผ่านทั้งหมด 361 static pages ใต้ `/en` และ `/th`)

### Findings
ไม่มี blocker หรือ major ค้าง

1. **[nit]** [`server/scripts/translate-cafes.ts:117`](server/scripts/translate-cafes.ts#L117) — เมื่อใส่ `--limit N` ตัวแปร `done` จะนับเฉพาะร้านที่แปลในรอบนั้น (`if (done >= limit) break;` ตรวจหลังข้ามร้านที่มี `th` แล้ว) ซึ่งสมเหตุสมผลสำหรับการใช้งานจริง แต่ถ้าใส่ `--limit 0` หรือค่าที่ไม่ใช่ตัวเลข (`NaN`) เงื่อนไข `done >= limit` สำหรับ `NaN` จะเป็น `false` เสมอ
   - เกิดเมื่อ: รัน script ด้วย `--limit abc`
   - แนะนำ: ไม่กระทบ runtime ของระบบหลัก หากต้องการป้องกันในอนาคตสามารถเช็ก `Number.isFinite(limit)` แบบเดียวกับ `rpm` ได้

### สิ่งที่ทำได้ดี (optional)
- **ครบถ้วนตามแผนทุกข้อ (14.1–14.5):**
  - **14.1 Schema:** เพิ่ม [`CafeTranslation`](server/src/cafes/schemas/cafe.schema.ts#L603-L611) และ `CafeTranslationSchema` (`_id: false`) บน [`Cafe.th`](server/src/cafes/schemas/cafe.schema.ts#L159-L161) เก็บเฉพาะ `specialty`, `flavor`, `atmosphere`, `aiSummary`, `model`, `generatedAt` โดยไม่แตะชื่อร้าน ที่อยู่ แท็ก และย่านที่ใช้กรอง
  - **14.2 API `lang=th`:** ใช้ [`LANGS`](server/src/cafes/lang.ts#L2) และ [`LangQueryDto`](server/src/cafes/dto/lang.dto.ts#L6-L12) ร่วมกับ [`QueryCafesDto`](server/src/cafes/dto/query-cafes.dto.ts#L118-L122) และ [`TopCafesDto`](server/src/cafes/dto/top-cafes.dto.ts#L27-L31) รองรับ `GET /api/cafes`, `/api/cafes/top`, `/api/cafes/:slug`, `/api/me/favorites` พร้อม fallback เป็นภาษาอังกฤษเมื่อยังไม่มีคำแปล, ส่ง `textLang` ระบุภาษาที่ได้จริง, ไม่ส่งฟิลด์ `th` ดิบออกใน response ([`toCafeResponse`](server/src/cafes/dto/cafe-response.dto.ts#L54-L96)), รองรับ `?lang=` ว่างผ่าน `emptyToUndefined`, และตอบ 400 เมื่อส่งค่าภาษาอื่นนอกเหนือจาก `en` / `th`
  - **14.3 Script แปลด้วย Gemini และการตรวจสอบผลลัพธ์:** [`server/scripts/translate-cafes.ts`](server/scripts/translate-cafes.ts) ส่งเฉพาะข้อความภาษาอังกฤษของร้าน และตรวจผลลัพธ์ด้วย [`cleanTranslation`](server/scripts/translate-cafes.ts#L71-L97) อย่างรัดกุม (ต้องมีอักษรไทย, สัดส่วนอักษรไทย `thai * 2 >= latin`, ความยาว ≤ 160 ตัวอักษร, จำนวน `pros`/`cons` ตรงกับต้นฉบับ และคงลิสต์ว่างไว้แม้โมเดลพยายามเติมข้อความ)
  - **14.4 การเชื่อมต่อฝั่ง Frontend และคำแปลแท็ก/ย่าน:** ส่ง `lang` ในทุกจุดที่ดึงข้อมูลร้าน ([`web/app/[lang]/cafes/[slug]/page.tsx`](web/app/%5Blang%5D/cafes/%5Bslug%5D/page.tsx), [`CafeFinder`](web/components/cafe-finder.tsx), [`HeroVisual`](web/components/hero-visual.tsx), [`FavoritesProvider`](web/lib/favorites.tsx)) และแปลทั้ง 77 แท็ก (`cafeTags`) กับ 17 ย่าน (`areas`) ใน [`web/lib/i18n/th.ts`](web/lib/i18n/th.ts#L56-L153) ผ่าน [`dataLabel`](web/lib/i18n/config.ts#L45-L47) ครบทั้งในการ์ด หน้าร้าน รายการโปรด chip ตัวกรอง และข้อความที่ AI ข้าม (`filterLabels`)
  - **14.5 ชุดทดสอบครอบคลุมครบถ้วน:** มีทั้ง unit test ของ [`cleanTranslation`](server/scripts/translate-cafes.spec.ts) และ e2e test ใน [`cafes.e2e-spec.ts`](server/test/cafes.e2e-spec.ts#L172-L231) กับ [`auth.e2e-spec.ts`](server/test/auth.e2e-spec.ts#L344-L375)

## Response
Round 1 APPROVED · แก้ nit ใน `6e32835`: `--limit` ที่ไม่ใช่ตัวเลขบวก (`abc`, `0`) → error "--limit must be a positive number" แบบเดียวกับ `--rpm`
