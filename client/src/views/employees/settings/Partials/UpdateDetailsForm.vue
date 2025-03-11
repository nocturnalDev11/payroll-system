<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';
import TextInput from '@/components/TextInput.vue';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';

const props = defineProps(['employee']);
const emit = defineEmits(['employee-updated']);

const authStore = useAuthStore();

const form = ref({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    contactInfo: '',
    position: '',
    civilStatus: '',
    salary: '',
    sss: '',
    philHealth: '',
    pagIbig: '',
    hireDate: new Date().toISOString().slice(0, 10),
});

const isUpdating = ref(false);
const updateMessage = ref('');
const successMessage = ref('');
const employeePositions = ref(['Developer', 'Manager', 'Designer', 'Analyst']);
const civilStatusOptions = ref(['Single', 'Married', 'Separated', 'Widowed']);
const emailError = ref('');
const phoneError = ref('');
const salaryError = ref('');
const isLoading = ref(false);

// Populate form with employee data when prop changes
watch(() => props.employee, (employee) => {
    if (employee) {
        form.value = {
            firstName: employee.firstName || '',
            middleName: employee.middleName || '',
            lastName: employee.lastName || '',
            username: employee.username || '',
            email: employee.email || '',
            contactInfo: employee.contactInfo || '',
            position: employee.position || '',
            civilStatus: employee.civilStatus || '',
            salary: employee.salary != null ? String(employee.salary) : '',
            sss: employee.sss || '',
            philHealth: employee.philHealth || '',
            pagIbig: employee.pagIbig || '',
            hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        };
    }
}, { immediate: true });

// Validation functions (only validate if field is filled)
const validateEmail = () => {
    if (form.value.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailError.value = emailRegex.test(form.value.email) ? '' : 'Please enter a valid email address.';
    } else {
        emailError.value = '';
    }
};

const validatePhoneNumber = () => {
    if (form.value.contactInfo) {
        const phoneRegex = /^\d{11}$/;
        phoneError.value = phoneRegex.test(form.value.contactInfo) ? '' : 'Please enter a valid 11-digit phone number.';
    } else {
        phoneError.value = '';
    }
};

const validateSalary = () => {
    if (form.value.salary) {
        const salary = Number(form.value.salary);
        if (isNaN(salary) || salary < 0) {
            salaryError.value = 'Salary must be a valid non-negative number.';
        } else {
            salaryError.value = '';
        }
    } else {
        salaryError.value = '';
    }
};

// Check if form is valid
const isSubmitDisabled = computed(() => {
    return isUpdating.value || !!emailError.value || !!phoneError.value || !!salaryError.value || isLoading.value || !props.employee;
});

