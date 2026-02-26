// utils/antiCheat.js

export const initAntiCheat = (onCheatDetected) => {
    // 1. Detect Tab Switching / Focus Loss
    const handleVisibilityChange = () => {
        if (document.hidden) {
            onCheatDetected('tab_switch');
        }
    };

    const handleBlur = () => {
        onCheatDetected('window_blur');
    };

    // 2. Disable Right Click, Copy, Paste
    const preventDefaultAction = (e) => {
        e.preventDefault();
    };

    // Attach event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    document.addEventListener('contextmenu', preventDefaultAction); // Right click
    document.addEventListener('copy', preventDefaultAction); // Copy
    document.addEventListener('paste', preventDefaultAction); // Paste
    document.addEventListener('cut', preventDefaultAction); // Cut

    // Return a cleanup function
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('contextmenu', preventDefaultAction);
        document.removeEventListener('copy', preventDefaultAction);
        document.removeEventListener('paste', preventDefaultAction);
        document.removeEventListener('cut', preventDefaultAction);
    };
};
