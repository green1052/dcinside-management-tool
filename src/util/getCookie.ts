import {cookieJar} from "../index.js";

export function getCookie(name: string): string {
    return cookieJar.getCookiesSync("https://dcinside.com").find(cookie => cookie.key === name)?.value || "";
}