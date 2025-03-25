<script setup lang="ts">
import Modal from '@/components/Modal.vue';
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants';

const authStore = useAuthStore();
const showRegisterModal = ref(false);
const positions = ['Developer', 'Manager', 'Designer', 'Analyst'];

// Form state
const newRequest = ref({
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
    hireDate: new Date().toISOString().slice(0, 10),
});

const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const emailError = ref('');
const phoneError = ref('');
const passwordError = ref('');
const isSubmitting = ref(false);
const signupMessage = ref(''); // New ref to display signup status

// Modal control
const closeModal = () => {
    showRegisterModal.value = false;
    resetForm();
};

const resetForm = () => {
    newRequest.value = {
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
        hireDate: new Date().toISOString().slice(0, 10),
    };
    confirmPassword.value = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
    emailError.value = '';
    phoneError.value = '';
    passwordError.value = '';
    signupMessage.value = ''; // Reset message
};

// Validation methods
const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailError.value = emailRegex.test(newRequest.value.email) ? '' : 'Please enter a valid email address.';
};

const validatePhoneNumber = () => {
    const phoneRegex = /^\d{11}$/;
    phoneError.value = phoneRegex.test(newRequest.value.contactInfo) ? '' : 'Please enter a valid 11-digit phone number.';
};

const validatePassword = () => {
    const password = newRequest.value.password;
    if (!password) {
        passwordError.value = 'Password is required.';
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

// Computed properties
const hourlyRate = computed(() => {
    return newRequest.value.salary ? newRequest.value.salary / (8 * 22) : 0;
});

const passwordStrength = computed(() => {
    const password = newRequest.value.password;
    if (!password) return 'Weak';
    if (password.length < 8) return 'Weak';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const strengthScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (password.length >= 12 && strengthScore >= 3) return 'Strong';
    if (password.length >= 8 && strengthScore >= 2) return 'Medium';
    return 'Weak';
});

const passwordStrengthClass = computed(() => {
    return {
        'text-red-500': passwordStrength.value === 'Weak',
        'text-yellow-500': passwordStrength.value === 'Medium',
        'text-green-500': passwordStrength.value === 'Strong'
    };
});

const passwordsMatch = computed(() => {
    return newRequest.value.password === confirmPassword.value;
});

const isSubmitDisabled = computed(() => {
    return isSubmitting.value || !passwordsMatch.value || !!emailError.value || !!phoneError.value || !!passwordError.value;
});

// Contribution calculations (unchanged)
const calculateSSSContribution = (salary: number) => {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) {
        return 250;
    }
    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    let mpfContribution = 0;
    if (salaryCredit > 20000) {
        const mpfBase = Math.min(salaryCredit, 35000) - 20000;
        mpfContribution = Math.round(mpfBase * 0.025);
    }
    let totalEmployeeContribution = regularSSContribution + mpfContribution;
    if (salaryCredit > 34750) {
        totalEmployeeContribution = 1750;
    }
    return totalEmployeeContribution;
};

const calculatePhilHealthContribution = (salary: number) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const minSalary = 10000;
    const maxSalary = 100000;
    const cappedSalary = Math.min(Math.max(monthlySalary, minSalary), maxSalary);
    return Math.round(cappedSalary * 0.025);
};

const calculatePagIBIGContribution = (salary: number) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const maxSalary = 5000;
    const cappedSalary = Math.min(monthlySalary, maxSalary);
    let rate = 0.02;
    if (cappedSalary <= 1500) {
        rate = 0.01;
    }
    return Math.round(cappedSalary * rate);
};

const calculateWithholdingTax = (salary: number) => {
    const taxableIncome = salary || 0;
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
    if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
    if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
    if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
    return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
};

