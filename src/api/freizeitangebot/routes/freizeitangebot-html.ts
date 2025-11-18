/**
 * freizeitangebot custom html route
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/freizeitangebote/html',
            handler: 'freizeitangebot.html',
            config: {
                auth: false, // or true, if you want it protected
            },
        },
    ],
};
