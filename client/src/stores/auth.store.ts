import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string,
  username: string,
  email: string,
}

export const useAuthStore = defineStore('auth', () => {
  const user: User = ref(JSON.parse(localStorage.getItem('user')));
  const accessToken: string = ref(localStorage.getItem('token'));

  function saveUser() {
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  function saveAccessToken() {
    localStorage.setItem('token', accessToken.value);
  }

  function setUser(newUser: User): void {
    user.value = newUser;
    saveUser();
  }

  function setAccessToken(newToken: string): void {
    console.log(`access token ${newToken}`)
    accessToken.value = newToken;
    saveAccessToken();
  }

  return { user, accessToken, setUser, setAccessToken }
});
