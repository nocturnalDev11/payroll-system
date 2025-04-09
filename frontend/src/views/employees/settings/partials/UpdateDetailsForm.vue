<!-- UpdateDetailsForm.vue -->
<script setup>
import { ref, watch, computed } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import Toast from '@/components/Toast.vue';
import TextInput from '@/components/TextInput.vue';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';

const props = defineProps(['employee']);
const emit = defineEmits(['employee-updated']);
const authStore = useAuthStore();
const form = ref({ firstName: '', middleName: '', lastName: '', username: '', email: '', contactInfo: '', civilStatus: '', salary: '', sss: '', philhealth: '', pagibig: '', hireDate: new Date().toISOString().slice(0, 10) });
const isUpdating = ref(false);
const updateMessage = ref('');
const successMessage = ref('');
const civilStatusOptions = ref(['Single', 'Married', 'Separated', 'Widowed']);
const emailError = ref('');
const phoneError = ref('');
const salaryError = ref('');

// Store the initial form values to reset if needed
const initialFormValues = ref({ ...form.value });

watch(() => props.employee, (employee) => {
    if (employee) {
        form.value = {
            ...form.value,
            ...employee,
            hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().slice(0, 10) : form.value.hireDate,
            salary: employee.salary != null ? String(employee.salary) : ''
        };
        // Update initial values whenever employee prop changes
        initialFormValues.value = { ...form.value };
    }
}, { immediate: true });

const validateEmail = () => { emailError.value = form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email) ? 'Invalid email' : ''; };
const validatePhoneNumber = () => { phoneError.value = form.value.contactInfo && !/^\d{11}$/.test(form.value.contactInfo) ? 'Invalid 11-digit phone' : ''; };
const validateSalary = () => { salaryError.value = form.value.salary && (isNaN(Number(form.value.salary)) || Number(form.value.salary) < 0) ? 'Invalid salary' : ''; };
const isSubmitDisabled = computed(() => isUpdating.value || !!emailError.value || !!phoneError.value || !!salaryError.value || !props.employee);

const updateEmployee = async () => {
    validateEmail(); validatePhoneNumber(); validateSalary();
    if (emailError.value || phoneError.value || salaryError.value) { updateMessage.value = 'Fix validation errors'; return; }
    if (!props.employee?._id) { updateMessage.value = 'No employee data'; return; }

    isUpdating.value = true; updateMessage.value = ''; successMessage.value = '';
    try {
        const token = authStore.accessToken;
        if (!token) throw new Error('No token');
        const payload = Object.fromEntries(Object.entries(form.value).filter(([, v]) => v !== '' && v !== null));
        if (payload.salary) payload.salary = Number(payload.salary);

        const response = await fetch(`${BASE_API_URL}/api/employees/update/${props.employee._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(await response.text());
        const updatedEmployee = await response.json();
        successMessage.value = 'Updated successfully';

        // Update the form with the returned data from server
        form.value = {
            ...form.value,
            ...updatedEmployee.updatedEmployee,
            salary: updatedEmployee.updatedEmployee.salary != null ? String(updatedEmployee.updatedEmployee.salary) : ''
        };

        emit('employee-updated', updatedEmployee.updatedEmployee);
    } catch (error) {
        updateMessage.value = `Failed: ${error.message}`;
        // Reset to initial values on error
        form.value = { ...initialFormValues.value };
    } finally {
        isUpdating.value = false;
    }
};
</script>

<template>
    <div>
        <header>
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Update your profile</p>
        </header>
        <form @submit.prevent="updateEmployee" class="mt-6 space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <InputLabel for="firstName" value="First Name" />
                    <TextInput v-model="form.firstName" id="firstName" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="middleName" value="Middle Name" />
                    <TextInput v-model="form.middleName" id="middleName" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="lastName" value="Last Name" />
                    <TextInput v-model="form.lastName" id="lastName" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="username" value="Username" />
                    <TextInput v-model="form.username" id="username" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="email" value="Email" />
                    <TextInput v-model="form.email" id="email" type="email" class="mt-1 block w-full"
                        @input="validateEmail" />
                    <InputError :message="emailError" class="mt-2" />
                </div>
                <div>
                    <InputLabel for="contactInfo" value="Contact Number" />
                    <TextInput v-model="form.contactInfo" id="contactInfo" type="text" class="mt-1 block w-full"
                        @input="validatePhoneNumber" />
                    <InputError :message="phoneError" class="mt-2" />
                </div>
                <div>
                    <InputLabel for="civilStatus" value="Civil Status" /><select v-model="form.civilStatus"
                        id="civilStatus"
                        class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        <option value="">Select</option>
                        <option v-for="status in civilStatusOptions" :key="status" :value="status">{{ status }}</option>
                    </select>
                </div>
                <div>
                    <InputLabel for="salary" value="Salary" />
                    <TextInput v-model="form.salary" id="salary" type="text" class="mt-1 block w-full"
                        @input="validateSalary" />
                    <InputError :message="salaryError" class="mt-2" />
                </div>
                <div>
                    <InputLabel for="sss" value="SSS Number" />
                    <TextInput v-model="form.sss" id="sss" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="philhealth" value="PhilHealth Number" />
                    <TextInput v-model="form.philhealth" id="philhealth" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="pagibig" value="Pag-IBIG Number" />
                    <TextInput v-model="form.pagibig" id="pagibig" class="mt-1 block w-full" />
                </div>
                <div>
                    <InputLabel for="hireDate" value="Hire Date" />
                    <TextInput v-model="form.hireDate" id="hireDate" type="date" class="mt-1 block w-full" />
                </div>
            </div>
            <div class="flex items-center gap-4"><button type="submit"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
                    :disabled="isSubmitDisabled">Update</button></div>
        </form>
        <Toast v-if="successMessage" :message="successMessage" type="success" />
        <Toast v-if="updateMessage" :message="updateMessage" type="error" />
    </div>
</template>