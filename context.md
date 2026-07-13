# Context: จาก week02/first-meet-dbs/03_my_ecommerce_project

สรุปโปรเจกต์ก่อนหน้า (week02) เพื่อใช้เป็นจุดเริ่มต้นของ week03/vibecode-myecommerce

## โปรเจกต์คืออะไร — BrewMap AI

แพลตฟอร์มค้นหาคาเฟ่ที่เน้น **รสชาติ** เป็นหลัก แทนที่จะเน้นแค่ location/rating เหมือนแพลตฟอร์มทั่วไป (เช่น Google Maps)

- **Pain point**: คนใช้เวลา 20-30 นาทีอ่านรีวิวก่อนตัดสินใจ เพราะแพลตฟอร์มปัจจุบันตอบไม่ได้ว่า "ร้านไหนลาเต้อร่อย", "ร้านไหนเงียบพอทำงาน", "ร้านไหนมีที่จอดรถ" ฯลฯ
- **แนวทางแก้**: ถามผู้ใช้ว่า "วันนี้อยากดื่มกาแฟแบบไหน" แล้วให้ AI แนะนำร้านตาม coffee style, flavor profile, brewing method, atmosphere, budget, distance, community reviews
- **กลุ่มเป้าหมาย**: คนรักกาแฟ, มือใหม่ specialty coffee, นักท่องเที่ยว, digital nomad, remote worker, คนรัก matcha, café hopper
- **Core features**: Interactive Coffee Map, Coffee Categories, Top Lists (Top 10 Latte/Pour Over/Matcha ฯลฯ), AI Coffee Finder (natural language), Smart Search, Favorites, AI Review Summary (สรุปรีวิวแทนอ่านเป็นพันรีวิว), Café Details page, Personalized Recommendations
- **Business model**: Sponsored Listings, Café Subscription (dashboard + analytics), Affiliate (เมล็ดกาแฟ/อุปกรณ์), Events (เทศกาลกาแฟ/workshop)
- **Vision**: เริ่มที่เชียงใหม่ → ขยายทั่วไทย → เป็น "Spotify for Coffee"

รายละเอียดเต็มอยู่ที่ `week02/first-meet-dbs/03_my_ecommerce_project/01_my-ecommerce_project.md`

## งานที่ทำไปแล้วใน week02 (เน้นเรียนรู้เรื่อง database)

เป็นโปรเจกต์แบบฝึกหัดชื่อ **johnycoffee-db** (ร้านกาแฟสมมติ) เพื่อฝึกออกแบบ schema และเขียน query จริงบน MongoDB โดยไม่ได้ผูกกับ BrewMap AI โดยตรง — เป็นการฝึกพื้นฐานก่อน

### Diagrams (excalidraw)
- `02_business-model-canvas.excalidraw` — business model canvas
- `03_use-case-diagram.excalidraw` — use case diagram
- `04_er-diagram.excalidraw` — ER diagram

### MongoDB Schema (3 collections หลัก)
1. **users** (`05_mongodb-schema_users.json`) — `username, firstName, lastName, email, password, profileImage, role (customer/owner), create_at`
2. **menus** (`06_mongodb-schema_menus.json`) — `shop_id, name, price` (เมนูร้าน shop001: hot/ice americano, espresso shot, ice espresso thai style, pure matcha, ice matcha latte)
3. **orders** (`07_mongodb-schema_orders.json`) — `user_id, shop_id, items[] (menu_id, name, price, quantity, subtotal), total_price, payment_method, status, created_at`

### Query scripts (`johnycoffee-db/*.mongodb.js`)
ไฟล์ทดสอบ query จริงบน MongoDB Playground ครอบคลุม `insertMany, find, findOne, deleteOne/Many, updateOne/Many, $set, $gte` — ใช้กับ 3 collection ข้างบน

### เอกสารเปรียบเทียบ DB (`dbs-comparison.md`)
สรุปเทียบ MongoDB (`find()` vs `aggregate()`) กับ PostgreSQL (SQL `SELECT` ทั้งแบบง่ายและ advanced) พร้อมตาราง mapping concept เช่น `$match` ↔ `WHERE`, `$group` ↔ `GROUP BY`, `$lookup` ↔ `JOIN`

## สถานะปัจจุบัน
โฟลเดอร์นี้เป็นงานฝึกหัดสัปดาห์ที่ 2 (schema design + query practice) ยังไม่มีการ implement แอปจริง (ไม่มีโค้ด backend/frontend) — เหมาะเป็น reference สำหรับออกแบบ data model ตอนเริ่มสร้าง vibecode-myecommerce ใน week03
