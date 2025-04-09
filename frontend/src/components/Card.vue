<template>
    <div class="bg-white rounded-2xl shadow-md p-4 md:p-6 w-full max-w-md transition hover:shadow-lg">
        <slot name="header" />
        <slot />
        <slot name="footer" />
    </div>
</template>

<!-- Example Usage
<Card>
    <template #header>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Header</h2>
    </template>

    <p class="text-sm text-gray-600">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </p>

    <template #footer>
        <div class="mt-4 flex justify-end">
            <button class="text-indigo-600 text-sm hover:underline">
                Sample button
            </button>
        </div>
    </template>
</Card> 
-->
