# ✦ M 7 Builder — بوت إعادة البناء ولوحة التحكم

نسخة موسّعة من بوت M 7: **كل الأنظمة السابقة** (ترحيب، تذاكر، إدارة، سجلات، قوانين ورتب، معلومات)
+ **إعادة بناء السيرفر** + **لوحة تحكم بأزرار** + **وضع الصيانة**.

> ⚠️ شغّل بوتاً واحداً فقط من الاثنين (القديم أو هذا) في نفس السيرفر، وإلا سيردّ البوتان على نفس الأزرار.
> هذا البوت يشمل كل شيء، فيمكنه استبدال البوت الأول بالكامل (يمكنك استخدام توكن جديد أو نفس التوكن).

## التشغيل
```bash
npm install
cp .env.example .env    # DISCORD_TOKEN + CLIENT_ID (+ GUILD_ID اختياري)
npm start
```
Developer Portal: فعّل **Server Members Intent** و **Message Content Intent**،
وادعُ البوت بصلاحية **Administrator** (مطلوبة لإعادة البناء)، ويفضّل أن تكون رتبته من الأعلى.

## الأوامر الجديدة (Administrator)
| الأمر | الوظيفة |
|---|---|
| `/rebuild [reset_roles] [assign_members]` | حذف كل الرومات (والرتب) وبناء هيكلة M 7 كاملة + الأنظمة + اللوحات |
| `/control` | إرسال لوحة التحكم في الروم الحالي |
| `/maintenance on / off` | تفعيل / إنهاء وضع الصيانة |
| `/maintenance roles` | تحديد رتب الإدارة التي تظل ترى الرومات أثناء الصيانة |

### حمايات `/rebuild`
1. نسخة احتياطية JSON تُرسل لك في الخاص وتُحفظ في `backups/` قبل أي حذف.
2. رسالة تحذير + زر متابعة + كتابة كلمة **تأكيد الحذف** في نافذة.
3. قفل يمنع تشغيل عمليتين معاً. فقط صاحب الأمر يقدر يضغط الأزرار.
4. رومات Community المطلوبة من ديسكورد (rules/updates) لا يمكن حذفها، تُذكر في التقرير.

## ماذا ينشئ `/rebuild`؟
- **الرتب:** 👑 المالك، 🛡️ الإدارة، ⚔️ مشرف، 🎧 الدعم الفني، 💎 VIP، 🖤 M7 Member، 🌑 زائر + رتب اختيارية (Gamer/Artist/Music).
- **الأقسام:** البوابة، معلومات، عام، الدعم، التذاكر، الصوتيات، VIP، الإدارة (24 روم).
- **الأنظمة:** الترحيب (يعطي «زائر»)، القوانين (زر الموافقة يعطي «M7 Member» ويشيل «زائر»)، التذاكر، السجلات، رتب الأزرار، لوحة التحكم.
- المالك يأخذ رتبة المالك، ومن شغّل الأمر يأخذ رتبة الإدارة، والباقي M7 Member.
- لتعديل أي اسم أو روم أو رتبة: `src/config/structure.js`.

## وضع الصيانة 🔧
- من زر **وضع الصيانة** في روم `لوحة-التحكم` أو `/maintenance on`.
- يخفي **كل** الرومات عن غير الإدارة، وينشئ روم **『🔧』صيانة** (قراءة فقط) في أعلى القائمة.
- يحفظ الصلاحيات الأصلية لكل روم ويرجعها بالضبط عند الإنهاء، ثم يحذف روم الصيانة.
- يظل يرى: رتب `staffRoles` (المالك/الإدارة/مشرف) + أي رتبة فيها Administrator.

## أزرار لوحة التحكم
🔧 صيانة • 📢 إعلان (نافذة عنوان + نص) • 📊 الحالة • 💾 نسخة احتياطية • 🔄 تحديث


---

# 🚀 الرفع على GitHub والاستضافة

## 1) الرفع على GitHub
```bash
git init
git add .
git commit -m "M 7 Builder bot"
git branch -M main
git remote add origin https://github.com/USERNAME/m7-builder.git
git push -u origin main
```
- ملف `.env` و `data/` و `backups/` **مُستثناة** تلقائياً في `.gitignore`. لا تضع التوكن في الكود أبداً.
- إذا ظهر التوكن بالخطأ في GitHub: اذهب للـ Developer Portal واضغط **Reset Token** فوراً.
- يوجد Workflow جاهز (`.github/workflows/ci.yml`) يفحص المشروع تلقائياً عند كل Push (`npm run check`).

## 2) المتغيرات (Environment Variables) في الاستضافة
| المتغير | ملاحظات |
|---|---|
| `DISCORD_TOKEN` | **مطلوب** |
| `CLIENT_ID` | **مطلوب** |
| `GUILD_ID` | اختياري (تسجيل فوري للأوامر) |
| `DATA_DIR` | مسار مجلد **دائم** (مثلاً `/data`) لحفظ التحذيرات والتذاكر والصيانة والنسخ الاحتياطية |
| `PORT` | تضعه الاستضافة؛ يفتح Health-check بسيط |

> ⚠️ بدون مجلد دائم (`DATA_DIR` على Volume) ستضيع البيانات عند كل إعادة نشر في الاستضافات التي تمسح الملفات.

## 3) طرق الاستضافة
**أ) استضافة بوتات / لوحة Pterodactyl (مثل bot-hosting وأشباهها):** ارفع الملفات (أو اربط الريبو)، ملف البدء `src/index.js`، الأمر `npm install && npm start`، وضع المتغيرات من لوحة Environment/Startup.

**ب) Railway / Koyeb / Render:** New Project ← Deploy from GitHub ← اختر الريبو.
- يكتشف `Dockerfile` تلقائياً (أو Start Command: `npm start`).
- أضف المتغيرات، وأضف **Volume** مربوطاً بـ `/data` مع `DATA_DIR=/data`.
- على Render استخدم نوع **Background Worker** (أو Web Service مع `PORT`).

**ج) VPS (Ubuntu) مع pm2:**
```bash
git clone https://github.com/USERNAME/m7-builder.git && cd m7-builder
npm ci --omit=dev
cp .env.example .env && nano .env
npm i -g pm2
pm2 start ecosystem.config.js && pm2 save && pm2 startup
# تحديث لاحقاً:  git pull && npm ci --omit=dev && pm2 restart m7-bot
```

**د) Docker:**
```bash
docker build -t m7-builder .
docker run -d --name m7 --restart unless-stopped --env-file .env -v m7data:/data m7-builder
```

## 4) أوامر مفيدة
```bash
npm run check    # فحص المشروع بدون توكن
npm run deploy   # تسجيل الأوامر يدوياً
```
