package com.web.Instagram.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, Object> uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        try {
            return cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "instagram/posts",
                            "resource_type", "auto"
                    )
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Upload failed: " + e.getMessage(),
                    e
            );
        }
    }

    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap(
                            "resource_type",
                            "auto"
                    )
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Delete failed: " + e.getMessage(),
                    e
            );
        }
    }
}