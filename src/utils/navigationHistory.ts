// Simple navigation history tracker
// This helps preserve context when navigating to/from Settings via menu or direct navigation

let previousRoute = '/';

export const setNavigationHistory = (route: string) => {
    // Don't track settings routes as previous routes
    if (!route.startsWith('/settings')) {
        previousRoute = route;
    }
};

export const getPreviousRoute = () => {
    return previousRoute;
};

export const clearNavigationHistory = () => {
    previousRoute = '/';
};
