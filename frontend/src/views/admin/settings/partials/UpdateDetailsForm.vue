<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import TextInput from '@/components/TextInput.vue';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';

const props = defineProps(['admin']);
const emit = defineEmits(['admin-updated']);

const authStore = useAuthStore();

const form = ref({
    name: '',
    username: '',
    email: '',
});

const isUpdating = ref(false);
const updateMessage = ref('');
const successMessage = ref('');
const emailError = ref('');
const usernameError = ref('');
const nameError = ref('');

// Populate form with admin data when prop changes
watch(() => props.admin, (admin) => {
    if (admin) {
        form.value = {
            name: admin.name || '',
            username: admin.username || '',
            email: admin.email || '',
        };
    }
}, { immediate: true });

// Validation functions
const validateEmail = () => {
    if (form.value.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailError.value = emailRegex.test(form.value.email) ? '' : 'Please enter a valid email address.';
    } else {
        emailError.value = '';
    }
    return !emailError.value;
};

const validateUsername = () => {
    if (form.value.username) {
        const usernameRegex = /^[a-zA-Z0-9._-]{4,}$/; // Align with server minLength: 4
        usernameError.value = usernameRegex.test(form.value.username)
            ? ''
            : 'Username must be at least 4 characters long and can only contain letters, numbers, dots, underscores, and hyphens.';
    } else {
        usernameError.value = '';
    }
    return !usernameError.value;
};

const validateName = () => {
    if (form.value.name) {
        const nameRegex = /^[a-zA-Z\s]+$/;
        nameError.value = nameRegex.test(form.value.name) ? '' : 'Name can only contain letters and spaces.';
    } else {
        nameError.value = '';
    }
    return !nameError.value;
};

const hasChanges = () => {
    return (
        form.value.name !== (props.admin?.name || '') ||
        form.value.username !== (props.admin?.username || '') ||
        form.value.email !== (props.admin?.email || '')
    );
};

const getChangedFields = () => {
    const changes = {};
    if (form.value.name && form.value.name !== (props.admin?.name || '')) changes.name = form.value.name;
    if (form.value.username && form.value.username !== (props.admin?.username || '')) changes.username = form.value.username;
    if (form.value.email && form.value.email !== (props.admin?.email || '')) changes.email = form.value.email;
    return changes;
};

const updateAdmin = async () => {
    const isEmailValid = validateEmail();
    const isUsernameValid = validateUsername();
    const isNameValid = validateName();

    if (!isEmailValid || !isUsernameValid || !isNameValid) {
        updateMessage.value = 'Please fix all validation errors before submitting.';
        return;
    }

    if (!hasChanges()) {
        updateMessage.value = 'No changes detected.';
        return;
    }

    isUpdating.value = true;
    updateMessage.value = '';
    successMessage.value = '';

    try {
        const changedFields = getChangedFields();
        if (Object.keys(changedFields).length === 0) {
            successMessage.value = 'No changes to update.';
            return;
        }

        const response = await fetch(`${BASE_API_URL}/api/admin/update/${props.admin._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authStore.accessToken}`,
            },
            body: JSON.stringify(changedFields),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update admin details.');
        }

        const updatedAdmin = await response.json();
        emit('admin-updated', updatedAdmin);
        successMessage.value = updatedAdmin.message || 'Admin details updated successfully!';
    } catch (error) {
        console.error('Error updating admin:', error);
        updateMessage.value = error.message || 'An error occurred while updating the admin.';
    } finally {
        isUpdating.value = false;
    }
};

// Reset form to initial state
const resetForm = () => {
    if (props.admin) {
        form.value = {
            name: props.admin.name || '',
            username: props.admin.username || '',
            email: props.admin.email || '',
        };
    }
    emailError.value = '';
    usernameError.value = '';
    nameError.value = '';
    updateMessage.value = '';
    successMessage.value = '';
};
</script>

<template>
    <div>
        <h2 class="text-lg font-semibold mb-4">Update Admin Details</h2>
        <form @submit.prevent="updateAdmin">
            <div class="mb-4">
                <InputLabel for="name" value="Name" />
                <TextInput id="name" v-model="form.name" type="text" class="mt-1 block w-full" @input="validateName" />
                <InputError :message="nameError" class="mt-2" />
            </div>

            <div class="mb-4">
                <InputLabel for="username" value="Username" />
                <TextInput id="username" v-model="form.username" type="text" class="mt-1 block w-full"
                    @input="validateUsername" />
                <InputError :message="usernameError" class="mt-2" />
            </div>

            <div class="mb-4">
                <InputLabel for="email" value="Email" />
                <TextInput id="email" v-model="form.email" type="email" class="mt-1 block w-full"
                    @input="validateEmail" />
                <InputError :message="emailError" class="mt-2" />
            </div>

            <div class="flex items-center justify-between">
                <button type="submit" :disabled="isUpdating"
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Update
                </button>
            </div>

            <p v-if="updateMessage" class="text-red-500 mt-4">{{ updateMessage }}</p>
            <p v-if="successMessage" class="text-green-500 mt-4">{{ successMessage }}</p>
        </form>
    </div>
</template>