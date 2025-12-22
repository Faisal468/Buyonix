export const GoogleAuth = () => {
  window.open("http://localhost:5000/auth/google", "_self");
};

export const checkAuthStatus = async () => {
  try {
    const response = await fetch("http://localhost:5000/auth/login/success", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    
    if (response.status === 200) {
      const userData = await response.json();
      return userData;
    }
    
    // 401 is expected when user is not authenticated - return null silently
    if (response.status === 401) {
      return null;
    }
    
    // Only log error for unexpected status codes
    console.warn(`Unexpected auth status: ${response.status}`);
    return null;
  } catch (error) {
    // Only log network errors or other unexpected errors
    // Don't log 401 responses as they're expected when not logged in
    if (error.name !== 'TypeError' || !error.message.includes('fetch')) {
      console.error("Auth check failed:", error);
    }
    return null;
  }
};

export const logout = () => {
  window.open("http://localhost:5000/auth/logout", "_self");
};