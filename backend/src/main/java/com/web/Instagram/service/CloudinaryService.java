package com.web.Instagram.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, Object> uploadFile(
            MultipartFile file
    ) {

        try {

            return cloudinary
                    .uploader()
                    .upload(
                            file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder",
                                    "instagram/profile-pictures",
                                    "resource_type",
                                    "image"
                            )
                    );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Image upload failed",
                    e
            );
        }
    }

    public void deleteFile(
            String publicId
    ) {

        if (
                publicId == null ||
                        publicId.isBlank()
        ) {
            return;
        }

        try {

            Map result =
                    cloudinary
                            .uploader()
                            .destroy(
                                    publicId,
                                    ObjectUtils.asMap(
                                            "resource_type",
                                            "image"
                                    )
                            );

            System.out.println(
                    "Cloudinary Delete Result: "
                            + result
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Delete failed: "
                            + e.getMessage(),
                    e
            );
        }
    }
}