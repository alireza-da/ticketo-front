module.exports = {
    content: ['./src/**/*.{vue,js,ts}'],
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                custom: {

                    "primary": "#7339ab",

                    "secondary": "#625ad8",

                    "accent": "#1f9ce4",

                    "neutral": "#88f4ff",

                    "base-100": "#000000",

                    "info": "#2A7DEA",

                    "success": "#3EDAAE",

                    "warning": "#F8B063",

                    "error": "#F46685",
                }
                
            },
            "dark",
            "light"
        ],
        
    },
};
