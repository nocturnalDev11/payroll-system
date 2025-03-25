<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
                <div class="text-center space-y-2">
                    <div class="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">Reset Password</h1>
                    <p class="text-gray-500 text-sm">{{ step === 1 ? 'Enter your email to receive a verification code' :
                        'Enter the code and your new password' }}</p>
                </div>

                <!-- Step 1: Email Input -->
                <form v-if="step === 1" @submit.prevent="sendVerificationCode" class="space-y-4">
                    <div class="space-y-1">
                        <label for="email" class="text-sm font-medium text-gray-700">Email</label>
                        <input v-model="email" type="email" id="email"
                            class="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your email" required />
                    </div>
                    <div v-if="error" class="text-red-500 text-sm text-center">{{ error }}</div>
                    <button type="submit"
                        class="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        :disabled="isProcessing">
                        {{ isProcessing ? 'Sending...' : 'Send Verification Code' }}
                    </button>
                    <div class="text-center">
                        <router-link to="/employee-login" class="text-sm text-blue-500 hover:underline">Back to
                            Login</router-link>
                    </div>
                </form>

                <!-- Step 2: Verification and New Password -->
                <form v-if="step === 2" @submit.prevent="resetPassword" class="space-y-4">
                    <div class="space-y-1">
                        <label for="code" class="text-sm font-medium text-gray-700">Verification Code</label>
                        <input v-model="verificationCode" type="text" id="code"
                            class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter the code" required />
                    </div>
                    <div class="space-y-1">
                        <label for="newPassword" class="text-sm font-medium text-gray-700">New Password</label>
                        <div class="relative">
                            <input v-model="newPassword" :type="showPassword ? 'text' : 'password'" id="newPassword"
                                class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                placeholder="Enter new password" required minlength="8" />
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
                    </div>
                    <div v-if="error" class="text-red-500 text-sm text-center">{{ error }}</div>
                    <button type="submit"
                        class="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        :disabled="isProcessing">
                        {{ isProcessing ? 'Resetting...' : 'Reset Password' }}
                    </button>
                    <div class="text-center">
                        <router-link to="/employee-login" class="text-sm text-blue-500 hover:underline">Back to
                            Login</router-link>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'ForgotPassword',
    data() {
        return {
            step: 1,
            email: '',
            verificationCode: '',
            newPassword: '',
            showPassword: false,
            error: '',
            isProcessing: false,
            resetToken: '' 
        };
    },
    methods: {
        async sendVerificationCode() {
            this.isProcessing = true;
            this.error = '';
            try {
                const response = await axios.post('http://localhost:7777/api/employees/forgot-password', {
                    email: this.email
                });
                this.resetToken = response.data.resetToken;
                this.step = 2;
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to send verification code. Please try again.';
            } finally {
                this.isProcessing = false;
            }
        },
        async resetPassword() {
            this.isProcessing = true;
            this.error = '';
            try {
                await axios.post('http://localhost:7777/api/employees/reset-password', {
                    email: this.email,
                    resetToken: this.resetToken,
                    verificationCode: this.verificationCode,
                    newPassword: this.newPassword
                });
                this.$router.push('/employee-login');
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to reset password. Please try again.';
            } finally {
                this.isProcessing = false;
            }
        },
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword;
        }
    }
};
</script>
<style scoped>
/* Animation Keyframes */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes bounceIn {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

@keyframes pulseSlow {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }
}

@keyframes pulseFast {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

/* Animation Classes */
.animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
}

.animate-slideIn {
    animation: slideIn 0.5s ease-out;
}

.animate-bounce-in {
    animation: bounceIn 0.5s ease-out;
}

.animate-pulse-slow {
    animation: pulseSlow 2s infinite ease-in-out;
}

.animate-pulse-fast {
    animation: pulseFast 1s infinite ease-in-out;
}

/* Custom Styles for Better UX */
input:focus,
select:focus,
button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.disabled:bg-gray-400:disabled {
    opacity: 0.7;
}

.bg-gray-100:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
}

/* Responsive Adjustments */
@media (max-width: 640px) {
    .grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .w-full.max-w-3xl {
        max-width: 90%;
    }

    .p-6 {
        padding: 4;
    }
}
</style>