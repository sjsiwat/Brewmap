# Review — Phase 28: เพิ่มร้าน Kneads to Dough

## Round 1 — 2026-11-07
**Range:** `main..81f3513`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` 67 passed → `test:e2e` 69 passed → `build` ผ่านทั้งหมด)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` ผ่านทั้งหมด)

### Findings
1. **[nit]** [`web/scripts/scrape-cafes/add_places.py`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/add_places.py#L30-L35) — `seen` ไม่ได้เรียก `seen.discard(None)` เหมือนใน [`build_raw_all.py`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/build_raw_all.py#L89-L90) และตอนเพิ่มร้านใหม่เข้า `seen` เพิ่มเฉพาะ `pid` โดยไม่ได้เพิ่ม `cid`
   - เกิดเมื่อ: ถ้าร้านเดิมใน `raw-all.json` มีรายการที่ไม่มี `cid` (`None` อยู่ใน `seen`) แล้วร้านใหม่ที่กำลังเพิ่มก็ไม่มี `cid` เงื่อนไข `place.get('cid') in seen` จะเป็น `True` และข้ามร้านนั้นไป (ปัจจุบันทุกร้านใน `raw-all.json` มีทั้ง `place_id` และ `cid` จึงไม่เกิดปัญหานี้)
   - แนะนำ: เพิ่ม `seen.discard(None)` หลังสร้างเซ็ต `seen` และเพิ่ม `if place.get('cid'): seen.add(place['cid'])` เมื่อ append ร้านใหม่

### สิ่งที่ทำได้ดี
- [`add_places.py`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/add_places.py#L16-L48) reuse ฟังก์ชัน `in_chiang_mai`, `in_covered_area`, `MIN_REVIEWS`, และ `slim` จาก [`build_raw_all.py`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/build_raw_all.py) โดยตรง ทำให้เกณฑ์พื้นที่ จำนวนรีวิวขั้นต่ำ และการตัดข้อมูลส่วนบุคคลของผู้รีวิวสอดคล้องกับ pipeline เดิมทุกประการ
- ต่อท้าย [`raw-all.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/raw-all.json) ที่ `#1443` โดยไม่กระทบลำดับ `index` หรือ `slug` ของร้านเดิมใน [`web/data/cafes.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/data/cafes.json) และตัดผล enrich ของร้านเก่าที่ไม่ได้อยู่ในคำขอออกจาก [`enrich3.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/enrich3.json) เพื่อรักษา scope ให้ตรงตามแผน
- เอกสารขั้นตอนการใช้งานใน [`web/scripts/scrape-cafes/README.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/scripts/scrape-cafes/README.md#L160-L176) กระชับและครบถ้วนตั้งแต่ scrape จนถึงนำเข้า server

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->

- nit 1: แก้แล้ว `abeb7a7` — `seen.discard(None)` และเพิ่ม `cid` ของร้านใหม่เข้า `seen` · รันซ้ำแล้วข้าม Kneads to Dough (already listed) ไฟล์ข้อมูลไม่เปลี่ยน
