// utils/antiCheat.js

export const initAntiCheat = (onCheatDetected) => {
    let lastCheatTime = 0;

    // 1. Detect Tab Switching
    const handleVisibilityChange = () => {
        if (document.hidden) {
            // Wait 300ms to see if it stays hidden (filters out brief focus flickers)
            setTimeout(() => {
                if (document.hidden) {
                    const now = Date.now();
                    if (now - lastCheatTime > 2000) {
                        lastCheatTime = now;
                        onCheatDetected('tab_switch');
                    }
                }
            }, 300);
        }
    };

    // 2. Disable Right Click, Copy, Paste
    const preventDefaultAction = (e) => {
        e.preventDefault();
    };

    // Attach event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', preventDefaultAction); // Right click
    document.addEventListener('copy', preventDefaultAction); // Copy
    document.addEventListener('paste', preventDefaultAction); // Paste
    document.addEventListener('cut', preventDefaultAction); // Cut

    // Return a cleanup function
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('contextmenu', preventDefaultAction);
        document.removeEventListener('copy', preventDefaultAction);
        document.removeEventListener('paste', preventDefaultAction);
        document.removeEventListener('cut', preventDefaultAction);
    };
};
