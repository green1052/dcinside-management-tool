import * as cheerio from "cheerio";
import {deleteArticle} from "./util/deleteArticle.js";

export class Article {
    public id: string;
    public subject?: string;
    public title: string;
    public iconType: string;
    public date: Date;
    public views: string;
    public upvote?: number;
    public nickname: string;
    public uid?: string;
    public ip?: string;
    public isMember: boolean = false;
    public isLogout: boolean = false;

    //public user: string;

    constructor(
        private $: cheerio.Cheerio<cheerio.Element>
    ) {
        this.id = String(this.$.data("no"));
        this.subject = this.$.children(".gall_subject").text();
        this.title = this.$.children(".gall_tit").text().trim().split("\n")[0];
        this.iconType = String(this.$.data("type"));
        this.date = new Date(this.$.children(".gall_date").attr("title")!) ?? "ERROR";
        this.views = this.$.children(".gall_count").text();
        this.upvote = Number(this.$.children(".gall_recommend").text());

        const $writer = this.$.children(".gall_writer");
        this.nickname = $writer.data("nick") as string;
        this.uid = $writer.data("uid") as string || undefined;
        this.ip = $writer.get(0)!.attribs?.["data-ip"] || undefined;

        this.isMember = this.uid !== undefined;
        this.isLogout = this.ip !== undefined;

        // this.user = "";
    }

    public async delete() {
        await deleteArticle(this);
    }
}