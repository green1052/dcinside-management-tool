import {Article} from "../article.js";
import {client} from "../index.js";
import config from "../config.json" with {type: "json"};
import {getCookie} from "./getCookie.js";

export async function deleteArticle(article: Article) {
}

export async function deleteArticles(articles: Article[]): Promise<boolean> {
    if (articles.length === 0) return false;

    const response = await client.post("https://gall.dcinside.com/ajax/minor_manager_board_ajax/delete_list", {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        },
        form: {
            ci_t: getCookie("ci_c"),
            id: config.galleryId,
            "nos[]": articles.map(article => article.id),
            _GALLTYPE_: "M"
        }
    }).json<{ result: string, msg: string }>();

    return response ? response.result === "success" : false;
}