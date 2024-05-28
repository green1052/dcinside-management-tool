import got from "got";
import {CookieJar} from "tough-cookie";
import {FileCookieStore} from "tough-cookie-file-store";
import * as cheerio from "cheerio";
import config from "./config.json" with {type: "json"};
import {Article} from "./article.js";
import EventEmitter from "events";

interface SerializedField {
    name: string;
    value: string;
}

function serialize(fields: SerializedField[]) {
    const result: Record<string, string> = {};

    for (const field of fields) {
        result[field.name] = field.value;
    }

    return result;
}

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

const cookieJar = new CookieJar(new FileCookieStore("./cookies.json"));

const client = got.extend({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    },
    cookieJar: cookieJar
});

//await login();


let $prev: cheerio.CheerioAPI | undefined = undefined;

setInterval(async () => {
    const response = await client.get("https://gall.dcinside.com/mgallery/board/lists/?id=projectmx");
    const $ = cheerio.load(response.body);

    const $oldList = $prev ? $prev(".gall_list:not([id]) tbody") : undefined;
    const $newList = $(".gall_list:not([id]) tbody");

    if (!$prev) {
        $prev = $;
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

    newPostEmitter.emit("newPost", newPosts);
}, 5000);
