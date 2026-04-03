# Rogue Survival Tactics

Prototype game web 2D kết hợp roguelike, sinh tồn, chiến thuật thời gian thực mini, fog of war, AI thích nghi và vòng lặp nâng cấp tại căn cứ.

## Tổng quan

Bạn điều khiển một chiến binh trong bản đồ sinh ngẫu nhiên, vừa thu thập tài nguyên, dựng phòng thủ, nâng cấp nhân vật, vừa hoàn thành quest nhánh để kích hoạt boss cuối.

Core loop:

1. Khám phá và thu thập tài nguyên
2. Xây dựng và phòng thủ căn cứ
3. Chọn nhánh quest (Scavenger / Defender / Hunter)
4. Nâng cấp tại base và giao dịch relic
5. Đối đầu Night Warden

## Chạy dự án

Yêu cầu: Node.js 20+.

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

## Điều khiển

- `WASD` hoặc phím mũi tên: di chuyển
- `Space`: bắn
- `Shift`: chạy nhanh (tiêu hao stamina)
- `F`: nhặt tài nguyên gần người
- `K`: đặt tường
- `L`: đặt tháp
- `R`: craft và dùng medkit (khi gần base)
- `Q`: mở bảng quest (khi gần base)
- `B`: mở bảng upgrade bench (khi gần base)
- `V`: mở bảng merchant/relic trade (khi gần base)
- `M`: lưu tiến trình thủ công
- `N`: tạo ván mới và xóa save hiện tại
- `Esc`: đóng overlay

## Hệ thống chính

- Procedural map generation
- Fog of war + minimap theo vùng đã khám phá
- Day/night cycle + weather (`clear`, `fog`, `storm`)
- AI kẻ địch thích nghi theo lối chơi người dùng
- Hệ thống tài nguyên và crafting
- Hệ thống xây dựng phòng thủ (`wall`, `turret`, `beacon`)
- Quest nhánh với phần thưởng theo phong cách chơi
- Boss Night Warden nhiều phase
- Biome ảnh hưởng spawn/loot
- Upgrade bench (HP, damage, stamina)
- Merchant trao đổi bằng `relic`
- Save/load local tự động + thủ công

## Cấu trúc mã nguồn

- `src/main.ts`: game loop, systems, rendering, UI interactions
- `src/style.css`: giao diện HUD/overlay
- `index.html`: entry web app

## Trạng thái hiện tại

Đây là bản prototype hoàn chỉnh cho mục tiêu môn học nâng cao, ưu tiên thể hiện hệ thống gameplay và kiến trúc mở rộng.
