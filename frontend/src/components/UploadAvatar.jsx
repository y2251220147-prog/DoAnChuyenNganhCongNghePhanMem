import { useState, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function UploadAvatar() {
    const { user, updateUserAvatar } = useContext(AuthContext);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Xử lý khi chọn file
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WEBP)');
            return;
        }

        // Kiểm tra dung lượng (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Dung lượng ảnh không được vượt quá 2MB');
            return;
        }

        // Tạo preview
        const url = URL.createObjectURL(file);
        setPreview(url);

        // Tự động upload ngay khi chọn
        uploadFile(file);
    };

    // Hàm upload file
    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        setProgress(0);

        try {
            const response = await api.post('/upload/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                // Theo dõi tiến trình upload
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            if (response.data.thanhCong) {
                // Cập nhật URL avatar mới vào context
                updateUserAvatar(response.data.duLieu.avatar);
                alert('Cập nhật ảnh đại diện thành công!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.response?.data?.thongBao || 'Lỗi khi upload ảnh');
            setPreview(null); // Reset preview nếu lỗi
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    // Xử lý Kéo & Thả (Drag & Drop)
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    };

    // Lấy URL ảnh để hiển thị
    const getAvatarUrl = () => {
        if (preview) return preview;
        if (user?.avatar) return `http://localhost:5000/${user.avatar}`;
        return null;
    };

    const avatarUrl = getAvatarUrl();
    const initials = user?.name ? user.name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() : "??";

    return (
        <div 
            className={`emp-upload-container ${dragActive ? 'emp-drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="emp-avatar-preview" />
            ) : (
                <div className="emp-profile-avatar" style={{width:100, height:100, fontSize:32}}>
                    {initials}
                </div>
            )}
            
            <div className="emp-upload-overlay">
                <span>📷</span>
            </div>

            {uploading && (
                <div className="emp-progress-container">
                    <div className="emp-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept="image/*"
            />
        </div>
    );
}
