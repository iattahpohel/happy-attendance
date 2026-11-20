# 🌱 Happy Attendance

> Mỗi ngày đi làm, một niềm vui nhỏ. **Show up. Grow up. Feel good.**

Ứng dụng chấm công theo hướng **Gamification + Emotional Reward**. Phần thưởng dựa trên hành trình của từng người, không so sánh giữa mọi người và không có bảng xếp hạng.

| | |
|---|---|
| Backend | NestJS 11 · Prisma 6 · PostgreSQL · JWT · @nestjs/schedule (cron) · event-emitter |
| Frontend | Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · TanStack Query · Framer Motion |
| Push | Thông báo trong app; FCM nếu cấu hình `FIREBASE_SERVICE_ACCOUNT` |

## Chạy local

```bash
pnpm install
pnpm db:up                                  # PostgreSQL 16 qua docker (cổng 5433)
cp apps/api/.env.example apps/api/.env      # nếu chưa có
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate                             # tạo schema
pnpm db:seed                                # ⚠️ XOÁ dữ liệu cũ, tạo ~3,5 tháng dữ liệu demo
pnpm dev                                    # API :4000/api · Web :3000
```

Tài khoản demo (mật khẩu `happy123`):
- `an@happy.local`: nhân viên. Hôm nay **chưa check-in** để bạn tự thử.
- `ha@happy.local`: admin (HR).
- `giang@happy.local`: làm bán thời gian T2/T4/T6. Vẫn có thể đạt "Một tháng trọn vẹn" với lịch ngắn hơn.
- `dung@happy.local`: ốm dài ngày ở tháng 9, sau đó quay lại và nhận 🌈 Comeback Star.

## Các màn hình

| Màn hình | Nội dung |
|---|---|
| **Home** | Bầu trời đổi theo buổi (bình minh → ban ngày → đêm), nhân vật đổi biểu cảm, nút check-in/out kèm confetti + âm thanh (tắt được), lời chúc ngẫu nhiên, vòng tiến độ tháng, chuỗi đều đặn, cấp/XP, khu vườn, sự kiện tháng |
| **Hành trình** | Lịch tháng (🌼 hoàn thành, 🌴 nghỉ phép, 🎉 lễ), chi tiết giờ vào/ra, xin nghỉ phép |
| **Thành tựu** | Thành tựu + tiến độ, danh hiệu theo tháng, bộ sưu tập vật phẩm (trang phục, nền, trang trí vườn, sticker) để trang bị |
| **Wrapped** | Story kiểu Spotify Wrapped, so sánh với chính mình tháng trước, thiệp lời cảm ơn, xuất ảnh PNG, lịch sử các tháng |
| **Cộng đồng** | World Boss / sự kiện tháng, nhiệm vụ cộng đồng, bản đồ thế giới chung, Appreciation Wall, Vinh danh theo danh hiệu |
| **Quản trị** | Tổng quan ngày, nhân viên/team, lịch làm việc, nghỉ phép, ngày lễ, sự kiện (chủ đề, độ khó, tính lại), chốt tháng, quy tắc thành tựu |

## Nguyên tắc thiết kế (được thực thi trong code)

- **Mục tiêu theo lịch được giao**: `ScheduleService.monthPlan` trừ ngày lễ, nghỉ phép đã duyệt và những ngày trước khi gia nhập. Người có lịch 22 ngày và người có lịch 12 ngày đều có thể đạt 🌻.
- **Không phạt khi nghỉ**: nghỉ phép, lễ, cuối tuần không làm đứt chuỗi. Ngày trống hiển thị "Chưa ghi nhận" (màu trung tính, không dùng màu đỏ). Ai quên check-out sẽ được tự động check-out lúc 23:50.
- **Không thưởng cho việc làm thêm**: check-in ngoài lịch không nhận XP và không cộng năng lượng.
- **Không có bảng xếp hạng**: đóng góp cá nhân cho sự kiện chỉ chủ nhân thấy. Vinh danh nhóm theo danh hiệu và sắp xếp theo tên.
- **Lời cảm ơn luôn chân thành**: chỉ 3 lời cảm ơn đầu tiên mỗi ngày được tính điểm.

