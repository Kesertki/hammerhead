import { ChatSessionModelFunctions, defineChatSessionFunction } from 'node-llama-cpp';

export const systemFunctions = {
    getDate: defineChatSessionFunction({
        description: 'Get the current date',
        handler() {
            const date = new Date();
            return [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0'),
            ].join('-');
        },
    }),

    getTime: defineChatSessionFunction({
        description: 'Get the current time',
        handler() {
            return new Date().toLocaleTimeString('en-US');
        },
    }),

    // getWeather: defineChatSessionFunction({
    //     description: 'Get the current weather for a given location',
    //     params: {
    //         type: 'object',
    //         properties: {
    //             location: {
    //                 type: 'string',
    //             },
    //         },
    //     },
    //     handler({ location }) {
    //         return {
    //             location,
    //             unit: 'celsius',
    //             temperature: 35,
    //         };
    //     },
    // }),

    // getUserDetails: defineChatSessionFunction({
    //     description: 'Get user details based on user ID',
    //     params: {
    //         type: 'object',
    //         properties: {
    //             userId: {
    //                 type: 'string',
    //             },
    //         },
    //     },
    //     async handler({ userId }) {
    //         // Simulate fetching user details from a database or API
    //         const userDetails = {
    //             id: userId,
    //             name: 'John Doe',
    //             email: 'john.doe@mail.com',
    //             age: 30,
    //             address: '123 Main St, Springfield, USA',
    //         };
    //         return userDetails;
    //     },
    // }),
} as const satisfies ChatSessionModelFunctions;
