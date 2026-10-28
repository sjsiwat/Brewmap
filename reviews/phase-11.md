# Review — Phase 11: หน้าค้นหา: ช่องค้นหาเดียว + filter chips

## Round 1 — 2026-10-28
**Range:** `9dc525c..00bc702` (`phase-10-finder-quick-wins..phase-11-unified-search`)
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:web` (`tsc --noEmit` → `eslint` → `next build` ผ่านทั้งหมด 182 static pages)

### Findings
1. **[nit]** [`web/lib/cafes.ts:47-78`](web/lib/cafes.ts#L47-L78) — `FilterOption`, `priceOptions`, `distanceOptions`, `parkingOptions`, และ `drinkTypeOptions` ไม่ถูกใช้งานแล้วหลังจากย้ายไปใช้ preset ใน [`web/lib/finder-filters.ts`](web/lib/finder-filters.ts)
   - เกิดเมื่อ: โค้ดเก่าจากฟอร์มตัวกรองเดิมยังค้างอยู่ใน `web/lib/cafes.ts`
   - แนะนำ: ลบ export ที่ไม่ได้ใช้ออกในเฟสถัดไปเพื่อลด dead code
2. **[nit]** [`web/components/cafe-finder.tsx:276-279`](web/components/cafe-finder.tsx#L276-L279) — `answer` (ข้อความสรุปคำถาม AI และ `reasons` รายร้าน) ถูกล้างเฉพาะตอนกด `Clear all` (`patch === null`) แต่ยังค้างอยู่เมื่อผู้ใช้พิมพ์ค้นชื่อร้านใหม่โดยตรง
   - เกิดเมื่อ: ผู้ใช้ถาม AI ได้ผลลัพธ์แล้ว จากนั้นพิมพ์ค้นหาชื่อร้านในช่องค้นหาโดยไม่ได้กด `Clear all`
   - แนะนำ: อาจล้าง `answer` เมื่อผู้ใช้เริ่มค้นด้วยชื่อร้าน (`name` ไม่ว่าง) หรือเมื่อปรับตัวกรองจนไม่ตรงกับที่ AI ตั้งไว้

### สิ่งที่ทำได้ดี (optional)
- ออกแบบ [`web/lib/finder-filters.ts`](web/lib/finder-filters.ts) และ [`FilterChips`](web/components/filter-chips.tsx#L102-L189) ให้ใช้ state เดียวกันระหว่างผู้ใช้กับ AI รองรับทั้งค่าใน preset และค่านอก preset ที่ AI ตั้งมาได้อย่างลงตัว
- จัดการ race condition ของการเรียก AI ด้วย `latestAsk` ref, ป้องกัน Enter ระหว่างพิมพ์ IME (`event.nativeEvent.isComposing`), และคง accessibility (`role="search"`, `aria-live="polite"`, native `<select>`, `sr-only` labels) ได้ครบถ้วน

## Response
Round 1 APPROVED · แก้ nit ทั้ง 2 ข้อใน `6c13975`:
1. ลบ `FilterOption` / `priceOptions` / `distanceOptions` / `parkingOptions` / `drinkTypeOptions` (และ import `CafeQuery`) ออกจาก `web/lib/cafes.ts`
2. พิมพ์ข้อความใหม่ที่ไม่ใช่คำถามเดิม → ล้าง `answer` (ข้อความของ AI + เหตุผลรายร้าน) ส่วน chips ยังอยู่ให้แก้ต่อได้

หมายเหตุ: agy รอบแรก 2 ครั้ง auto-deny คำสั่ง `git diff phase-10-finder-quick-wins...HEAD` จึงรีวิวด้วย `git diff main...HEAD` เฉพาะไฟล์ของ Phase 11
