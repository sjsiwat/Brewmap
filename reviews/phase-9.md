# Review — Phase 9: ค้นหาร้านด้วยชื่อ

## Round 1 — 2026-10-27
**Range:** `main..phase-9-name-search` (`6d679f8`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (7 suites, 28 passed) → `test:e2e` (5 suites, 62 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` บน Next.js 16.4.3 — 182 static pages generated + Proxy middleware enabled)

### Findings
ไม่พบปัญหาในระดับ `blocker`, `major`, `minor` หรือ `nit` — งานครบตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L363-L378) (9.1–9.4) ทุกหัวข้อ

### สิ่งที่ทำได้ดี (optional)
- **ความปลอดภัยของ `q` (ป้องกัน Regex Injection, ReDoS และ NoSQL Operator Injection):**
  - ใน [`QueryCafesDto`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L63-L69) บังคับ `@Transform(normaliseSearch)`, `@IsString()` และ `@MaxLength(SEARCH_MAX)` (`SEARCH_MAX = 60`) โดย [`normaliseSearch`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L44-L48) คืนค่าเดิมเมื่อไม่ใช่ string เพื่อให้ `@IsString()` ปฏิเสธ NoSQL operator object เช่น `?q[$ne]=x` ด้วย `400 Bad Request`
  - ใน [`searchWords`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L56-L61) แยกคำและจำกัดไม่เกิน 6 คำ (`.slice(0, 6)`) จากนั้นใน [`CafesService.buildFilter`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/cafes.service.ts#L190-L196) escape อักขระพิเศษของ regex ทุกตัว (`word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) ก่อนสร้าง `new RegExp(..., 'i')` ทำให้เป็น literal substring เสมอ ไม่มี quantifier หรือ alternation ที่ทำให้เกิด catastrophic backtracking (ReDoS) และเช็ก `if (words.length)` ก่อนใส่ `filter.$and` ป้องกันกรณี `q` มีแต่เครื่องหมายล้วนจนได้ `$and: []`
- **ความถูกต้องของการค้นหาหลายคำ ภาษาไทย และเครื่องหมาย:**
  - [`searchWords`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L56-L61) ใช้ `/[^\p{L}\p{M}\p{N}]+/u` ซึ่งรวม `\p{M}` (Unicode Combining Marks) เข้าไปด้วย ทำให้สระลอยและวรรณยุกต์ภาษาไทยไม่ถูกตัดแยกกลางคำ ในขณะที่เครื่องหมายต่าง ๆ (เช่น `%`, `-`, `'`) ถูกข้ามอย่างถูกต้อง ค้นหา `"%arabica"` หรือสลับลำดับคำ `"nimman arabica"` จึงเจอ `"% Arabica Chiang Mai One Nimman"` ครบทุกคำผ่าน `$and`
- **การทำงานร่วมกับ `$geoNear`:**
  - ใน [`CafesService.findAll`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/cafes.service.ts#L52-L97) ส่ง `filter` ที่ได้จาก [`buildFilter`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/cafes.service.ts#L177-L198) เข้า `query: filter` ภายใน `$geoNear` ซึ่งเป็น stage แรกของ aggregation pipeline ทำให้ค้นหาด้วยชื่อร้านควบคู่กับการคำนวณ `distanceKm` และกรอง `radiusKm` ได้โดยตรง
- **ลำดับการผ่อน Filter ใน AI Finder (`hasCafeNamed`) และการป้องกัน Prompt Injection:**
  - ใน [`AiService.find`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L107-L124) แยกกรณีได้อย่างสมเหตุสมผล: ถ้าร้านที่ผู้ใช้ระบุชื่อไม่มีในระบบเลย (`!(await this.hasCafeNamed(filters.q))`) จะผ่อน `q` ทิ้งก่อนแล้วเก็บเงื่อนไขอื่นไว้ (เช่น `"Starbucks Reserve แถวนิมมาน"` ได้ร้านในนิมมานพร้อมแจ้ง `relaxed.q`) แต่ถ้าร้านมีอยู่ในระบบ (`hasCafeNamed` เป็น `true`) จะเก็บ `q` ไว้เป็นลำดับสุดท้ายใน [`RELAX_ORDER`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L299-L310) และผ่อนเงื่อนไขอื่นที่ขัดแย้งออกก่อน
  - ค่า `q` ที่ได้จาก Gemini ถูกบังคับทั้งใน [`filterSchema`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L215) และตรวจซ้ำด้วย [`sanitizeFilters`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L239-L296) ผ่านกฎเดียวกับ `QueryCafesDto` ส่วนฝั่งแสดงผลใน [`AiFinder`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/ai-finder.tsx#L23-L25) และ [`CafeFinder`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-finder.tsx#L208-L210) render เป็น React text node ป้องกัน XSS
- **การหน่วงเวลา (Debounce) การป้องกัน Request ที่ไม่จำเป็น และ Accessibility บนหน้าเว็บ:**
  - ใน [`CafeFinder`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-finder.tsx#L75-L95) แยก state `nameInput` ออกจาก `name` และหน่วงเวลา `300 ms` พร้อม normalize ช่องว่าง (`nameInput.trim().replace(/\s+/g, " ")`) ก่อนอัปเดต `name` ทำให้ตอน mount ครั้งแรก (`""` → `""`) หรือตอนพิมพ์เว้นวรรคต่อท้ายไม่ทำให้ `queryKey` ใน [`useCafeSearch`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/use-cafe-search.ts#L30-L70) เปลี่ยน จึงไม่ยิง request ซ้ำโดยไม่จำเป็น
  - ช่องค้นหาใน [`CafeFinder`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-finder.tsx#L104-L123) ใช้ `<div role="search">` พร้อม `focus-within:outline-rust`, ผูก `<label htmlFor="cafe-name" className="sr-only">` เข้ากับ `<input id="cafe-name" type="search" maxLength={60}>`, ซ่อนไอคอนด้วย `aria-hidden` และประกาศจำนวนผลลัพธ์ผ่าน `aria-live="polite"`

## Response
ไม่มี finding ให้แก้ · หลัง merge จะเช็กการค้นหาชื่อบน production
