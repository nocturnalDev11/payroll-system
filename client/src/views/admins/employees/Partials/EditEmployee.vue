<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.js';

// Define props and emits
const props = defineProps(['employee']);
const emit = defineEmits(['employee-updated']);

// Reactive state
const showEditModal = ref(false);
const form = ref({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    contactInfo: '',
    position: '',
    civilStatus: '',
    salary: 0,
    sss: '',
    philHealth: '',
    pagIbig: '',
    hireDate: '',
});
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isUpdating = ref(false);
const adminPositions = ref(['Developer', 'Manager', 'Designer', 'Analyst']);
const emailError = ref('');
const phoneError = ref('');
const passwordError = ref('');

// Sync form with employee prop when it changes
watch(() => props.employee, (newEmployee) => {
    if (newEmployee) {
        form.value = {
            firstName: newEmployee.firstName || '',
            middleName: newEmployee.middleName || '',
            lastName: newEmployee.lastName || '',
            username: newEmployee.username || '',
            email: newEmployee.email || '',
            password: '',
            contactInfo: newEmployee.contactInfo || '',
            position: newEmployee.position || '',
            civilStatus: newEmployee.civilStatus || '',
            salary: newEmployee.salary || 0,
            deductions: {
                sss: newEmployee.deductions?.sss || 0,
                philHealth: newEmployee.deductions?.philHealth || 0,
                pagIbig: newEmployee.deductions?.pagIbig || 0,
            },
            earnings: {
                travelExpenses: newEmployee.earnings?.travelExpenses || 0,
                otherEarnings: newEmployee.earnings?.otherEarnings || 0,
            },
            hireDate: newEmployee.hireDate ? new Date(newEmployee.hireDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        };
        confirmPassword.value = '';
    }
}, { immediate: true });

// Validation methods
const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailError.value = emailRegex.test(form.value.email) ? '' : 'Please enter a valid email address.';
};

const validatePhoneNumber = () => {
    const phoneRegex = /^\d{11}$/;
    phoneError.value = phoneRegex.test(form.value.contactInfo) ? '' : 'Please enter a valid 11-digit phone number.';
};

const validatePassword = () => {
    const password = form.value.password;
    if (!password) {
        passwordError.value = '';
    } else if (password.length < 8) {
        passwordError.value = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        passwordError.value = 'Password must contain letters and numbers.';
    } else {
        passwordError.value = '';
    }
};

// Toggle password visibility
const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

const closeEditModal = () => {
    showEditModal.value = false;
};

