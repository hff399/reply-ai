// Parse cookies from the browser
function getCookie(name: string): string | null {
    if (typeof document !== "undefined") {
        const value = `; ${document.cookie}`; // Add semicolon to handle edge cases
        const parts = value.split(`; ${name}=`);
        
        if (parts.length === 2) {
            // Ensure that pop() does not return undefined before calling .split()
            const cookieValue = parts.pop();
            if (cookieValue) {
                return cookieValue.split(';').shift() || null;
            }
        }
    }
    return null;
  }

  export default getCookie