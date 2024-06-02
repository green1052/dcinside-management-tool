import got from "got";
import {CookieJar} from "tough-cookie";
import {FileCookieStore} from "tough-cookie-file-store";
import * as cheerio from "cheerio";
import config from "./config.json" with {type: "json"};
import {Article} from "./article.js";
import EventEmitter from "events";
import {serialize} from "./util/serialize.js";
import {baseUrl} from "./util/baseUrl.js";
import {GalleryType} from "./@types/GalleryType.js";
import {deleteArticles} from "./util/deleteArticle.js";

async function login() {
    const response = await client.get("https://sign.dcinside.com/login?s_url=https://www.dcinside.com/");
    const $ = cheerio.load(response.body);

    const params = serialize($("form").serializeArray());
    params["user_id"] = config.userid;
    params["pw"] = config.password;

    await client.post("https://sign.dcinside.com/login/member_check", {
        form: params
    });
}

const newPostEmitter = new EventEmitter();

export const cookieJar = new CookieJar(new FileCookieStore("./cookies.json"));

export const client = got.extend({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    },
    cookieJar: cookieJar,
    http2: true
});

//await login();

let $prev: cheerio.CheerioAPI | undefined = undefined;
let first = true;

const regexList: { [key: string]: RegExp[] } = {
    title: []
};

for (const regex of config.regex.title as string[]) {
    regexList.title.push(new RegExp(regex, "i"));
}

setInterval(async () => {
    const response = await client.get(`${baseUrl(config.galleryType as GalleryType)}/lists/?id=${config.galleryId}`);
    const $ = cheerio.load(response.body);

    console.log(response.body.includes("개념글 해제"));

    const $oldList = $prev ? $prev(".gall_list:not([id]) tbody") : undefined;
    const $newList = $(".gall_list:not([id]) tbody");

    $prev = $;

    if (first) {
        first = false;
        return;
    }

    if ($newList.length === 0 || $newList.children().length === 0)
        return;

    const cached = $oldList
        ? Array.from($oldList.children("tr")).map(element => {
            const $element = $(element);
            return String($element.data("no")) || $element.find(".gall_num").text();
        })
        : [];

    const newPosts: Article[] = [];

    for (const element of Array.from($newList.children()).reverse()) {
        const $element = $(element);
        let no = $element.data("no");

        if (!no) continue;

        no = String(no);

        if (cached.includes(no as string)) continue;

        newPosts.push(new Article($element));
    }

    if (newPosts.length === 0) return;

    newPostEmitter.emit("newPost", newPosts);
}, 5000);


// 정규식 삭제
newPostEmitter.on("newPost", async (articles: Article[]) => {
    const target = [];
    for (const regExp of regexList.title) {
        target.push(...articles.filter(article => regExp.test(article.title)));
    }

    await deleteArticles(target);
});

// 도배 감지
newPostEmitter.on("newPost", async (articles: Article[]) => {
    if (config.spamAlert && articles.length >= config.spamAlertCount) {
        console.log("게시글 도배 감지");
    }
});

// 유동 민주화
newPostEmitter.on("newPost", async (articles: Article[]) => {
    if (!config.logoutUserDemocratization) return;
    await deleteArticles(articles.filter(article => article.isLogout));
});