const updateEmployee = async () => {
    validateEmail();
    validatePhoneNumber();
    if (emailError.value || phoneError.value) {
        alert('Please fix all validation errors before submitting.');
        return;
    }

    isUpdating.value = true;
    try {
        const token = localStorage.getItem('token'); // Retrieve token from storage
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }

        const payload = {
            ...form.value,
            password: form.value.password || undefined,
            hireDate: form.value.hireDate, // Already in "yyyy-MM-dd" format
        };
        console.log('Sending payload:', payload);
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${props.employee._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Failed to update employee: ${response.status} ${response.statusText}`);
        const updatedEmployee = await response.json();
        console.log('Response:', updatedEmployee);
        emit('employee-updated', updatedEmployee.updatedEmployee);
        closeEditModal();
    } catch (error) {
        console.error('Update failed:', error);
        alert(`Failed to update employee: ${error.message}`);
    } finally {
        isUpdating.value = false;
    }
};

const calculateNetSalary = (employee) => {
    const salary = employee.salary || 0;
    const deductions = (employee.deductions?.sss || 0) +
        (employee.deductions?.philHealth || 0) +
        (employee.deductions?.pagIbig || 0);
    const earnings = (employee.earnings?.travelExpenses || 0) +
        (employee.earnings?.otherEarnings || 0);
    return salary - deductions + earnings;
};
</script>

<template>
    <div>
        <button @click="showEditModal = true"
            class="text-yellow-600 hover:text-yellow-800 transition duration-200 cursor-pointer" v-bind="$attrs">
            <slot>
                <span class="material-icons">edit</span>
            </slot>
        </button>

        <Modal :show="showEditModal" @close="closeEditModal" max-width="7xl" max-height="90vh" v-bind="$attrs">
            <div class="bg-white p-8 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6 text-gray-900">Edit Employee</h2>
                <form @submit.prevent="updateEmployee" class="space-y-6">
                    <!-- Basic Information -->
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="space-y-2">
                                <label for="firstName" class="text-sm font-medium text-gray-700">First Name</label>
                                <input v-model="form.firstName" type="text" id="firstName"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="Enter first name" required />
                            </div>
                            <div class="space-y-2">
                                <label for="middleName" class="text-sm font-medium text-gray-700">Middle Name</label>
                                <input v-model="form.middleName" type="text" id="middleName"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="Enter middle name" />
                            </div>
                            <div class="space-y-2">
                                <label for="lastName" class="text-sm font-medium text-gray-700">Last Name</label>
                                <input v-model="form.lastName" type="text" id="lastName"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="Enter last name" required />
                            </div>
                            <div class="space-y-2">
                                <label for="email" class="text-sm font-medium text-gray-700">Email</label>
                                <input v-model="form.email" type="email" id="email"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="Enter email" required @input="validateEmail" />
                                <p v-if="emailError" class="text-red-500 text-xs mt-1">{{ emailError }}</p>
                            </div>
                            <div class="space-y-2">
                                <label for="contactInfo" class="text-sm font-medium text-gray-700">Contact
                                    Number</label>
                                <input v-model="form.contactInfo" type="text" id="contactInfo"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="09123456789" required pattern="\d{11}"
                                    title="Please enter an 11-digit phone number (e.g., 09123456789)"
                                    @input="validatePhoneNumber" />
                                <p v-if="phoneError" class="text-red-500 text-xs mt-1">{{ phoneError }}</p>
                            </div>
                            <div class="space-y-2">
                                <label for="position" class="text-sm font-medium text-gray-700">Position</label>
                                <select v-model="form.position" id="position"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    required>
                                    <option v-for="position in adminPositions" :key="position" :value="position">
                                        {{ position }}
                                    </option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label for="civilStatus" class="text-sm font-medium text-gray-700">Civil Status</label>
                                <select v-model="form.civilStatus" id="civilStatus"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    required>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label for="hireDate" class="text-sm font-medium text-gray-700">Hire Date</label>
                                <input v-model="form.hireDate" type="date" id="hireDate"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    required />
                            </div>
                        </div>
                    </div>

                    <!-- Financial Information -->
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">Financial Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="space-y-2">
                                <label for="salary" class="text-sm font-medium text-gray-700">Monthly Salary</label>
                                <input v-model.number="form.salary" type="number" id="salary"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="Enter salary" required min="0" />
                            </div>
                            <div class="space-y-2">
                                <label for="hourlyRate" class="text-sm font-medium text-gray-700">Hourly Rate
                                    (Auto-Calculated)</label>
                                <input :value="(form.salary / (8 * 22)).toLocaleString()" type="text" id="hourlyRate"
                                    class="block w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                    disabled />
                            </div>
                            <div class="space-y-2">
                                <label for="deductions.sss" class="text-sm font-medium text-gray-700">SSS
                                    Deduction</label>
                                <input v-model.number="form.deductions.sss" type="number" id="deductions.sss"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    min="0" />
                            </div>
                            <div class="space-y-2">
                                <label for="deductions.philHealth" class="text-sm font-medium text-gray-700">PhilHealth
                                    Deduction</label>
                                <input v-model.number="form.deductions.philHealth" type="number"
                                    id="deductions.philHealth"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    min="0" />
                            </div>
                            <div class="space-y-2">
                                <label for="deductions.pagIbig" class="text-sm font-medium text-gray-700">Pag-IBIG
                                    Deduction</label>
                                <input v-model.number="form.deductions.pagIbig" type="number" id="deductions.pagIbig"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    min="0" />
                            </div>
                            <div class="space-y-2">
                                <label for="earnings.travelExpenses" class="text-sm font-medium text-gray-700">Travel
                                    Expenses</label>
                                <input v-model.number="form.earnings.travelExpenses" type="number"
                                    id="earnings.travelExpenses"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    min="0" />
                            </div>
                            <div class="space-y-2">
                                <label for="earnings.otherEarnings" class="text-sm font-medium text-gray-700">Other
                                    Earnings</label>
                                <input v-model.number="form.earnings.otherEarnings" type="number"
                                    id="earnings.otherEarnings"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    min="0" />
                            </div>
                            <div class="space-y-2 md:col-span-3">
                                <div class="p-3 bg-gray-50 rounded-lg shadow-sm">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm font-medium text-gray-700">Net Salary Preview:</span>
                                        <span class="text-lg font-semibold text-gray-900">₱{{
                                            calculateNetSalary(form).toLocaleString() }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Login Credentials -->
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-4">Login Credentials</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="space-y-2">
                                <label for="username" class="text-sm font-medium text-gray-700">Username</label>
                                <input v-model="form.username" type="text" id="username"
                                    class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                    placeholder="Enter username" required minlength="4" />
                            </div>
                            <div class="space-y-2">
                                <label for="password" class="text-sm font-medium text-gray-700">Password</label>
                                <div class="relative">
                                    <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                        id="password"
                                        class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition duration-150"
                                        placeholder="Enter new password (optional)" @input="validatePassword" />
                                    <button type="button" @click="togglePasswordVisibility"
                                        class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div class="text-sm text-gray-600 mt-1">
                                    Password strength: <span
                                        :class="{ 'text-red-500': !form.password, 'text-green-500': !passwordError.value && form.password.length >= 8 }">N/A</span>
                                </div>
                                <p v-if="passwordError" class="text-red-500 text-xs mt-1">{{ passwordError }}</p>
                            </div>
                            <div class="space-y-2">
                                <label for="confirmPassword" class="text-sm font-medium text-gray-700">Confirm
                                    Password</label>
                                <div class="relative">
                                    <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                                        id="confirmPassword"
                                        class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition duration-150"
                                        placeholder="Confirm new password (optional)" @input="validatePassword" />
                                    <button type="button" @click="toggleConfirmPasswordVisibility"
                                        class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div class="text-sm text-red-500 mt-1"
                                    v-if="form.password && confirmPassword && form.password !== confirmPassword">
                                    Passwords do not match
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <div class="flex justify-end space-x-4 mt-6">
                        <button type="button" @click="closeEditModal"
                            class="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            :disabled="isUpdating">
                            Cancel
                        </button>
                        <button type="submit"
                            class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :disabled="isUpdating">
                            {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    </div>
</template>

<style scoped>
/* Tailwind CSS classes are sufficient */
</style>