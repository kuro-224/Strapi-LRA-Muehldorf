/**
 * freizeitangebot custom html route
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/freizeitangebots/html',
            handler: 'freizeitangebot.html',
            config: {
                auth: false, // or true, if you want it protected
            },
        },
    ],
};
