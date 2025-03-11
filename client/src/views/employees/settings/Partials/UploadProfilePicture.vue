<!-- UploadProfilePicture.vue -->
<template>
    <div class="hs-file-upload" data-hs-file-upload='{
    "url": "/api/employees/profile-picture",
    "acceptedFiles": "image/*",
    "maxFiles": 1,
    "singleton": true
  }'>
        <div v-if="previewUrl" class="size-20" data-hs-file-upload-preview>
            <img :src="previewUrl" class="w-full object-contain rounded-full" alt="Profile preview">
        </div>

        <div class="flex flex-wrap items-center gap-3 sm:gap-5">
            <div class="group" data-hs-file-upload-previews data-hs-file-upload-pseudo-trigger>
                <span v-if="!previewUrl"
                    class="flex shrink-0 justify-center items-center size-20 border-2 border-dotted border-gray-300 text-gray-400 cursor-pointer rounded-full hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-700/50">
                    <svg class="shrink-0 size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="10" r="3"></circle>
                        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
                    </svg>
                </span>
            </div>

            <div class="grow">
                <div class="flex items-center gap-x-2">
                    <button type="button"
                        class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
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
                        Delete
                    </button>
                    <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileChange">
                </div>
                <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store.ts';
import { BASE_API_URL } from '@/utils/constants.ts';

const authStore = useAuthStore();
const fileInput = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(authStore.employee?.profilePicture || null);
const error = ref(null);

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
    previewUrl.value = URL.createObjectURL(file);
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
            throw new Error('Upload failed');
        }

        const result = await response.json();
        previewUrl.value = result.profilePicture;
        authStore.employee.profilePicture = result.profilePicture;
        authStore.saveEmployee();
        error.value = null;
    } catch (err) {
        error.value = 'Failed to upload profile picture';
        previewUrl.value = authStore.employee?.profilePicture || null;
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

        if (!response.ok) throw new Error('Failed to clear profile picture');

        previewUrl.value = null;
        selectedFile.value = null;
        authStore.employee.profilePicture = null;
        authStore.saveEmployee();
        fileInput.value.value = '';
    } catch (err) {
        error.value = 'Failed to remove profile picture';
    }
};
</script>