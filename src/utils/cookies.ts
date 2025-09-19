import Cookies from 'js-cookie';

export const setCookie = (name: string, value: string, options?: Cookies.CookieAttributes) => {
  Cookies.set(name, value, options);
};

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

export const removeCookie = (name: string, options?: Cookies.CookieAttributes) => {
  Cookies.remove(name, options);
};

export const getAllCookies = (): { [key: string]: string } => {
  return Cookies.get();
};