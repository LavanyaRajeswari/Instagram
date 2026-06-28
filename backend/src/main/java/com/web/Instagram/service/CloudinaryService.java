package com.web.Instagram.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, Object> uploadFile(MultipartFile file) {
        return uploadFile(file, "instagram/posts");
    }

    public Map<String, Object> uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        try {
            return cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "auto"
                    )
            );
        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        }
    }

    public String uploadImage(MultipartFile file) {
        Map<String, Object> result = uploadFile(file, "instagram/posts");
        return result.get("secure_url").toString();
    }

    public String uploadStoryMedia(MultipartFile file) {
        Map<String, Object> result = uploadFile(file, "instagram/stories");
        return result.get("secure_url").toString();
    }

    public String getPublicId(Map<String, Object> uploadResult) {
        if (uploadResult == null || uploadResult.get("public_id") == null) {
            return null;
        }
        return uploadResult.get("public_id").toString();
    }

    public String getSecureUrl(Map<String, Object> uploadResult) {
        if (uploadResult == null || uploadResult.get("secure_url") == null) {
            throw new RuntimeException("Cloudinary secure_url missing");
        }
        return uploadResult.get("secure_url").toString();
    }

    public void deleteFile(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", "image")
            );
        } catch (Exception imageException) {
            try {
                cloudinary.uploader().destroy(
                        publicId,
                        ObjectUtils.asMap("resource_type", "video")
                );
            } catch (Exception videoException) {
                throw new RuntimeException(
                        "Delete failed: " + videoException.getMessage(),
                        videoException
                );
            }
        }
    }
}