<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { BASE_API_URL } from '@/utils/constants';

const authStore = useAuthStore();
const fileInput = ref(null);
const selectedFile = ref(null);
const error = ref(null);

const previewUrl = computed(() => {
    const profilePic = authStore.employee?.profilePicture;
    if (selectedFile.value) {
        return URL.createObjectURL(selectedFile.value);
    }
    return profilePic ? `${BASE_API_URL}${profilePic}` : null;
});

const triggerUpload = () => {
    fileInput.value.click();
};

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        error.value = 'Only JPEG/JPG/PNG images are allowed';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        error.value = 'File size must be less than 5MB';
        return;
    }

    selectedFile.value = file;
    await uploadFile();
};

const uploadFile = async () => {
    if (!selectedFile.value) return;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile.value);

    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authStore.accessToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        authStore.employee.profilePicture = result.profilePicture;
        authStore.saveEmployee();
        selectedFile.value = null;
        error.value = null;
    } catch (err) {
        error.value = `Failed to upload profile picture: ${err.message}`;
        selectedFile.value = null;
        console.error('Upload error details:', err);
    }
};

const clearUpload = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${authStore.employee.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authStore.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profilePicture: null })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to clear profile picture: ${response.statusText} - ${errorText}`);
        }

        authStore.employee.profilePicture = null;
        authStore.saveEmployee();
        selectedFile.value = null;
        fileInput.value.value = '';
        error.value = null;
    } catch (err) {
        error.value = `Failed to remove profile picture: ${err.message}`;
        console.error('Clear error details:', err);
    }
};

const handleImageError = () => {
    error.value = 'Failed to load profile picture';
    previewUrl.value = null;
};

watch(() => authStore.employee, () => {
    if (!selectedFile.value) {
        previewUrl.value = authStore.employee?.profilePicture ? `${BASE_API_URL}${authStore.employee.profilePicture}` : null;
    }
}, { deep: true });
</script>

<template>
    <header class="pb-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            Profile Picture
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your profile picture.
        </p>
    </header>
    <form @submit.prevent="uploadFile">
        <div class="hs-file-upload" data-hs-file-upload='{
            "url": "/api/employees/profile-picture",
            "acceptedFiles": "image/*",
            "maxFiles": 1,
            "singleton": true
        }'>
            <div class="flex flex-wrap items-center gap-3 sm:gap-5">
                <div class="flex-shrink-0">
                    <div v-if="previewUrl" class="size-20 flex items-center justify-center overflow-hidden">
                        <img :src="previewUrl" class="w-full h-full object-cover rounded-full" alt="Profile preview"
                            @error="handleImageError">
                    </div>
                    <span v-else
                        class="flex justify-center items-center size-20 border-2 border-dotted border-gray-300 text-gray-400 cursor-pointer rounded-full hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-700/50"
                        @click="triggerUpload">
                        <svg class="shrink-0 size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="10" r="3"></circle>
                            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
                        </svg>
                    </span>
                </div>

                <!-- Buttons and Error Message -->
                <div class="grow">
                    <div class="flex items-center gap-x-2">
                        <button type="button"
                            class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none"
                            @click="triggerUpload">
                            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" x2="12" y1="3" y2="15"></line>
                            </svg>
                            Upload photo
                        </button>
                        <button type="button"
                            class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-500 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                            @click="clearUpload" :disabled="!previewUrl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"
                                class="shrink-0 size-4 icon icon-tabler icons-tabler-outline icon-tabler-trash">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M4 7l16 0" />
                                <path d="M10 11l0 6" />
                                <path d="M14 11l0 6" />
                                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                            </svg>
                        </button>
                        <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileChange">
                    </div>
                    <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
                </div>
            </div>
            <div class="flex justify-end">
                <button type="submit"
                    class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    Update Photo
                </button>
            </div>
        </div>
    </form>
</template>