## ⚔️ Company World Boss: sự kiện cộng đồng hàng tháng

Mỗi tháng có một chủ đề, xoay vòng tự động hoặc do admin chọn: 🐉 đánh boss → 🌳 trồng cây → ⛵ thám hiểm… Cơ chế giống nhau: cả công ty cùng góp năng lượng.

| Hành động | Năng lượng |
|---|---|
| Hoàn thành một ngày làm việc theo lịch | +10 |
| Gửi lời cảm ơn (tối đa 3/ngày) | +3 |
| Mở khóa thành tựu | +15 |
| Hoàn thành nhiệm vụ cộng đồng | +10 – 20 |

**Mục tiêu tự co giãn theo quy mô công ty** (`CommunityEventsService.computeTarget`):

```
expected = Σ(ngày làm việc theo lịch của mọi người) × 10
         + số người × (4 lời cảm ơn × 3 + 1 thành tựu × 15 + 50% tổng điểm nhiệm vụ)
target   = expected × độ khó          (EVENT_DIFFICULTY, mặc định 0.85)
```

Mục tiêu được tính lại khi thêm hoặc ngưng nhân viên, đổi lịch, thêm ngày lễ hoặc duyệt nghỉ phép. Công thức được lưu kèm sự kiện và hiển thị cho mọi người ("cách tính").
Khi về đích: một khu vực mới trên bản đồ được mở khóa, **mọi nhân viên** nhận vật phẩm kỷ niệm, người đã góp sức nhận 🛡️ Người bảo vệ thế giới. Hết tháng mà chưa đạt thì sự kiện chuyển sang trạng thái `ENDED`, kèm lời nhắn nhẹ nhàng.

## Danh hiệu hàng tháng (trao lúc chốt tháng, 00:05 ngày 1)

| | Điều kiện |
|---|---|
| 🏆 Perfect Month | hoàn thành 100% lịch |
| 🌻 Steady Star | ≥ 90% lịch và đi muộn ≤ 2 ngày |
| 🌱 Growth Mindset | tỉ lệ hoàn thành tăng ≥ 10 điểm %, hoặc giảm ngày đi muộn so với tháng trước |
| 🌈 Comeback Star | tháng trước < 70% hoặc nghỉ ≥ 5 ngày, tháng này ≥ 85% |
| ☀️ Positive Energy | gửi ≥ 3 lời cảm ơn |
| 💚 Reliable Partner | nhận ≥ 3 lời cảm ơn |

## Cấu trúc

```
apps/api/src
  attendance/          check-in/out, lịch tháng, chuỗi, tự check-out
  schedule/            lịch làm việc, ngày lễ, nghỉ phép
  gamification/        XP, cấp, khu vườn, thành tựu
  community-events/    World Boss: chủ đề, mục tiêu, đóng góp, nhiệm vụ, khu vực
  monthly-summary/     Monthly Wrapped, danh hiệu, chốt tháng
  recognition/         Appreciation Wall, vinh danh, bảng tin
  items/ notifications/ users/ auth/ admin/ home/ jobs/ (cron)
  seed.ts              mô phỏng dữ liệu bằng chính các service
apps/web/src
  app/(app)/           các trang chính · components/ nhân vật, bầu trời, khu vườn…
```

Múi giờ dùng để xác định "ngày làm việc", giờ đi muộn và cron được cấu hình bằng `APP_TZ` (mặc định `Asia/Ho_Chi_Minh`). Số phút được phép trễ: `LATE_GRACE_MINUTES` (mặc định 10).

## Ghi chú cho production

- JWT đang lưu ở `localStorage`. Nên chuyển sang cookie httpOnly khi triển khai thật.
- Danh sách ngày lễ trong seed là ước lượng cho năm 2026. Hãy cập nhật trong màn hình Quản trị.
- Web push (FCM phía trình duyệt) chưa gắn ở frontend. Backend đã có `POST /api/notifications/devices` để đăng ký token.
- Hoạt hình hiện dùng SVG + Framer Motion. Có thể thay nhân vật bằng Lottie/Rive mà không đổi API.
