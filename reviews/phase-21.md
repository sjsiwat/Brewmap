# Review — Phase 21: AI Finder ตีความคำขอผิด

## Round 1 — 2026-11-07
**Range:** `main..2471b9b` (`phase-21-ai-finder-filters`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`tsc --noEmit` · `eslint` · `jest` 12 suites / 67 tests · `jest:e2e` 5 suites / 69 tests · `nest build`)

### Findings
- **blocker:** ไม่มี
- **major:** ไม่มี
- **minor:**
  1. **[minor]** [`FILTER_SYSTEM`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L40) vs [`applyRequestRules`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/request-rules.ts#L110-L119) — ใน `FILTER_SYSTEM` บอกให้ใช้ `"drinkType": "Tea"` สำหรับ Thai tea แต่ใน [`applyRequestRules`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/request-rules.ts#L110-L119) เมื่อเจอ `THAI_TEA` จะตั้ง `tag = 'Thai tea'` พร้อม `delete filters.drinkType` เหมือนกับ Matcha (ซึ่งช่วยให้ได้ร้านกาแฟที่มีเมนูชาไทยด้วย แต่คำอธิบายใน system prompt ยังบอกว่า Thai tea คือ `drinkType: "Tea"`)
- **nit:**
  1. **[nit]** [`areasMentioned`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/request-rules.ts#L74-L81) — ใช้ `text.includes(word)` กับคำสั้นภาษาอังกฤษอย่าง `'cmu'` ใน `AREA_WORDS.Suthep` ซึ่งทำงานได้ถูกต้องสำหรับคำค้นทั่วไป แต่หากมีคำภาษาอังกฤษอื่นที่มี substring `cmu` ติดกันอาจ match ได้

### สิ่งที่ทำได้ดี
- แยก [`applyRequestRules`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/request-rules.ts#L89-L135) ออกมาเป็นฟังก์ชัน deterministic ที่ชัดเจน ทดสอบง่าย และทำงานหลัง [`sanitizeFilters`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L249-L306)
- จัดลำดับการผ่อนปรนตัวกรองใน [`nextRelaxation`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/ai.service.ts#L327-L339) โดยเก็บ `pinned` (`tag`, `area` ที่ผู้ใช้ระบุเองในคำค้น) ไว้ผ่อนทีหลังตัวกรองอื่น แต่ยังอยู่ก่อนชื่อร้าน `q`
- Unit tests ใน [`request-rules.spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/ai/request-rules.spec.ts#L1-L138) และ e2e tests ใน [`ai.e2e-spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/test/ai.e2e-spec.ts#L79-L140) ครอบคลุมทั้งกรณีปกติและ edge cases (ระยะทาง/เวลาที่ไม่ใช่ราคา, คาเฟ่แมว vs พาแมวไปได้, area/radius ที่ AI คิดเอง)

- minor 1 (Thai tea ใน prompt ขัดกับโค้ด): แก้แล้ว `ae3fa78` — FILTER_SYSTEM บอกว่า Matcha และ Thai tea เป็น tag ไม่ใช่ drinkType
- nit 1 (`cmu` เป็น substring): แก้แล้ว `ae3fa78` — คำภาษาอังกฤษใน AREA_WORDS ต้องตรงทั้งคำ (`\b`) · ภาษาไทยยังใช้ includes · เพิ่ม test "acmusic cafe" → ไม่มี area
- gate:server ผ่าน (unit 67 · e2e 69)
