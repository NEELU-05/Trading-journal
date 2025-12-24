/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'flag-red': '#ef4444',
                'win-green': '#10b981',
                'loss-red': '#f87171',
                'be-gray': '#9ca3af',
            },
        },
    },
    plugins: [],
}
