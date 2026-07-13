# PRD — BrewMap AI Landing Page (Production Redesign)

> ปรับจาก Brief ต้นฉบับที่เขียนไว้สำหรับ Studio/Agency ให้กลายเป็น Landing Page ของผลิตภัณฑ์จริง: **BrewMap AI** — แพลตฟอร์มค้นหาคาเฟ่ที่เน้นรสชาติ ไม่ใช่แค่ location/rating (ดูรายละเอียดผลิตภัณฑ์เต็มใน `context.md`)

## เป้าหมาย

ออกแบบ Landing Page ที่ดูมีรสนิยม มีความเป็นมนุษย์ และมี Art Direction ชัดเจน สำหรับ **BrewMap AI**

เว็บไซต์ต้องดูเหมือนผลงานจาก Digital Agency ระดับมืออาชีพที่ทำ Product จริง ไม่ใช่ Template สำเร็จรูป และต้องหลีกเลี่ยงงานออกแบบลักษณะ "AI Slop"

**กลุ่มเป้าหมายของหน้านี้** (ต่างจาก Brief ต้นฉบับที่เล็งกลุ่ม Founder/Startup ที่จะจ้างทำ SaaS — ที่นี่คือผู้ใช้จริงของ BrewMap AI):

- กลุ่มหลัก (ผู้ใช้ปลายทาง): คนรักกาแฟ, มือใหม่ specialty coffee, นักท่องเที่ยว, digital nomad, remote worker, คนรัก matcha, café hopper
- กลุ่มรอง (ฝั่งธุรกิจ): เจ้าของร้านกาแฟที่สนใจ Café Subscription (analytics, customer insights, sponsored listing)

Hero และเนื้อหาโดยรวมต้องพูดกับกลุ่มหลักเป็นหลัก ส่วน Testimonial ใช้พูดแทนกลุ่มรอง (เจ้าของร้าน) เพื่อโชว์ว่าโปรดักต์มีคุณค่าทั้งสองฝั่ง

## Technology

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide Icons
- Framer Motion — ใช้เฉพาะจุดที่จำเป็น
- Semantic HTML
- Responsive ตั้งแต่ Mobile ถึง Desktop
- **ขอบเขต: Front-end เท่านั้น** (ไม่ต้องต่อ backend/AI จริง ใช้ mock/static content)

## Art Direction

แนว **Editorial Minimalism ผสม Modern Swiss Design**

บุคลิกเว็บไซต์: มั่นใจ / เรียบง่าย / ฉลาด / ทันสมัย / ไม่พยายามมากเกินไป / มีรายละเอียดเล็ก ๆ ที่ทำให้ดู Premium

หลักการ:
- Layout มีจังหวะและลำดับสายตาชัดเจน ไม่ต้องจัดกึ่งกลางทุกอย่าง
- ใช้ Grid, Negative Space, Typography, Alignment เป็นองค์ประกอบหลัก
- โทนสีพื้นหลัง: Off-white / Warm Gray / Charcoal + Accent เพียง 1 สี — แนะนำโทน **roast/terracotta หรือ warm amber เข้ม** (สื่อถึงกาแฟแบบไม่ literal เกินไป เช่นไม่ใช้สีน้ำตาลกาแฟจ๋าแบบ stock photo) เลือกให้เข้ากับความรู้สึก "หมึกพิมพ์บนกระดาษคราฟท์" มากกว่า "ป้ายร้านกาแฟ"
- Typography ต้องมี Contrast ชัดระหว่าง Heading / Body / Label / Metadata
- ใช้ตัวอักษรขนาดใหญ่ได้ แต่ต้องมีเหตุผลด้าน Visual Hierarchy เสมอ

## สิ่งที่ห้ามทำ (Anti AI-Slop Checklist)

