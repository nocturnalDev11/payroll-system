<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import Modal from '@/components/Modal.vue';

defineProps({ employee: { type: Object, default: () => ({}) } });
const emit = defineEmits(['employeeUpdated']);

const authStore = useAuthStore();
const fileInput = ref(null);
const selectedFile = ref(null);
const error = ref(null);
const showDeleteModal = ref(false);

const confirmDelete = () => {
    showDeleteModal.value = true;
};

const previewUrl = computed(() => {
    const profilePic = authStore.employee?.profilePicture;
    if (selectedFile.value) {
        return URL.createObjectURL(selectedFile.value);
    }
    return profilePic || null;
});

const triggerUpload = () => fileInput.value?.click();

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
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
};

const uploadFile = async () => {
    if (!selectedFile.value) {
        triggerUpload();
        return;
    }
    const formData = new FormData();
    formData.append('profilePicture', selectedFile.value);
    try {
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
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }
        const result = await response.json();
        authStore.employee.profilePicture = result.profilePicture;
        authStore.saveEmployee(authStore.employee);
        selectedFile.value = null;
        error.value = null;
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'success',
            message: 'Profile picture uploaded successfully'
        });
    } catch (err) {
        error.value = `Failed to upload profile picture: ${err.message}`;
        selectedFile.value = null;
        console.error('Upload error details:', err);
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'error',
            message: `Failed to upload profile picture: ${err.message}`
        });
    }
};

const clearUpload = async () => {
    showDeleteModal.value = false;

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
            message: 'Profile picture removed successfully'
        });
    } catch (err) {
        error.value = `Failed to remove profile picture: ${err.message}`;
        console.error('Clear error details:', err);
        emit('employeeUpdated', {
            employee: authStore.employee,
            status: 'error',
            message: `Failed to remove profile picture: ${err.message}`
        });
    }
};

const handleImageError = () => {
    error.value = 'Failed to load profile picture';
    selectedFile.value = null;
};
</script>

<template>
    <div class="max-w-3xl">
        <header class="pb-6">
            <h2 class="text-lg font-medium text-gray-900">Profile Picture</h2>
            <p class="mt-1 text-sm text-gray-600">Update your profile picture.</p>
        </header>

        <form @submit.prevent="uploadFile">
            <div>
                <div class="flex flex-wrap items-center gap-3 sm:gap-5">
                    <div class="flex-shrink-0">
                        <div v-if="previewUrl"
                            class="relative size-20 flex items-center justify-center overflow-hidden rounded-full cursor-pointer group"
                            @click="triggerUpload">
                            <img :src="previewUrl"
                                class="w-full h-full object-cover rounded-full transition-opacity duration-300 group-hover:opacity-70"
                                alt="Profile preview" @error="handleImageError" />
                            <div
                                class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span class="material-icons text-white size-5">edit</span>
                            </div>
                        </div>
                        <span v-else
                            class="flex justify-center items-center size-20 border-2 border-dotted border-gray-300 text-gray-400 cursor-pointer rounded-full hover:bg-gray-50"
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
                    <div class="grow">
                        <div class="flex items-center gap-x-2">
                            <button type="submit"
                                class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none cursor-pointer">
                                <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" x2="12" y1="3" y2="15"></line>
                                </svg>
                                Upload photo
                            </button>

                            <!-- Delete button -->
                            <button type="button"
                                class="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-500 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                @click="confirmDelete" :disabled="!previewUrl">
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

                            <input ref="fileInput" type="file" class="hidden" accept="image/*"
                                @change="handleFileChange" />
                        </div>
                        <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
                    </div>
                </div>
            </div>

            <Modal :show="showDeleteModal" @close="showDeleteModal = false">
                <div class="p-6">
                    <h2 class="text-lg font-semibold text-gray-900">Delete Profile Picture</h2>
                    <p class="mt-2 text-sm text-gray-600">Are you sure you want to remove your profile picture? This
                        action cannot be undone.</p>
                    <div class="mt-6 flex justify-end gap-3">
                        <button @click="showDeleteModal = false"
                            class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer">
                            Cancel
                        </button>
                        <button @click="clearUpload"
                            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer">
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </form>
    </div>
</template>
