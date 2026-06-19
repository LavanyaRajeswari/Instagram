import axios from "axios";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/users`;

const api = axios.create({
    baseURL: API_URL,
});

const getStoredUser = () => {
    try {
        return JSON.parse(
            localStorage.getItem("currentUser")
        ) || null;
    } catch {
        return null;
    }
};

export const getAuthToken = () => {
    return (
        localStorage.getItem("token") ||
        getStoredUser()?.token ||
        ""
    );
};

const getAuthHeaders = () => {
    const token = getAuthToken();

    if (!token) {
        throw new Error(
            "Authentication required. Please login again."
        );
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};

const normalizeApiError = (error) => {
    const data = error.response?.data;

    if (typeof data === "string") {
        return data;
    }

    if (data?.message) {
        return data.message;
    }

    if (data && typeof data === "object") {
        return Object.values(data).join(", ");
    }

    return (
        error.message ||
        "Something went wrong"
    );
};

const request = async (apiCall) => {
    try {
        const response = await apiCall();
        return response.data;
    } catch (error) {
        throw new Error(
            normalizeApiError(error)
        );
    }
};

export const loginUser = async (credentials) => {
    const data = await request(() =>
        api.post("/login", credentials)
    );

    if (data?.token) {
        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "currentUser",
            JSON.stringify(data)
        );
    }

    return data;
};

export const registerUser = (userData) =>
    request(() =>
        api.post("/register", userData)
    );

export const getCurrentUser = () =>
    request(() =>
        api.get("/profile", {
            headers: getAuthHeaders(),
        })
    );

export const updateProfile = (
    profileData
) =>
    request(() =>
        api.put(
            "/profile",
            {
                bio:
                    profileData.bio ?? "",
                gender:
                    profileData.gender ?? "",
            },
            {
                headers:
                    getAuthHeaders(),
            }
        )
    );

export const uploadProfilePicture = (
    file
) => {
    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    return request(() =>
        api.post(
            "/profile-picture",
            formData,
            {
                headers:
                    getAuthHeaders(),
            }
        )
    );
};

export const logoutUser = () => {
    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "currentUser"
    );
};