- Gradient สีม่วง/น้ำเงิน/ชมพูเต็มจอ
- Glassmorphism พร่ำเพรื่อ
- Card ขอบมนเหมือนกันทุก Section
- Floating Orb / Blob ตกแต่งพื้นหลัง
- Glow effect รอบทุก element
- Hero ที่มีแค่ Heading กลางจอ + ปุ่ม 2 ปุ่ม
- Grid การ์ด 3 ใบหน้าตาเหมือนกัน
- Dashboard mockup แบบ generic (ไม่ใช่ UI จริงของ BrewMap)
- คำโฆษณากว้าง ๆ ไร้ความหมาย เช่น "Revolutionize your coffee journey"
- Icon ในกล่องสี่เหลี่ยม gradient
- Animation ใส่ทุก element
- Border radius ใหญ่เกินจำเป็น
- เงาหนัก หรือใช้สี accent เกินสัดส่วน
- องค์ประกอบที่ใส่มาเพื่อเติมพื้นที่โดยไม่มีจุดประสงค์
- ทุก Section มีโครงสร้างซ้ำกัน
- ห้ามใช้ Lorem Ipsum / Placeholder text — เนื้อหาทั้งหมดต้องเป็นคำจริงของ BrewMap AI

## Page Structure

### 1. Navigation

- Logo แบบ Typography: **"BrewMap"** (ไม่ใช้ icon logo)
- เมนู: `Discover` / `Features` / `How it Works` / `About`
- ปุ่ม CTA: **"Find your café"** (แทนที่ "Start a project" ของ agency — ให้ตรงกับ action จริงของผู้ใช้ปลายทาง)
- รองรับ Mobile Menu แบบ smooth, เข้ากับ visual language โดยรวม

### 2. Hero Section

- เนื้อหาหลัก: ชื่อโปรดักต์ **BrewMap AI** + Tagline สั้นกระชับที่อธิบายแก่นของโปรดักต์ เช่น แนวทาง _"หาคาเฟ่ที่ใช่ ไม่ใช่แค่คาเฟ่ที่ใกล้"_ (เขียนจริงเป็นประโยคที่ specific ไม่ generic)
- แทนที่ "รูปมาสคอตกับ QR code Line Add" (ของ Brief เดิม) ด้วย **Visual Element ที่สื่อถึงกระบวนการคิดของ AI matching** — สร้างด้วย CSS/Typography/Grid/Line/Label/Shape เช่น:
  - รายการ label เล็ก ๆ ที่แสดง input parameters จริงของระบบ (Flavor / Atmosphere / Budget / Distance) จัดวางเป็น editorial grid
  - เส้นบาง ๆ เชื่อมโยง label เข้ากับผลลัพธ์ ("matched" state)
  - ห้ามเป็น dashboard mockup ทั่วไปหรือภาพ stock
- คำอธิบายสั้นใต้ Hero: อธิบายว่า BrewMap AI ต่างจาก Google Maps/review platform ทั่วไปอย่างไร (อิงจาก pain point ใน `context.md`)

### 3. Feature Showcase (Editorial Project Index)

แทนที่ "Demo preview" แบบ agency-portfolio ด้วย **ดัชนีฟีเจอร์หลักของ BrewMap AI** โดยแต่ละรายการต้องมี:

- ชื่อฟีเจอร์
- คำอธิบายสั้น
- ประเภท (เช่น Discovery / AI / Personalization / Community)
- สถานะ/ปี (Live 2026, Beta ฯลฯ — แทน "ปี" ของ project)
- ผลลัพธ์ที่วัดได้ (เช่น "ลดเวลาตัดสินใจจาก 25 นาที เหลือ 2 นาที" — แทน "ผลลัพธ์ทางธุรกิจ")

ฟีเจอร์ที่ควรใส่ (อิงจาก `01_my-ecommerce_project.md`): AI Coffee Finder, Smart Search, AI Review Summary, Interactive Coffee Map, Top Lists, Personalized Recommendations

จัดวางแบบ **Editorial Layout / Index** (list ที่มีจังหวะ ไม่ใช่ card grid 3 ใบเท่ากัน) — เช่น รายการเรียงแนวตั้งคั่นด้วยเส้น มี metadata จัดชิดขวา, หรือสลับความกว้าง/แนวจัดวางในแต่ละรายการ

### 4. Capability Index

ส่วนสั้นถัดจาก Feature Showcase อธิบาย **หลักการที่ AI ใช้จับคู่รสชาติ** แบบ Service Index / Capability List (ไม่ใช่ card): Coffee style, Flavor profile, Brewing method, Atmosphere, Budget, Distance, Community reviews — เขียนสั้น มีความหมาย ไม่ยืดเยื้อ

### 5. Working Process

อธิบายกระบวนการที่ผู้ใช้ (หรือ AI) ใช้จริง ตั้งแต่ปัญหาไปจนถึงผลลัพธ์ เช่น:

