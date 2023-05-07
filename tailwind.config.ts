module.exports = {
    content: ['./src/**/*.{vue,js,ts}'],
    daisyui: {
        themes: [
            {
                dark: {

                    "primary": "#7339ab",

                    "secondary": "#625ad8",

                    "accent": "#1f9ce4",

                    "neutral": "#88f4ff",

                    "base-100": "#F0EFF0",

                    "info": "#2A7DEA",

                    "success": "#3EDAAE",

                    "warning": "#F8B063",

                    "error": "#F46685",
                }
            },
        ],
        
    },
    plugins: [require('daisyui')],
};