// Submit request
const submitRequest = async () => {
    if (!passwordsMatch.value) {
        signupMessage.value = 'Passwords do not match.';
        return;
    }
    if (emailError.value || phoneError.value || passwordError.value) {
        signupMessage.value = 'Please fix all validation errors before submitting.';
        return;
    }

    isSubmitting.value = true;
    signupMessage.value = ''; // Clear previous messages

    try {
        const payload = {
            firstName: newRequest.value.firstName,
            middleName: newRequest.value.middleName,
            lastName: newRequest.value.lastName,
            username: newRequest.value.username,
            email: newRequest.value.email,
            password: newRequest.value.password,
            employeeIdNumber: `EMP-${Date.now()}`,
            contactInfo: newRequest.value.contactInfo,
            position: newRequest.value.position,
            civilStatus: newRequest.value.civilStatus,
            sss: newRequest.value.sss,
            philHealth: newRequest.value.philHealth,
            pagIbig: newRequest.value.pagIbig,
            salary: newRequest.value.salary,
            hireDate: newRequest.value.hireDate,
        };

        const response = await fetch(`${BASE_API_URL}/api/employees/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
        }

        const data = await response.json();
        // Do NOT set employee or token in auth store
        // Do NOT fetch employee details or redirect
        signupMessage.value = 'Your account request has been submitted and is awaiting admin approval.';
        setTimeout(closeModal, 3000); // Close modal after 3 seconds
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        console.error('Error during registration:', err);
        signupMessage.value = `Registration failed: ${err.message}`;
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="text-center">
        <p class="text-sm text-gray-700">
            Don't have an account?
            <a href="#" @click="showRegisterModal = true" class="text-blue-500 hover:underline">
                Request an account
            </a>
        </p>
    </div>

    <Modal :show="showRegisterModal" @close="closeModal">
        <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-2xl font-bold mb-6 text-gray-900">Request Account Creation</h2>
            <form @submit.prevent="submitRequest" class="grid grid-cols-2 gap-6">
                <!-- Basic Information -->
                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="firstName" class="text-sm font-medium text-gray-700">First Name</label>
                            <input v-model="newRequest.firstName" type="text" id="firstName"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your first name" required />
                        </div>
                        <div class="space-y-1">
                            <label for="middleName" class="text-sm font-medium text-gray-700">Middle Name</label>
                            <input v-model="newRequest.middleName" type="text" id="middleName"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your middle name" />
                        </div>
                        <div class="space-y-1">
                            <label for="lastName" class="text-sm font-medium text-gray-700">Last Name</label>
                            <input v-model="newRequest.lastName" type="text" id="lastName"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your last name" required />
                        </div>
                        <div class="space-y-1">
                            <label for="email" class="text-sm font-medium text-gray-700">Email</label>
                            <input v-model="newRequest.email" type="email" id="email"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email" required @input="validateEmail" />
                            <p v-if="emailError" class="text-red-500 text-xs mt-1">{{ emailError }}</p>
                        </div>
                        <div class="space-y-1">
                            <label for="contactInfo" class="text-sm font-medium text-gray-700">Contact Number</label>
                            <input v-model="newRequest.contactInfo" type="text" id="contactInfo"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="09123456789" required pattern="\d{11}"
                                title="Please enter an 11-digit phone number (e.g., 09123456789)"
                                @input="validatePhoneNumber" />
                            <p v-if="phoneError" class="text-red-500 text-xs mt-1">{{ phoneError }}</p>
                        </div>
                        <div class="space-y-1">
                            <label for="position" class="text-sm font-medium text-gray-700">Position</label>
                            <select v-model="newRequest.position" id="position"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required>
                                <option v-for="position in positions" :key="position" :value="position">{{ position }}
                                </option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label for="civilStatus" class="text-sm font-medium text-gray-700">Civil Status</label>
                            <select v-model="newRequest.civilStatus" id="civilStatus"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label for="hireDate" class="text-sm font-medium text-gray-700">Hire Date</label>
                            <input v-model="newRequest.hireDate" type="date" id="hireDate"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label for="sss" class="text-sm font-medium text-gray-700">SSS ID</label>
                            <input v-model="newRequest.sss" type="text" id="sss"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1234567890" pattern="\d{10}"
                                title="Please enter a 10-digit SSS ID (e.g., 1234567890)" />
                        </div>
                        <div class="space-y-1">
                            <label for="philHealth" class="text-sm font-medium text-gray-700">PhilHealth ID</label>
                            <input v-model="newRequest.philHealth" type="text" id="philHealth"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="123456789012" pattern="\d{12}"
                                title="Please enter a 12-digit PhilHealth ID (e.g., 123456789012)" />
                        </div>
                        <div class="space-y-1">
                            <label for="pagIbig" class="text-sm font-medium text-gray-700">Pag-IBIG ID</label>
                            <input v-model="newRequest.pagIbig" type="text" id="pagIbig"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="123456789012" pattern="\d{12}"
                                title="Please enter a 12-digit Pag-IBIG ID (e.g., 123456789012)" />
                        </div>
                    </div>
                </div>

                <!-- Financial Information -->
                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="salary" class="text-sm font-medium text-gray-700">Proposed Monthly
                                Salary</label>
                            <input v-model.number="newRequest.salary" type="number" id="salary"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter proposed salary" required min="0" />
                        </div>
                        <div class="space-y-1">
                            <label for="hourlyRate" class="text-sm font-medium text-gray-700">Hourly Rate
                                (Auto-Calculated)</label>
                            <input :value="hourlyRate.toLocaleString()" type="text" id="hourlyRate"
                                class="block w-full p-2 border rounded-lg bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-medium text-gray-700">SSS Contribution (Employee Share)</label>
                            <input :value="calculateSSSContribution(newRequest.salary).toLocaleString()" type="text"
                                class="block w-full p-2 border rounded-lg bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-medium text-gray-700">PhilHealth Contribution (Employee
                                Share)</label>
                            <input :value="calculatePhilHealthContribution(newRequest.salary).toLocaleString()"
                                type="text" class="block w-full p-2 border rounded-lg bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-medium text-gray-700">Pag-IBIG Contribution (Employee
                                Share)</label>
                            <input :value="calculatePagIBIGContribution(newRequest.salary).toLocaleString()" type="text"
                                class="block w-full p-2 border rounded-lg bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-sm font-medium text-gray-700">Withholding Tax</label>
                            <input :value="calculateWithholdingTax(newRequest.salary).toLocaleString()" type="text"
                                class="block w-full p-2 border rounded-lg bg-gray-100" disabled />
                        </div>
                    </div>
                </div>

                <!-- Login Credentials -->
                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Login Credentials</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="username" class="text-sm font-medium text-gray-700">Username</label>
                            <input v-model="newRequest.username" type="text" id="username"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Choose a username" required minlength="4" />
                        </div>
                        <div class="space-y-1">
                            <label for="password" class="text-sm font-medium text-gray-700">Password</label>
                            <div class="relative">
                                <input v-model="newRequest.password" :type="showPassword ? 'text' : 'password'"
                                    id="password"
                                    class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                    placeholder="Choose a password" required minlength="8" @input="validatePassword" />
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
                            <div class="text-sm text-gray-600 mt-2">
                                Password strength: <span :class="passwordStrengthClass">{{ passwordStrength }}</span>
                            </div>
                            <p v-if="passwordError" class="text-red-500 text-xs mt-1">{{ passwordError }}</p>
                        </div>
                        <div class="space-y-1">
                            <label for="confirmPassword" class="text-sm font-medium text-gray-700">Confirm
                                Password</label>
                            <div class="relative">
                                <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                                    id="confirmPassword"
                                    class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                    placeholder="Confirm your password" required @input="validatePassword" />
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
                            <div class="text-sm text-red-500 mt-1" v-if="!passwordsMatch && confirmPassword">
                                Passwords do not match
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Signup Message -->
                <div v-if="signupMessage" class="col-span-2 text-center">
                    <p :class="signupMessage.includes('failed') ? 'text-red-500' : 'text-green-500'">{{ signupMessage }}
                    </p>
                </div>

                <!-- Form Actions -->
                <div class="col-span-2 flex justify-end space-x-2 mt-6">
                    <button type="button" @click="closeModal"
                        class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
                        :disabled="isSubmitting">
                        Cancel
                    </button>
                    <button type="submit"
                        class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
                        :disabled="isSubmitDisabled">
                        {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
                    </button>
                </div>
            </form>
        </div>
    </Modal>
</template>

<style scoped>
/* Tailwind CSS classes are sufficient */
</style>