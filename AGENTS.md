# Quy định dự án — LOCAL ONLY

Theo yêu cầu trực tiếp của người dùng ngày 27-09-2026:

- Dự án này chỉ phát triển, kiểm thử và chạy local trên máy người dùng.
- CẤM dùng Sites / ChatGPT Sites để tạo site, preview được host, upload source, lưu phiên bản hoặc deploy dự án.
- Không tự ý đưa dự án lên bất kỳ dịch vụ hosting nào khác. Yêu cầu “triển khai web” trong dự án này là triển khai chạy local, không phải xuất bản online.
- Không tạo lại `.openai/hosting.json` hay cấu hình tự động publish.
- Chỉ được thao tác với bản Sites đã tạo nhầm để gỡ/xóa nó theo yêu cầu người dùng; không xuất bản nội dung thay thế.
- Giữ nguyên mã nguồn local và thiết kế Figma. Chỉ thay đổi quy định này khi người dùng yêu cầu rõ ràng.
- Fintech Roy: chạy `npm run dev` trong `fintech-roy`, mở http://127.0.0.1:3112.

## Ngoại lệ được người dùng cho phép — 27-09-2026

Người dùng yêu cầu “cho lên website roylle nhé”: được phép đăng Roy Fintech trên website Roylle hiện có, https://roylle.github.io/fintech-roy/, qua GitHub Pages. Quy định CẤM Sites vẫn giữ nguyên. Không tự đăng sang nền tảng khác.