// Reset form to initial state
const resetForm = () => {
    if (props.employee) {
        form.value = {
            firstName: props.employee.firstName || '',
            middleName: props.employee.middleName || '',
            lastName: props.employee.lastName || '',
            username: props.employee.username || '',
            email: props.employee.email || '',
            contactInfo: props.employee.contactInfo || '',
            position: props.employee.position || '',
            civilStatus: props.employee.civilStatus || '',
            salary: props.employee.salary != null ? String(props.employee.salary) : '',
            sss: props.employee.sss || '',
            philHealth: props.employee.philHealth || '',
            pagIbig: props.employee.pagIbig || '',
            hireDate: props.employee.hireDate ? new Date(props.employee.hireDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        };
    }
    emailError.value = '';
    phoneError.value = '';
    salaryError.value = '';
    updateMessage.value = '';
    successMessage.value = '';
};

const updateEmployee = async () => {
    validateEmail();
    validatePhoneNumber();
    validateSalary();
    if (emailError.value || phoneError.value || salaryError.value) {
        updateMessage.value = 'Please fix all validation errors before submitting.';
        return;
    }

    if (!props.employee || !props.employee._id) {
        updateMessage.value = 'No employee data available to update.';
        return;
    }

    isUpdating.value = true;
    updateMessage.value = '';
    successMessage.value = '';

    try {
        const authStore = useAuthStore(); // Access the auth store
        const token = authStore.accessToken; // Get the token

        if (!token) {
            throw new Error('No authentication token available. Please log in again.');
        }

        // Only include fields that have been changed or are non-empty
        const payload = {};
        Object.keys(form.value).forEach((key) => {
            if (form.value[key] !== '' && form.value[key] !== null) {
                payload[key] = form.value[key];
            }
        });

        // Convert salary to number if provided
        if (payload.salary) {
            payload.salary = Number(payload.salary);
        }

        const response = await fetch(`${BASE_API_URL}/api/employees/update/${props.employee._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Add the Authorization header
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Update failed');
            } else {
                const text = await response.text();
                throw new Error(`Update failed with status ${response.status}: ${text}`);
            }
        }

        const updatedEmployee = await response.json();
        successMessage.value = 'Employee details updated successfully.';
        emit('employee-updated', updatedEmployee.updatedEmployee);
    } catch (error) {
        console.error('Update failed:', error);
        updateMessage.value = `Failed to update employee: ${error.message}`;
    } finally {
        isUpdating.value = false;
    }
};
</script>

<template>
    <div>
        <header>
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                Profile Information
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update your account's profile information and email address.
            </p>
        </header>

        <form @submit.prevent="updateEmployee" class="mt-6 space-y-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center text-gray-600">Loading employee details...</div>

            <!-- Two-Column Grid Layout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- First Name -->
                <div>
                    <InputLabel for="firstName" value="First Name" />
                    <TextInput v-model="form.firstName" id="firstName" class="mt-1 block w-full"
                        autocomplete="given-name" :placeholder="props.employee?.firstName || 'Enter first name'" />
                </div>

                <!-- Middle Name -->
                <div>
                    <InputLabel for="middleName" value="Middle Name" />
                    <TextInput v-model="form.middleName" id="middleName" class="mt-1 block w-full"
                        autocomplete="additional-name"
                        :placeholder="props.employee?.middleName || 'Enter middle name'" />
                </div>

                <!-- Last Name -->
                <div>
                    <InputLabel for="lastName" value="Last Name" />
                    <TextInput v-model="form.lastName" id="lastName" class="mt-1 block w-full"
                        autocomplete="family-name" :placeholder="props.employee?.lastName || 'Enter last name'" />
                </div>

                <!-- Username -->
                <div>
                    <InputLabel for="username" value="Username" />
                    <TextInput v-model="form.username" id="username" class="mt-1 block w-full" autocomplete="username"
                        :placeholder="props.employee?.username || 'Enter username'" />
                </div>

                <!-- Email -->
                <div>
                    <InputLabel for="email" value="Email" />
                    <TextInput v-model="form.email" id="email" type="email" class="mt-1 block w-full"
                        autocomplete="email" @input="validateEmail"
                        :placeholder="props.employee?.email || 'Enter email'" />
                    <InputError :message="emailError" class="mt-2" />
                </div>

                <!-- Contact Number -->
                <div>
                    <InputLabel for="contactInfo" value="Contact Number" />
                    <TextInput v-model="form.contactInfo" id="contactInfo" type="text" class="mt-1 block w-full"
                        pattern="\d{11}" title="Please enter an 11-digit phone number (e.g., 09123456789)"
                        autocomplete="tel" @input="validatePhoneNumber"
                        :placeholder="props.employee?.contactInfo || 'Enter contact number'" />
                    <InputError :message="phoneError" class="mt-2" />
                </div>

                <!-- Position -->
                <div>
                    <InputLabel for="position" value="Position" />
                    <select v-model="form.position" id="position"
                        class="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                        <option value="" :selected="!props.employee?.position">Select a position</option>
                        <option v-for="position in employeePositions" :key="position" :value="position"
                            :selected="position === props.employee?.position">
                            {{ position }}
                        </option>
                    </select>
                </div>

                <!-- Civil Status -->
                <div>
                    <InputLabel for="civilStatus" value="Civil Status" />
                    <select v-model="form.civilStatus" id="civilStatus"
                        class="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                        <option value="" :selected="!props.employee?.civilStatus">Select civil status</option>
                        <option v-for="status in civilStatusOptions" :key="status" :value="status"
                            :selected="status === props.employee?.civilStatus">
                            {{ status }}
                        </option>
                    </select>
                </div>

                <!-- Salary -->
                <div>
                    <InputLabel for="salary" value="Salary" />
                    <TextInput v-model="form.salary" id="salary" type="text" class="mt-1 block w-full"
                        @input="validateSalary"
                        :placeholder="props.employee?.salary ? String(props.employee.salary) : 'Enter salary'" />
                    <InputError :message="salaryError" class="mt-2" />
                </div>

                <!-- SSS -->
                <div>
                    <InputLabel for="sss" value="SSS Number" />
                    <TextInput v-model="form.sss" id="sss" class="mt-1 block w-full"
                        :placeholder="props.employee?.sss || 'Enter SSS number'" />
                </div>

                <!-- PhilHealth -->
                <div>
                    <InputLabel for="philHealth" value="PhilHealth Number" />
                    <TextInput v-model="form.philHealth" id="philHealth" class="mt-1 block w-full"
                        :placeholder="props.employee?.philHealth || 'Enter PhilHealth number'" />
                </div>

                <!-- Pag-IBIG -->
                <div>
                    <InputLabel for="pagIbig" value="Pag-IBIG Number" />
                    <TextInput v-model="form.pagIbig" id="pagIbig" class="mt-1 block w-full"
                        :placeholder="props.employee?.pagIbig || 'Enter Pag-IBIG number'" />
                </div>

                <!-- Hire Date -->
                <div>
                    <InputLabel for="hireDate" value="Hire Date" />
                    <TextInput v-model="form.hireDate" id="hireDate" type="date" class="mt-1 block w-full"
                        :value="props.employee?.hireDate ? new Date(props.employee.hireDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)" />
                </div>
            </div>

            <!-- Messages -->
            <div v-if="updateMessage" class="text-red-600 text-sm">{{ updateMessage }}</div>
            <div v-if="successMessage" class="text-green-600 text-sm">{{ successMessage }}</div>

            <!-- Buttons -->
            <div class="flex items-center gap-4">
                <button type="submit"
                    class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    Update Profile
                </button>
                <button type="button" @click="resetForm"
                    class="inline-flex items-center px-4 py-2 bg-gray-200 border border-gray-300 rounded-md font-semibold text-gray-700 tracking-wide hover:bg-gray-300 focus:outline-none">
                    Reset
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em;
    padding-right: 2rem;
}
</style>