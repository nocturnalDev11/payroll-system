<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';

defineProps({
    employee: { type: Object, default: () => ({}) },
    isOpen: { type: Boolean, default: false },
});
const emit = defineEmits(['employeeUpdated', 'update:isOpen']);

const authStore = useAuthStore();
const fileInput = ref(null);
const selectedFile = ref(null);
const error = ref(null);
const isUploading = ref(false);

const previewUrl = computed(() => {
    const profilePic = authStore.employee?.profilePicture;
    if (selectedFile.value) {
        console.log('Previewing selected file:', selectedFile.value); // Debug
        return URL.createObjectURL(selectedFile.value);
    }
    return profilePic || null;
});

onMounted(() => {
    console.log('Modal mounted, fileInput:', fileInput.value); // Debug
});

const triggerUpload = () => {
    console.log('Triggering file upload, fileInput:', fileInput.value); // Debug
    if (fileInput.value) {
        fileInput.value.click();
    } else {
        console.error('File input ref is not available');
        error.value = 'File input is not available. Please try again.';
    }
};

const handleFileChange = async (event) => {
    console.log('File selected:', event.target.files); // Debug
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        error.value = 'Only JPEG/JPG/PNG images are allowed';
        selectedFile.value = null;
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        error.value = 'File size must be less than 5MB';
        selectedFile.value = null;
        return;
    }

    error.value = null;
    selectedFile.value = file;
    await uploadFile();
};

const uploadFile = async () => {
    if (!selectedFile.value) {
        error.value = 'No file selected';
        return;
    }

    console.log('Starting upload for file:', selectedFile.value); // Debug
    isUploading.value = true;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile.value);

    try {
        console.log('Auth headers:', {
            token: authStore.accessToken,
            role: authStore.userRole,
            id: authStore.employee?._id,
        }); // Debug
        const headers = {
            'Authorization': `Bearer ${authStore.accessToken}`,
            'user-role': authStore.userRole || 'employee',
            'user-id': authStore.employee?._id?.toString() || '',
        };
        const response = await fetch(`${BASE_API_URL}/api/employees/profile-picture`, {
            method: 'POST',
            headers,
            body: formData,
        });

        console.log('Upload response status:', response.status); // Debug
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Upload successful, result:', result); // Debug
        authStore.employee.profilePicture = result.profilePicture;
        authStore.saveEmployee(authStore.employee);
        selectedFile.value = null;
        error.value = null;
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'success',
            message: 'Profile picture uploaded successfully',
        });
        closeModal();
    } catch (err) {
        console.error('Upload error:', err); // Debug
        error.value = `Failed to upload profile picture: ${err.message}`;
        selectedFile.value = null;
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'error',
            message: `Failed to upload profile picture: ${err.message}`,
        });
    } finally {
        isUploading.value = false;
    }
};

const clearUpload = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${authStore.employee._id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authStore.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profilePicture: null }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to clear profile picture: ${response.statusText} - ${errorText}`);
        }

        authStore.employee.profilePicture = null;
        authStore.saveEmployee(authStore.employee);
        selectedFile.value = null;
        fileInput.value.value = '';
        error.value = null;
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'success',
            message: 'Profile picture removed successfully',
        });
        closeModal();
    } catch (err) {
        error.value = `Failed to remove profile picture: ${err.message}`;
        console.error('Clear error details:', err);
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'error',
            message: `Failed to remove profile picture: ${err.message}`,
        });
    }
};

const handleImageError = () => {
    error.value = 'Failed to load profile picture';
    selectedFile.value = null;
};

const closeModal = () => {
    emit('update:isOpen', false);
    selectedFile.value = null;
    error.value = null;
    isUploading.value = false;
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="closeModal">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-700" @click="closeModal"
                aria-label="Close modal">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
                    </path>
                </svg>
            </button>

            <header class="mb-4">
                <h2 class="text-lg font-medium text-gray-900">Profile Picture</h2>
                <p class="mt-1 text-sm text-gray-600">Update your profile picture.</p>
            </header>

            <div class="flex flex-col items-center gap-4">
                <div class="relative w-20 h-20 flex items-center justify-center overflow-hidden rounded-full cursor-pointer group"
                    @click="triggerUpload" title="Click to select a new profile picture">
                    <img v-if="previewUrl" :src="previewUrl"
                        class="w-full h-full object-cover rounded-full transition-opacity duration-300 group-hover:opacity-70"
                        alt="Profile preview" @error="handleImageError" />
                    <span v-else
                        class="flex justify-center items-center w-20 h-20 border-2 border-dotted border-gray-300 text-gray-400 rounded-full hover:bg-gray-50">
                        <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                            stroke-width="1.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="10" r="3"></circle>
                            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
                        </svg>
                    </span>
                    <div
                        class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span class="material-icons text-white text-xl">edit</span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button type="button"
                        class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none"
                        @click="triggerUpload" :disabled="isUploading">
                        <svg v-if="!isUploading" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                            stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" x2="12" y1="3" y2="15"></line>
                        </svg>
                        <svg v-else class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        {{ isUploading ? 'Uploading...' : 'Upload photo' }}
                    </button>
                    <button type="button"
                        class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-500 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                        @click="clearUpload" :disabled="!previewUrl || isUploading">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M4 7l16 0" />
                            <path d="M10 11l0 6" />
                            <path d="M14 11l0 6" />
                            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                        </svg>
                    </button>
                    <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileChange" />
                </div>

                <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
            </div>
        </div>
    </div>
</template>