# Rogue Survival Tactics

Prototype game web 2D kết hợp roguelike, sinh tồn, chiến thuật mini, fog of war và AI thích nghi.

## Chạy dự án

```bash
npm install
npm run dev
```

## Điều khiển

- `WASD` hoặc phím mũi tên: di chuyển
- `Space`: bắn
- `K`: đặt tường ở ô trước mặt
- `L`: đặt tháp ở ô trước mặt
- `R`: craft medkit nếu đứng gần căn cứ
- `F`: nhặt tài nguyên quanh người chơi
- `Shift`: chạy nhanh
- `M`: lưu tiến trình
- `N`: tạo ván mới và xóa save hiện tại
- `Q`: mở bảng quest khi đứng gần căn cứ
- `B`: mở bảng nâng cấp khi đứng gần căn cứ

## Hệ thống hiện có

- Bản đồ sinh ngẫu nhiên với fog of war
- AI địch thích nghi theo cách người chơi đánh và xây dựng
- Chu kỳ ngày đêm, thời tiết, sinh tồn, crafting và phòng thủ căn cứ
- Minimap theo dõi vùng đã khám phá và vị trí kẻ địch/tài nguyên
- Tài nguyên có respawn để duy trì vòng lặp chơi dài hơn
- Tự động lưu trạng thái và khôi phục khi mở lại game
- Quest nhánh Scavenger / Defender / Hunter với thưởng khác nhau
- Boss cuối Night Warden xuất hiện sau khi hoàn thành quest và beacon
- Biome khác nhau ảnh hưởng đến loot và kiểu địch
- Upgrade bench để tăng HP, damage và stamina
- Stamina ảnh hưởng trực tiếp đến tốc độ chạy nhanh

## Mục tiêu prototype

- Sinh bản đồ ngẫu nhiên
- Có fog of war
- Có day/night và weather
- Có AI địch thích nghi theo phong cách chơi
- Có tài nguyên, crafting, phòng thủ căn cứ
- Có hệ thống nhiệm vụ chính