1. บอก AI ว่าอยากได้กาแฟแบบไหน (natural language)
2. AI วิเคราะห์ taste + atmosphere + budget + distance
3. ได้ผลลัพธ์คาเฟ่ที่ match พร้อมเหตุผลว่าทำไมถึงแนะนำ
4. ระบบเรียนรู้ preference ต่อเนื่องจากพฤติกรรมจริง

ต้องสื่อว่า BrewMap AI ไม่ได้แค่ "สวย" แต่คิดตั้งแต่ปัญหาการตัดสินใจของผู้ใช้ไปจนถึงผลลัพธ์ที่ใช้ได้จริง

### 6. Point of View

Section พักสายตา ใช้ข้อความเด่นเดี่ยว ๆ ผ่าน Typography/Composition:

> "Good products are not created by adding more. They are created by deciding what matters."

ตีความในบริบท BrewMap: การไม่เพิ่ม filter/ฟีเจอร์เรื่อยเปื่อย แต่เลือกสิ่งที่ตัดสินใจแทนผู้ใช้ได้จริง (taste-first แทน location-first)

### 7. Client Testimonial

Testimonial จาก **เจ้าของร้านกาแฟสมมติ 1 ราย** ที่ใช้ฝั่ง Café Subscription — ข้อความต้องเป็นธรรมชาติ เจาะจง ไม่ใช่คำโฆษณากว้าง ๆ (เช่น พูดถึงตัวเลขหรือพฤติกรรมลูกค้าที่เปลี่ยนไปจริง ไม่ใช่ "amazing platform, highly recommend")

### 8. Final Call to Action

ปรับจาก "private workspace" ของ agency ให้ตรงกับ BrewMap AI เช่น:

> "ยังไม่รู้จะไปกินกาแฟร้านไหนดี?"

พร้อมคำอธิบายสั้น และปุ่ม CTA ในโทนเดียวกับ "I'm here to help you" เช่น **"Let AI find your cup"**

### 9. Footer

- ชื่อโปรดักต์ (BrewMap AI)
- Email ติดต่อ
- Location (Chiang Mai — จุดเริ่มต้นตาม Vision)
- Social Links
- ปีปัจจุบัน
- ข้อความสั้นที่สะท้อนตัวตนของโปรดักต์

## Interaction Design

Micro-interaction แบบระมัดระวัง: Navigation transition, Hover state ของ feature index, Text reveal บางส่วน, Subtle layout movement, Smooth mobile menu — ต้องช่วยความเข้าใจ/ความรู้สึก ไม่ใช่โชว์เทคนิค และต้องรองรับ `prefers-reduced-motion`

## UX Requirements

Responsive ทุกขนาดจอ (ออกแบบ Mobile จริง ไม่ใช่ย่อ Desktop), Navigation ใช้งานได้จริง, Hover/Focus state ครบ, Contrast อ่านง่าย, Keyboard navigation, Heading structure ถูกต้อง, ไม่มี horizontal overflow, ไม่มีข้อความล้น container, ไม่มี element ซ้อนกันบนจอเล็ก, โหลดเร็ว, ให้น้ำหนักกับ Performance และ Accessibility

## Code Quality

- แยก Component ตามหน้าที่, ตั้งชื่อสื่อความหมาย, หลีกเลี่ยง component ใหญ่เกินไป
- ข้อมูลฟีเจอร์/testimonial ใช้ array + mapping ไม่ hardcode ซ้ำ
- ห้ามใช้ `any`
- ห้าม inline style โดยไม่มีเหตุผล
- ไม่ต้องสร้าง Design System ซับซ้อนเกินจำเป็น

## Final Verification (ก่อนจบงาน)

ตรวจสอบจริงที่ 375px (Mobile) / 768px (Tablet) / 1440px (Desktop): Responsive layout, Spacing, Typography, Contrast, Overflow, Broken interaction, Accessibility, Visual consistency, Console errors

ต้องส่งมอบเป็นเว็บไซต์ที่ใช้งานได้จริงพร้อมไฟล์ทั้งหมด ไม่ใช่แค่ mockup/แนวคิด และปิดท้ายด้วยสรุปสั้น ๆ:
- Art Direction ที่เลือกคืออะไร
- Design Decision สำคัญมีอะไรบ้าง
- หลีกเลี่ยง AI Slop อย่างไร
- ข้อจำกัด/สิ่งที่ควรพัฒนาต่อ
