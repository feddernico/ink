// src/auth/user.ts
var GITHUB_API_USER_URL = "https://api.github.com/user";
function createUserManager() {
  let cachedUser = null;
  async function fetchUser(token) {
    if (cachedUser) {
      return cachedUser;
    }
    const response = await fetch(GITHUB_API_USER_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    const data = await response.json();
    cachedUser = {
      login: data.login,
      id: data.id,
      avatarUrl: data.avatar_url,
      name: data.name
    };
    return cachedUser;
  }
  function clearCache() {
    cachedUser = null;
  }
  function getCachedUser() {
    return cachedUser;
  }
  return {
    fetchUser,
    clearCache,
    getCachedUser
  };
}
export {
  createUserManager
};
